import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { CARRIER_LABELS, SHIPMENT_STATUS_LABELS } from '@/shared/constants/shipping.js';
import { RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from '@/shared/constants/support.js';
import * as CheckoutOrders from '@/modules/m05-checkout/public.server.js';
import * as repo from './server/repository.js';

/**
 * [SERVER] Hợp đồng công khai của M06 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

function amountOf(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

/**
 * M06-F03 — Vận đơn + sự kiện mới nhất cho M05/M01.
 * Trả `null` khi đơn chưa có vận đơn hoặc không tìm thấy đơn.
 * @param {string} orderRef
 * @returns {Promise<{ shipment: object, events: object[] } | null>}
 */
export async function getShipmentByOrder(orderRef) {
  const found = await CheckoutOrders.getOrderByRef(orderRef);
  if (!found) return null;

  const shipment = await repo.findShipmentByOrder(found.order.id);
  if (!shipment) return null;

  const events = await repo.listShipmentEvents(shipment.id);

  return {
    shipment: {
      shipment_id: shipment.id,
      order_id: shipment.order_id,
      order_code: found.order.order_code,
      carrier_code: shipment.carrier_code,
      carrier_label: CARRIER_LABELS[shipment.carrier_code] ?? shipment.carrier_code,
      tracking_code: shipment.tracking_code,
      shipping_method: shipment.shipping_method,
      shipping_fee: amountOf(shipment.shipping_fee),
      status: shipment.status,
      status_label: SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status,
      expected_delivery_date: shipment.expected_delivery_date,
      delivered_at: shipment.delivered_at,
      failure_count: Number(shipment.failure_count ?? 0),
      note: shipment.note ?? null,
      created_at: shipment.created_at,
      updated_at: shipment.updated_at,
    },
    events: events.map((event) => ({
      event_id: String(event.id),
      status: event.status,
      status_label: SHIPMENT_STATUS_LABELS[event.status] ?? event.status,
      description: event.description ?? null,
      location: event.location ?? null,
      occurred_at: event.occurred_at ?? event.created_at,
    })),
  };
}

/**
 * M06-F10 — Điểm vào duy nhất để webhook/đối tác đổi trạng thái vận đơn.
 * @param {string} orderId
 * @param {string} status SHIPMENT_STATUS
 * @param {{ description?: string, location?: string, occurredAt?: string, payload?: unknown }} [extra]
 */
export async function updateOrderStatusFromShipment(orderId, status, extra = {}) {
  const shipment = await repo.findShipmentByOrder(orderId);
  if (!shipment) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Đơn hàng chưa có vận đơn để cập nhật.');
  }

  if (!SHIPMENT_STATUS_LABELS[status]) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Trạng thái vận đơn không hợp lệ.', {
      details: { allowed: Object.keys(SHIPMENT_STATUS_LABELS) },
    });
  }

  return repo.recordShipmentEventRpc({
    trackingCode: shipment.tracking_code,
    status,
    description: extra.description ?? null,
    location: extra.location ?? null,
    occurredAt: extra.occurredAt ?? null,
    rawPayload: extra.payload ?? null,
  });
}

/**
 * M06-F12 — Yêu cầu đổi trả của một đơn.
 * @param {string} orderRef
 * @returns {Promise<object[]>}
 */
export async function listReturnRequestsForOrder(orderRef) {
  const found = await CheckoutOrders.getOrderByRef(orderRef);
  if (!found) return [];

  const rows = await repo.listReturnRequestsByOrder(found.order.id);
  return rows.map((row) => ({
    return_request_id: row.id,
    return_code: row.return_code,
    order_id: row.order_id,
    order_code: found.order.order_code,
    status: row.status,
    status_label: RETURN_STATUS_LABELS[row.status] ?? row.status,
    reason: row.reason,
    reason_label: RETURN_REASON_LABELS[row.reason] ?? row.reason,
    refund_amount: amountOf(row.refund_amount),
    requested_at: row.requested_at,
    approved_at: row.approved_at ?? null,
    rejected_at: row.rejected_at ?? null,
    received_at: row.received_at ?? null,
    completed_at: row.completed_at ?? null,
  }));
}
