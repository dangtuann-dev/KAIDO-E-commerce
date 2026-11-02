import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { ORDER_STATUS } from '@/shared/constants/order-status.js';
import { PAYMENT_STATUS } from '@/shared/constants/payment.js';
import * as repo from './server/repository.js';

/**
 * [SERVER] Hợp đồng công khai của M05 cho module khác (M06 giao vận, M10 hỗ trợ, cron hệ thống).
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

function amountOf(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

/**
 * M05-F10 — Đơn hàng theo order_code hoặc id, kèm các dòng đã chụp snapshot.
 * Trả `null` khi không tìm thấy.
 * @param {string} orderRef
 * @returns {Promise<{ order: object, items: object[] } | null>}
 */
export async function getOrderByRef(orderRef) {
  const order = await repo.findOrderByRef(orderRef);
  if (!order) return null;

  const items = await repo.listOrderItems(order.id);
  return {
    order,
    items: items.map((row) => ({
      order_item_id: row.id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      sku: row.sku,
      product_name: row.product_name,
      variant_name: row.variant_name,
      unit_price: amountOf(row.unit_price),
      quantity: Number(row.quantity ?? 0),
      line_total: amountOf(row.line_total),
    })),
  };
}

/**
 * M05-F09 — Trạng thái rút gọn cho M06/M10 và cron hủy đơn quá hạn.
 * @param {string} orderRef
 * @returns {Promise<{ order_id: string, order_code: string, status: string, payment_status: string, payment_method: string } | null>}
 */
export async function getOrderStatus(orderRef) {
  const order = await repo.findOrderByRef(orderRef);
  if (!order) return null;

  return {
    order_id: order.id,
    order_code: order.order_code,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    payment_expires_at: order.payment_expires_at,
    total_amount: amountOf(order.total_amount),
  };
}

/**
 * M05-F10 — Kiểm tra quyền sở hữu đơn hàng (M10 dùng trước khi mở ticket).
 * @param {string} orderRef
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isOrderOwnedByUser(orderRef, userId) {
  if (!userId) return false;
  const order = await repo.findOrderByRef(orderRef);
  return Boolean(order?.user_id) && order.user_id === userId;
}

/**
 * M05-F07 — Ghi nhận kết quả thanh toán từ cổng (idempotent).
 * Dùng chung cho IPN VNPAY, webhook MoMo/ZaloPay và xử lý tay của CSKH.
 *
 * @param {{
 *   orderRef: string,
 *   provider: string,
 *   providerTransactionId?: string | null,
 *   amountVnd: number,
 *   status: 'SUCCESS' | 'FAILED',
 *   payload?: unknown,
 *   note?: string | null,
 * }} input
 * @returns {Promise<{ order_id: string, order_code: string, order_status: string, payment_status: string, updated: boolean, transaction_id: string | null }>}
 */
export async function recordPaymentResult(input) {
  const order = await repo.findOrderByRef(input?.orderRef);
  if (!order) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy đơn hàng cho giao dịch thanh toán.');
  }

  const expectedAmount = amountOf(order.total_amount);
  const receivedAmount = amountOf(input?.amountVnd);
  if (expectedAmount !== receivedAmount) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Số tiền thanh toán không khớp với đơn hàng.', {
      details: { expected_amount: expectedAmount, received_amount: receivedAmount },
    });
  }

  const provider = input.provider;
  const providerTransactionId = input.providerTransactionId ?? null;
  const idempotencyKey = `${order.order_code}:${provider}`;

  const transaction =
    (await repo.findPaymentTransactionByProvider(provider, providerTransactionId)) ??
    (await repo.findPaymentTransactionByIdempotencyKey(idempotencyKey)) ??
    (await repo.insertPaymentTransaction({
      order_id: order.id,
      provider,
      transaction_ref: order.order_code,
      provider_transaction_id: providerTransactionId,
      amount: expectedAmount,
      status: PAYMENT_STATUS.PENDING,
      idempotency_key: idempotencyKey,
    }));

  const isSuccess = input.status === PAYMENT_STATUS.SUCCESS;

  // Idempotent: IPN gửi lặp lại không được ghi đè hay tạo thêm giao dịch.
  if (order.payment_status === PAYMENT_STATUS.SUCCESS && isSuccess) {
    return {
      order_id: order.id,
      order_code: order.order_code,
      order_status: order.status,
      payment_status: order.payment_status,
      updated: false,
      transaction_id: transaction?.id ?? null,
    };
  }

  const now = new Date().toISOString();
  await repo.updatePaymentTransaction(transaction.id, {
    status: isSuccess ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED,
    provider_transaction_id: providerTransactionId ?? transaction.provider_transaction_id,
    response_payload: input.payload ?? null,
    paid_at: isSuccess ? now : null,
  });

  if (!isSuccess) {
    return {
      order_id: order.id,
      order_code: order.order_code,
      order_status: order.status,
      payment_status: order.payment_status,
      updated: true,
      transaction_id: transaction.id,
    };
  }

  const nextStatus =
    order.status === ORDER_STATUS.PENDING_PAYMENT ? ORDER_STATUS.PENDING : order.status;

  const updatedOrder = await repo.updateOrder(order.id, {
    payment_status: PAYMENT_STATUS.SUCCESS,
    status: nextStatus,
    confirmed_at: order.confirmed_at ?? now,
  });

  if (nextStatus !== order.status) {
    await repo.insertOrderStatusHistory({
      order_id: order.id,
      from_status: order.status,
      to_status: nextStatus,
      changed_by: null,
      changed_by_role: null,
      change_source: 'SYSTEM',
      note: input.note ?? `${provider} xác nhận thanh toán thành công`,
    });
  }

  return {
    order_id: updatedOrder.id,
    order_code: updatedOrder.order_code,
    order_status: updatedOrder.status,
    payment_status: updatedOrder.payment_status,
    updated: true,
    transaction_id: transaction.id,
  };
}
