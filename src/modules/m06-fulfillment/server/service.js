import 'server-only';

/**
 * [SERVER] TOY-M06 — Đơn hàng & giao vận (M06-F03..F14).
 * - M05 sở hữu đơn/thanh toán; M06 chỉ chuyển trạng thái trong ORDER_TRANSITIONS.
 * - Tạo vận đơn và ghi sự kiện ĐVVC qua RPC PL/pgSQL để nguyên tử (BR-M06-01..04).
 * - ĐVVC thật khi đã cấu hình khóa; chưa cấu hình thì mô phỏng ngoài production.
 * - RMA ghi nhận hoàn tiền nội bộ, không gọi cổng thanh toán.
 */
import { AppError } from '@/server/http/errors.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@/shared/constants/order-status.js';
import { PAYMENT_METHODS } from '@/shared/constants/payment.js';
import {
  CARRIER_LABELS,
  SHIPMENT_STATUS,
  SHIPMENT_STATUS_LABELS,
  SHIPPING_METHOD_LABELS,
} from '@/shared/constants/shipping.js';
import {
  RETURN_REASON_LABELS,
  RETURN_STATUS,
  RETURN_STATUS_LABELS,
} from '@/shared/constants/support.js';
import {
  createCarrierShipment,
  getCarrierTracking,
  listCarrierStatuses,
  parseCarrierWebhook,
  verifyCarrierWebhook,
} from '@/server/integrations/shipping/index.js';
import { expectedDeliveryAt } from '@/server/integrations/shipping/shared.js';
import * as CheckoutOrders from '@/modules/m05-checkout/public.server.js';
import {
  getDefaultWarehouse,
  receiveReturnedStock,
} from '@/modules/m08-inventory/public.server.js';
import * as LoyaltyService from '@/modules/m07-loyalty/public.server.js';
import * as repo from './repository.js';
import {
  DEFAULT_ITEM_WEIGHT_GRAM,
  DEFAULT_PACKAGE_WEIGHT_GRAM,
  FREE_SHIPPING_THRESHOLD_VND,
  INNER_CITY_PROVINCE_CODE,
  MAX_DELIVERY_ATTEMPTS,
  ORDER_NOTIFICATION_TEMPLATES,
  RETURN_WINDOW_DAYS,
} from './constants.js';

const STAFF_ROLES = Object.freeze(['ADMIN', 'STAFF', 'WAREHOUSE_KEEPER']);
const RETURN_MANAGER_ROLES = Object.freeze(['ADMIN', 'STAFF']);
const TRACKING_STEPS = Object.freeze([
  SHIPMENT_STATUS.PENDING,
  SHIPMENT_STATUS.PICKED_UP,
  SHIPMENT_STATUS.IN_TRANSIT,
  SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  SHIPMENT_STATUS.DELIVERED,
]);

/* ------------------------------------------------------------------ */
/* Helper                                                             */
/* ------------------------------------------------------------------ */

function notFound(message) {
  return new AppError(ERROR_CODES.NOT_FOUND, message);
}

function conflict(message, details) {
  return new AppError(ERROR_CODES.CONFLICT, message, { details });
}

function invalid(message, details) {
  return new AppError(ERROR_CODES.VALIDATION_ERROR, message, { details });
}

function forbidden(message) {
  return new AppError(ERROR_CODES.FORBIDDEN, message);
}

function requireUserId(auth) {
  const userId = auth?.userId;
  if (!userId) throw new AppError(ERROR_CODES.UNAUTHORIZED);
  return userId;
}

function amountOf(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

function errorKey(error) {
  const message = typeof error?.message === 'string' ? error.message : '';
  return message.split(':')[0].trim();
}

/**
 * RPC nghiệp vụ dùng RAISE EXCEPTION mã P0001; đổi sang thông điệp tiếng Việt.
 * @param {unknown} error
 * @param {Record<string, [string, string]>} messages
 */
function mapRpcError(error, messages) {
  if (!(error instanceof AppError) || error.code !== ERROR_CODES.CONFLICT) return error;
  const key = errorKey(error);
  const mapping = messages[key];
  if (!mapping) return error;
  return new AppError(mapping[0], mapping[1], { details: { reason: key } });
}

const SHIPMENT_RPC_MESSAGES = Object.freeze({
  ORDER_NOT_FOUND: [ERROR_CODES.NOT_FOUND, 'Không tìm thấy đơn hàng.'],
  SHIPMENT_ALREADY_EXISTS: [
    ERROR_CODES.CONFLICT,
    'Đơn hàng đã có vận đơn đang xử lý. Không thể tạo thêm.',
  ],
  ORDER_NOT_PACKING: [
    ERROR_CODES.CONFLICT,
    'Chỉ tạo vận đơn khi đơn hàng đang ở trạng thái "Đang đóng gói".',
  ],
  INVALID_CARRIER: [ERROR_CODES.VALIDATION_ERROR, 'Đơn vị vận chuyển không hợp lệ.'],
  TRACKING_CODE_REQUIRED: [ERROR_CODES.VALIDATION_ERROR, 'Thiếu mã vận đơn.'],
});

const RETURN_RPC_MESSAGES = Object.freeze({
  ORDER_NOT_FOUND: [ERROR_CODES.NOT_FOUND, 'Không tìm thấy đơn hàng.'],
  ORDER_NOT_COMPLETED: [
    ERROR_CODES.CONFLICT,
    'Chỉ gửi yêu cầu đổi trả cho đơn hàng đã hoàn thành.',
  ],
  RETURN_WINDOW_EXPIRED: [
    ERROR_CODES.CONFLICT,
    `Đã quá ${RETURN_WINDOW_DAYS} ngày kể từ khi nhận hàng nên không thể đổi trả.`,
  ],
  RETURN_ALREADY_EXISTS: [
    ERROR_CODES.CONFLICT,
    'Đơn hàng đã có yêu cầu đổi trả đang được xử lý.',
  ],
  RETURN_ITEM_INVALID: [
    ERROR_CODES.VALIDATION_ERROR,
    'Có sản phẩm không thuộc đơn hàng này.',
  ],
  RETURN_QUANTITY_INVALID: [
    ERROR_CODES.VALIDATION_ERROR,
    'Số lượng đổi trả vượt quá số lượng đã mua.',
  ],
  RETURN_EVIDENCE_REQUIRED: [
    ERROR_CODES.VALIDATION_ERROR,
    'Cần ít nhất 1 ảnh hiện trạng để đổi trả.',
  ],
  INVALID_RETURN_REASON: [ERROR_CODES.VALIDATION_ERROR, 'Lý do đổi trả không hợp lệ.'],
});

/* ------------------------------------------------------------------ */
/* M06-F08 — Tính phí vận chuyển                                     */
/* ------------------------------------------------------------------ */

function pickFeeRule(rules, { provinceCode, innerCity }) {
  const exact = rules.find((rule) => rule.province_code && rule.province_code === provinceCode);
  if (exact) return exact;

  if (innerCity) {
    const inner = rules.find((rule) => rule.region_type === 'INNER_CITY');
    if (inner) return inner;
  }

  const provinceRules = rules.filter((rule) => rule.region_type === 'PROVINCE');
  if (provinceRules.length > 0) {
    return provinceRules.reduce((lowest, rule) =>
      Number(rule.base_fee) < Number(lowest.base_fee) ? rule : lowest,
    );
  }
  return rules[0] ?? null;
}

function weightSurcharge(weightGram) {
  if (weightGram <= 1_000) return 0;
  return Math.ceil((weightGram - 1_000) / 1_000) * 5_000;
}

function computeFeeVnd({ baseFee, weightGram, method, innerCity }) {
  let fee = Number(baseFee) + weightSurcharge(weightGram);
  if (method === 'EXPRESS') fee *= 1.5;
  fee = Math.round(fee / 1_000) * 1_000;
  if (!innerCity && method === 'STANDARD') {
    fee = Math.min(fee, BUSINESS_RULES.SHIPPING.PROVINCE_FEE_MAX_VND);
  }
  return Math.max(0, fee);
}

/**
 * M06-F08 — Phí giao hàng theo khu vực/khối lượng; miễn phí từ ngưỡng.
 * @param {{ body: { address: object, weight: number, total_amount: number, shipping_method?: string } }} input
 */
export async function calculateShippingFee({ body }) {
  const method = body.shipping_method || 'STANDARD';
  const innerCity = body.address.province_code === INNER_CITY_PROVINCE_CODE;
  const weightGram = Math.max(1, Math.round(Number(body.weight) || 0));

  const rules = await repo.listActiveShippingFeeRules(method);
  const rule = pickFeeRule(rules, {
    provinceCode: body.address.province_code,
    innerCity,
  });

  const baseFee =
    Number(rule?.base_fee) ||
    (innerCity
      ? BUSINESS_RULES.SHIPPING.INNER_CITY_FEE_VND
      : BUSINESS_RULES.SHIPPING.PROVINCE_FEE_MIN_VND);
  const threshold = amountOf(rule?.free_shipping_threshold) || FREE_SHIPPING_THRESHOLD_VND;
  const computedFee = computeFeeVnd({ baseFee, weightGram, method, innerCity });
  const freeShipping = body.total_amount >= threshold;
  const shippingFee = freeShipping ? 0 : computedFee;
  const deliveryDays = method === 'EXPRESS' ? 1 : 3;

  const carrierOptions = listCarrierStatuses().map((carrier) => ({
    code: carrier.code,
    label: CARRIER_LABELS[carrier.code] ?? carrier.code,
    mode: carrier.mode,
    fee_vnd: shippingFee,
    estimated_delivery_days: deliveryDays,
  }));

  return {
    shipping_fee: shippingFee,
    shipping_method: method,
    shipping_method_label: SHIPPING_METHOD_LABELS[method] ?? method,
    region: innerCity ? 'INNER_CITY' : 'PROVINCE',
    billable_weight_gram: weightGram,
    base_fee: baseFee,
    free_shipping_applied: freeShipping,
    free_shipping_threshold: threshold,
    estimated_delivery_days: deliveryDays,
    expected_delivery_at: expectedDeliveryAt(method),
    fee_rule: rule ? { id: rule.id, name: rule.name, region_type: rule.region_type } : null,
    carrier_options: carrierOptions,
  };
}

/* ------------------------------------------------------------------ */
/* M06-F09 — Tạo vận đơn & bàn giao ĐVVC                             */
/* ------------------------------------------------------------------ */

/**
 * @param {{ auth: object, params: { orderRef: string }, body: { carrier_code: string, pickup_time?: string } }} input
 */
export async function createFulfillment({ auth, params, body }) {
  const found = await CheckoutOrders.getOrderByRef(params.orderRef);
  if (!found) throw notFound('Không tìm thấy đơn hàng.');
  const { order, items } = found;

  if (order.status !== ORDER_STATUS.PACKING) {
    throw conflict(
      `Chỉ tạo vận đơn khi đơn hàng đang ở trạng thái "Đang đóng gói". Hiện tại: "${
        ORDER_STATUS_LABELS[order.status] ?? order.status
      }".`,
      { status: order.status, required: ORDER_STATUS.PACKING },
    );
  }

  const existing = await repo.findShipmentByOrder(order.id);
  if (existing) {
    throw conflict(`Đơn ${order.order_code} đã có vận đơn ${existing.tracking_code}.`, {
      tracking_code: existing.tracking_code,
    });
  }

  const weightGram = Math.max(
    DEFAULT_PACKAGE_WEIGHT_GRAM,
    items.reduce((total, item) => total + DEFAULT_ITEM_WEIGHT_GRAM * item.quantity, 0),
  );

  const carrierResult = await createCarrierShipment({
    carrierCode: body.carrier_code,
    orderRef: order.order_code,
    toName: order.recipient_name,
    toPhone: order.recipient_phone,
    toAddress: [order.shipping_address, order.shipping_ward, order.shipping_district, order.shipping_province]
      .filter(Boolean)
      .join(', '),
    toProvince: order.shipping_province,
    toDistrict: order.shipping_district,
    toWard: order.shipping_ward,
    toProvinceId: Number(order.shipping_province_code) || undefined,
    toDistrictId: Number(order.shipping_district_code) || undefined,
    toWardId: Number(order.shipping_ward_code) || undefined,
    toWardCode: order.shipping_ward_code,
    weightGram,
    codVnd: order.payment_method === PAYMENT_METHODS.COD ? amountOf(order.total_amount) : 0,
    valueVnd: amountOf(order.total_amount),
    method: order.shipping_method,
    items: items.map((item) => ({
      name: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      priceVnd: item.unit_price,
      weightGram: DEFAULT_ITEM_WEIGHT_GRAM,
    })),
  });

  const note = body.pickup_time
    ? `Hẹn ĐVVC lấy hàng lúc ${body.pickup_time}`
    : `Bàn giao cho ${body.carrier_code}`;

  let result;
  try {
    result = await repo.createShipmentRpc({
      orderRef: order.order_code,
      carrierCode: body.carrier_code,
      trackingCode: carrierResult.trackingCode,
      expectedDeliveryDate: String(carrierResult.expectedDeliveryAt).slice(0, 10),
      note,
      changedBy: auth?.userId ?? null,
    });
  } catch (error) {
    throw mapRpcError(error, SHIPMENT_RPC_MESSAGES);
  }

  await notifyOrderStatus({
    order: { ...order, status: ORDER_STATUS.SHIPPING },
    template: ORDER_NOTIFICATION_TEMPLATES.SHIPPED,
    extra: {
      tracking_code: result?.tracking_code ?? carrierResult.trackingCode,
      carrier_code: body.carrier_code,
      carrier_label: CARRIER_LABELS[body.carrier_code] ?? body.carrier_code,
    },
  });

  return {
    shipment_id: result?.shipment_id ?? null,
    order_id: result?.order_id ?? order.id,
    order_code: result?.order_code ?? order.order_code,
    carrier_code: body.carrier_code,
    carrier_label: CARRIER_LABELS[body.carrier_code] ?? body.carrier_code,
    tracking_code: result?.tracking_code ?? carrierResult.trackingCode,
    shipment_status: result?.status ?? SHIPMENT_STATUS.PENDING,
    previous_order_status: result?.previous_order_status ?? order.status,
    order_status: ORDER_STATUS.SHIPPING,
    expected_delivery_at: carrierResult.expectedDeliveryAt,
    mode: carrierResult.mode,
  };
}

/* ------------------------------------------------------------------ */
/* M06-F03 — Theo dõi vận chuyển                                     */
/* ------------------------------------------------------------------ */

function canViewOrder(order, auth) {
  if (STAFF_ROLES.includes(auth?.role)) return true;
  return Boolean(order.user_id) && order.user_id === auth?.userId;
}

function buildSteps(events, currentStatus) {
  const reached = new Set(events.map((event) => event.status));
  const reachedIndex = events.reduce(
    (max, event) => Math.max(max, TRACKING_STEPS.indexOf(event.status)),
    -1,
  );
  const activeIndex = Math.max(TRACKING_STEPS.indexOf(currentStatus), reachedIndex);

  return TRACKING_STEPS.map((status, index) => ({
    status,
    label: SHIPMENT_STATUS_LABELS[status] ?? status,
    reached: reached.has(status) || index <= activeIndex,
    current: status === currentStatus,
  }));
}

/**
 * M06-F03 — Timeline vận chuyển của chủ đơn.
 * @param {{ auth: object, params: { orderRef: string } }} input
 */
export async function getOrderTracking({ auth, params }) {
  requireUserId(auth);
  const found = await CheckoutOrders.getOrderByRef(params.orderRef);
  if (!found) throw notFound('Không tìm thấy đơn hàng.');
  const { order } = found;
  if (!canViewOrder(order, auth)) {
    throw forbidden('Bạn không có quyền xem vận chuyển của đơn hàng này.');
  }

  const shipment = await repo.findShipmentByOrder(order.id);
  if (!shipment) {
    return {
      order_code: order.order_code,
      order_status: order.status,
      order_status_label: ORDER_STATUS_LABELS[order.status] ?? order.status,
      tracking_code: null,
      carrier_code: null,
      carrier_label: null,
      current_status: null,
      current_status_label: null,
      expected_delivery_date: null,
      delivered_at: null,
      failure_count: 0,
      max_delivery_attempts: MAX_DELIVERY_ATTEMPTS,
      steps: [],
      timeline: [],
      message: 'Đơn hàng chưa được bàn giao cho đơn vị vận chuyển.',
    };
  }

  const events = await repo.listShipmentEvents(shipment.id);
  let timeline = events.map((event) => ({
    event_id: String(event.id),
    status: event.status,
    status_label: SHIPMENT_STATUS_LABELS[event.status] ?? event.status,
    description: event.description ?? null,
    location: event.location ?? null,
    occurred_at: event.occurred_at ?? event.created_at,
    source: 'CARRIER',
  }));

  // Chưa có webhook (ví dụ môi trường mô phỏng) → hiển thị hành trình dự kiến.
  if (timeline.length === 0 && shipment.tracking_code) {
    try {
      const live = await getCarrierTracking({
        carrierCode: shipment.carrier_code,
        trackingCode: shipment.tracking_code,
        createdAt: shipment.created_at,
      });
      timeline = (live?.events ?? []).map((event) => ({
        event_id: null,
        status: event.status,
        status_label: SHIPMENT_STATUS_LABELS[event.status] ?? event.status,
        description: event.description ?? null,
        location: null,
        occurred_at: event.at,
        source: live.mode === 'simulation' ? 'SIMULATION' : 'CARRIER',
      }));
    } catch {
      // Không chặn trang theo dõi khi ĐVVC tạm thời không phản hồi.
    }
  }

  const currentStatus =
    timeline.some((event) => event.source === 'SIMULATION') && timeline.length > 0
      ? timeline[timeline.length - 1].status
      : shipment.status;

  return {
    order_code: order.order_code,
    order_status: order.status,
    order_status_label: ORDER_STATUS_LABELS[order.status] ?? order.status,
    shipment_id: shipment.id,
    tracking_code: shipment.tracking_code,
    carrier_code: shipment.carrier_code,
    carrier_label: CARRIER_LABELS[shipment.carrier_code] ?? shipment.carrier_code,
    shipping_method: shipment.shipping_method,
    shipping_method_label: SHIPPING_METHOD_LABELS[shipment.shipping_method] ?? shipment.shipping_method,
    current_status: currentStatus,
    current_status_label: SHIPMENT_STATUS_LABELS[currentStatus] ?? currentStatus,
    expected_delivery_date: shipment.expected_delivery_date,
    delivered_at: shipment.delivered_at,
    failure_count: Number(shipment.failure_count ?? 0),
    max_delivery_attempts: MAX_DELIVERY_ATTEMPTS,
    steps: buildSteps(timeline, currentStatus),
    timeline,
  };
}

/* ------------------------------------------------------------------ */
/* M06-F10, F11 — Webhook ĐVVC                                       */
/* ------------------------------------------------------------------ */

function resolveCarrierCode(request, body) {
  const header =
    request?.headers?.get?.('x-carrier-code') ?? request?.headers?.get?.('x-carrier') ?? null;
  const raw = header || body?.carrier_code || body?.carrier || null;
  return raw ? String(raw).toUpperCase() : null;
}

function parseWebhookBody(body) {
  if (body && typeof body === 'object') return body;
  if (typeof body !== 'string' || !body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw invalid('Nội dung webhook không phải JSON hợp lệ.');
  }
}

function templateForShipment({ shipmentStatus, orderStatus, previousOrderStatus }) {
  if (orderStatus === ORDER_STATUS.COMPLETED && previousOrderStatus !== ORDER_STATUS.COMPLETED) {
    return ORDER_NOTIFICATION_TEMPLATES.COMPLETED;
  }
  switch (shipmentStatus) {
    case SHIPMENT_STATUS.PICKED_UP:
      return ORDER_NOTIFICATION_TEMPLATES.SHIPPED;
    case SHIPMENT_STATUS.FAILED:
      return ORDER_NOTIFICATION_TEMPLATES.DELIVERY_FAILED;
    case SHIPMENT_STATUS.RETURNING:
      return ORDER_NOTIFICATION_TEMPLATES.RETURNING;
    case SHIPMENT_STATUS.RETURNED:
      return ORDER_NOTIFICATION_TEMPLATES.RETURNED;
    default:
      return null;
  }
}

async function restockReturnedShipment(found) {
  const warehouse = await getDefaultWarehouse();
  if (!warehouse?.id) return null;

  const items = found.items
    .filter((item) => item.sku)
    .map((item) => ({ sku: item.sku, quantity: item.quantity, condition: 'SELLABLE' }));
  if (items.length === 0) return null;

  try {
    return await receiveReturnedStock({
      order_ref: found.order.order_code,
      warehouse_id: warehouse.id,
      items,
      note: 'Nhập lại hàng hoàn theo webhook ĐVVC',
      auth: null,
    });
  } catch (error) {
    console.error('[m06] restock returned shipment failed', found.order.order_code, error?.message);
    return null;
  }
}

async function awardLoyaltyPoints(orderId) {
  try {
    return await LoyaltyService.awardPointsForOrder(orderId);
  } catch (error) {
    if (error?.code !== ERROR_CODES.NOT_IMPLEMENTED) {
      console.error('[m06] award loyalty points failed', orderId, error?.message);
    }
    return null;
  }
}

/**
 * M06-F10/F11 — Nhận webhook ĐVVC: xác thực HMAC, ghi sự kiện, đồng bộ trạng thái.
 * @param {{ request: Request, body: unknown, rawBody: string }} input
 */
export async function handleCarrierWebhook({ request, body, rawBody }) {
  const carrierCode = resolveCarrierCode(request, body);
  if (!carrierCode) {
    throw invalid('Thiếu mã đơn vị vận chuyển (header x-carrier-code).');
  }

  const verification = verifyCarrierWebhook({
    carrierCode,
    rawBody: rawBody ?? '',
    headers: request?.headers,
  });
  if (!verification.valid) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Chữ ký webhook không hợp lệ.', {
      details: { reason: verification.reason },
    });
  }

  const payload = parseWebhookBody(body);
  const parsed = parseCarrierWebhook({ carrierCode, body: payload });

  if (!parsed.trackingCode) {
    return { success: true, processed: false, reason: 'MISSING_TRACKING_CODE' };
  }
  if (!parsed.status) {
    return { success: true, processed: false, reason: 'UNSUPPORTED_STATUS' };
  }

  const duplicate = parsed.occurredAt
    ? await repo.findShipmentEventByExternal({
        trackingCode: parsed.trackingCode,
        status: parsed.status,
        occurredAt: parsed.occurredAt,
      })
    : null;
  if (duplicate) {
    return { success: true, processed: false, duplicate: true };
  }

  let result;
  try {
    result = await repo.recordShipmentEventRpc({
      trackingCode: parsed.trackingCode,
      status: parsed.status,
      description: parsed.description,
      location: parsed.location,
      occurredAt: parsed.occurredAt,
      rawPayload: payload,
    });
  } catch (error) {
    if (error instanceof AppError && errorKey(error) === 'SHIPMENT_NOT_FOUND') {
      console.warn('[m06] webhook for unknown tracking code', parsed.trackingCode, carrierCode);
      return { success: true, processed: false, reason: 'SHIPMENT_NOT_FOUND' };
    }
    throw mapRpcError(error, {
      SHIPMENT_NOT_FOUND: [ERROR_CODES.NOT_FOUND, 'Không tìm thấy vận đơn.'],
      INVALID_SHIPMENT_STATUS: [
        ERROR_CODES.VALIDATION_ERROR,
        'Trạng thái vận đơn không hợp lệ.',
      ],
    });
  }

  const template = templateForShipment({
    shipmentStatus: parsed.status,
    orderStatus: result?.order_status,
    previousOrderStatus: result?.previous_order_status,
  });

  const needsOrder =
    parsed.status === SHIPMENT_STATUS.RETURNED ||
    Boolean(template) ||
    result?.order_status === ORDER_STATUS.COMPLETED;
  const foundOrder =
    needsOrder && result?.order_code
      ? await CheckoutOrders.getOrderByRef(result.order_code)
      : null;

  let restocked = null;
  // Chỉ nhập lại kho khi đơn thực sự vừa chuyển sang RETURNED. Webhook lặp lại
  // (previous = RETURNED) hoặc RETURNED trực tiếp từ SHIPPING không được restock.
  if (
    parsed.status === SHIPMENT_STATUS.RETURNED &&
    foundOrder &&
    result?.order_status === ORDER_STATUS.RETURNED &&
    result?.previous_order_status !== ORDER_STATUS.RETURNED
  ) {
    restocked = await restockReturnedShipment(foundOrder);
  }

  if (
    result?.order_status === ORDER_STATUS.COMPLETED &&
    result?.previous_order_status !== ORDER_STATUS.COMPLETED
  ) {
    await awardLoyaltyPoints(result.order_id);
  }

  if (template && foundOrder?.order) {
    await notifyOrderStatus({
      order: foundOrder.order,
      template,
      extra: {
        tracking_code: parsed.trackingCode,
        carrier_code: carrierCode,
        shipment_status: parsed.status,
        failure_count: result?.failure_count ?? 0,
        order_id: result?.order_id ?? null,
      },
    });
  }

  return {
    success: true,
    processed: true,
    order_id: result?.order_id ?? null,
    order_code: result?.order_code ?? null,
    shipment_status: parsed.status,
    previous_order_status: result?.previous_order_status ?? null,
    order_status: result?.order_status ?? null,
    failure_count: result?.failure_count ?? 0,
    restocked: Boolean(restocked),
  };
}

/* ------------------------------------------------------------------ */
/* M06-F12 — Đổi trả & hoàn tiền (RMA)                               */
/* ------------------------------------------------------------------ */

function toReturnSummary(row) {
  const items = Array.isArray(row.return_request_items) ? row.return_request_items : [];
  const order = row.orders ?? {};

  return {
    return_request_id: row.id,
    return_code: row.return_code,
    order_id: row.order_id,
    order_code: order.order_code ?? null,
    order_status: order.status ?? null,
    status: row.status,
    status_label: RETURN_STATUS_LABELS[row.status] ?? row.status,
    reason: row.reason,
    reason_label: RETURN_REASON_LABELS[row.reason] ?? row.reason,
    description: row.description ?? null,
    evidence_urls: Array.isArray(row.evidence_urls) ? row.evidence_urls : [],
    refund_amount: amountOf(row.refund_amount),
    item_count: items.length,
    total_quantity: items.reduce((total, item) => total + Number(item.quantity ?? 0), 0),
    customer: {
      name: order.recipient_name ?? null,
      phone: order.recipient_phone ?? null,
      email: order.recipient_email ?? null,
    },
    admin_note: row.admin_note ?? null,
    requested_at: row.requested_at,
    approved_at: row.approved_at ?? null,
    rejected_at: row.rejected_at ?? null,
    received_at: row.received_at ?? null,
    completed_at: row.completed_at ?? null,
  };
}

/**
 * M06-F12 — Khách gửi yêu cầu đổi trả trong cửa sổ 7 ngày.
 * @param {{ auth: object, params: { orderRef: string }, body: object }} input
 */
export async function createReturnRequest({ auth, params, body }) {
  const userId = requireUserId(auth);
  const found = await CheckoutOrders.getOrderByRef(params.orderRef);
  if (!found) throw notFound('Không tìm thấy đơn hàng.');

  const { order, items } = found;
  const isOwner = Boolean(order.user_id) && order.user_id === userId;
  if (!isOwner && !RETURN_MANAGER_ROLES.includes(auth?.role)) {
    throw forbidden('Bạn không có quyền yêu cầu đổi trả đơn hàng này.');
  }

  const requestedIds = new Set(body.item_ids);
  for (const itemId of requestedIds) {
    if (!items.some((item) => item.order_item_id === itemId)) {
      throw invalid('Có sản phẩm không thuộc đơn hàng này.', { order_item_id: itemId });
    }
  }

  const returnItems = [...requestedIds].map((orderItemId) => ({
    order_item_id: orderItemId,
  }));

  let result;
  try {
    result = await repo.createReturnRequestRpc({
      orderRef: order.order_code,
      reason: body.reason,
      description: body.note ?? null,
      evidenceUrls: body.images,
      items: returnItems,
      userId,
      returnWindowDays: RETURN_WINDOW_DAYS,
    });
  } catch (error) {
    throw mapRpcError(error, RETURN_RPC_MESSAGES);
  }

  await notifyOrderStatus({
    order,
    template: ORDER_NOTIFICATION_TEMPLATES.RETURN_REQUESTED,
    extra: {
      return_code: result?.return_code,
      refund_amount: amountOf(result?.refund_amount),
    },
  });

  return {
    return_request_id: result?.return_request_id ?? null,
    return_code: result?.return_code ?? null,
    order_id: result?.order_id ?? order.id,
    order_code: result?.order_code ?? order.order_code,
    status: result?.status ?? RETURN_STATUS.PENDING_APPROVAL,
    status_label: RETURN_STATUS_LABELS[result?.status ?? RETURN_STATUS.PENDING_APPROVAL],
    refund_amount: amountOf(result?.refund_amount),
    requested_at: result?.requested_at ?? null,
    return_window_days: RETURN_WINDOW_DAYS,
  };
}

/**
 * M06-F12 — Nhân viên duyệt/từ chối yêu cầu đổi trả.
 * @param {{ auth: object, params: { id: string }, body: { action: 'APPROVE' | 'REJECT', note?: string } }} input
 */
export async function approveReturnRequest({ auth, params, body }) {
  const request = await repo.findReturnRequestById(params.id);
  if (!request) throw notFound('Không tìm thấy yêu cầu đổi trả.');

  if (request.status !== RETURN_STATUS.PENDING_APPROVAL) {
    throw conflict(
      `Yêu cầu ${request.return_code} đang ở trạng thái "${
        RETURN_STATUS_LABELS[request.status] ?? request.status
      }" nên không thể duyệt lại.`,
      { status: request.status },
    );
  }

  const now = new Date().toISOString();
  const order = request.orders ?? {};
  const approve = body.action === 'APPROVE';

  if (!approve) {
    const updated = await repo.updateReturnRequestStatus(params.id, RETURN_STATUS.REJECTED, {
      rejected_at: now,
      admin_note: body.note ?? null,
    });
    await notifyReturnUpdate(updated, ORDER_NOTIFICATION_TEMPLATES.RETURN_REJECTED, order);
    return {
      return_request_id: updated?.id ?? params.id,
      return_code: updated?.return_code ?? request.return_code,
      status: RETURN_STATUS.REJECTED,
      status_label: RETURN_STATUS_LABELS[RETURN_STATUS.REJECTED],
      refund_amount: amountOf(request.refund_amount),
      order_status: order.status ?? null,
    };
  }

  if (order.status !== ORDER_STATUS.COMPLETED) {
    throw conflict(
      `Chỉ duyệt đổi trả cho đơn đã hoàn thành. Đơn ${order.order_code ?? ''} đang ở trạng thái "${
        ORDER_STATUS_LABELS[order.status] ?? order.status
      }".`,
      { status: order.status },
    );
  }

  await repo.transitionOrderRpc({
    orderRef: order.order_code,
    fromStatus: ORDER_STATUS.COMPLETED,
    toStatus: ORDER_STATUS.RETURNING,
    source: 'STAFF',
    note: body.note || `Duyệt yêu cầu đổi trả ${request.return_code}`,
    changedBy: auth?.userId ?? null,
  });

  const updated = await repo.updateReturnRequestStatus(params.id, RETURN_STATUS.APPROVED, {
    approved_at: now,
    admin_note: body.note ?? null,
  });

  await notifyReturnUpdate(updated, ORDER_NOTIFICATION_TEMPLATES.RETURN_APPROVED, {
    ...order,
    status: ORDER_STATUS.RETURNING,
  });

  return {
    return_request_id: updated?.id ?? params.id,
    return_code: updated?.return_code ?? request.return_code,
    status: RETURN_STATUS.APPROVED,
    status_label: RETURN_STATUS_LABELS[RETURN_STATUS.APPROVED],
    refund_amount: amountOf(request.refund_amount),
    order_status: ORDER_STATUS.RETURNING,
  };
}

async function notifyReturnUpdate(request, template, order) {
  if (!request) return;
  await notifyOrderStatus({
    order,
    template,
    extra: {
      return_code: request.return_code,
      return_status: request.status,
      refund_amount: amountOf(request.refund_amount),
    },
  });
}

/**
 * M06-F12 — Danh sách yêu cầu đổi trả (Admin).
 * @param {{ query: object }} input
 */
export async function listReturnRequests({ query = {} }) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const { rows, total } = await repo.listReturnRequests({
    status: query.status,
    fromDate: query.from_date,
    toDate: query.to_date,
    page,
    limit,
  });

  return {
    items: rows.map(toReturnSummary),
    pagination: {
      page,
      limit,
      total,
      total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

/**
 * M06-F11/F12 — Nhận hàng hoàn, hoàn tiền hoặc hủy yêu cầu.
 * @param {{ auth: object, params: { id: string }, body: object }} input
 */
export async function updateReturnStatus({ auth, params, body }) {
  const request = await repo.findReturnRequestById(params.id);
  if (!request) throw notFound('Không tìm thấy yêu cầu đổi trả.');

  const now = new Date().toISOString();
  const order = request.orders ?? {};

  if (body.status === RETURN_STATUS.RECEIVED) {
    if (request.status !== RETURN_STATUS.APPROVED) {
      throw conflict('Chỉ ghi nhận hàng hoàn khi yêu cầu đã được duyệt.', {
        status: request.status,
      });
    }

    const warehouse = body.warehouse_id
      ? { id: body.warehouse_id }
      : await getDefaultWarehouse();
    if (!warehouse?.id) {
      throw conflict('Chưa có kho mặc định để nhập hàng hoàn. Hãy cấu hình kho M08.');
    }

    const items = (request.return_request_items ?? [])
      .map((row) => ({
        sku: row.order_items?.sku ?? null,
        quantity: Number(row.quantity ?? 0),
        condition: body.condition ?? 'SELLABLE',
      }))
      .filter((item) => item.sku && item.quantity > 0);

    if (items.length === 0) {
      throw conflict('Không xác định được SKU của sản phẩm cần nhập lại kho.');
    }

    const restocked = await receiveReturnedStock({
      order_ref: order.order_code,
      warehouse_id: warehouse.id,
      items,
      note: body.note || `Nhập hàng hoàn ${request.return_code}`,
      auth,
    });

    const updated = await repo.updateReturnRequestStatus(params.id, RETURN_STATUS.RECEIVED, {
      received_at: now,
      admin_note: body.note ?? request.admin_note ?? null,
    });

    await notifyReturnUpdate(updated, ORDER_NOTIFICATION_TEMPLATES.RETURN_RECEIVED, order);

    return {
      return_request_id: updated?.id ?? params.id,
      return_code: updated?.return_code ?? request.return_code,
      status: RETURN_STATUS.RECEIVED,
      status_label: RETURN_STATUS_LABELS[RETURN_STATUS.RECEIVED],
      refund_amount: amountOf(request.refund_amount),
      warehouse_id: warehouse.id,
      restocked,
      order_status: order.status ?? null,
    };
  }

  if (body.status === RETURN_STATUS.REFUNDED) {
    if (!RETURN_MANAGER_ROLES.includes(auth?.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'Chỉ nhân viên bán hàng hoặc quản trị viên được xác nhận hoàn tiền.');
    }
    if (request.status !== RETURN_STATUS.RECEIVED) {
      throw conflict('Chỉ hoàn tiền sau khi đã nhận hàng hoàn.', {
        status: request.status,
      });
    }

    let orderStatus = order.status;
    if (order.status === ORDER_STATUS.RETURNING) {
      await repo.transitionOrderRpc({
        orderRef: order.order_code,
        fromStatus: ORDER_STATUS.RETURNING,
        toStatus: ORDER_STATUS.RETURNED,
        source: 'STAFF',
        note: body.note || `Hoàn tiền yêu cầu ${request.return_code}`,
        changedBy: auth?.userId ?? null,
      });
      orderStatus = ORDER_STATUS.RETURNED;
    }

    // M07-F04 — hoàn lại điểm đã tiêu khi đơn hoàn tất trả hàng (idempotent).
    try {
      await LoyaltyService.refundPointsForOrder(order.id);
    } catch {
      // Đơn không dùng điểm hoặc M07 lỗi tạm thời: không chặn xác nhận hoàn tiền.
    }

    const updated = await repo.updateReturnRequestStatus(params.id, RETURN_STATUS.REFUNDED, {
      completed_at: now,
      admin_note: body.note ?? request.admin_note ?? null,
    });

    await notifyReturnUpdate(updated, ORDER_NOTIFICATION_TEMPLATES.RETURN_REFUNDED, {
      ...order,
      status: orderStatus,
    });

    return {
      return_request_id: updated?.id ?? params.id,
      return_code: updated?.return_code ?? request.return_code,
      status: RETURN_STATUS.REFUNDED,
      status_label: RETURN_STATUS_LABELS[RETURN_STATUS.REFUNDED],
      refund_amount: amountOf(request.refund_amount),
      order_status: orderStatus,
    };
  }

  if (body.status === RETURN_STATUS.CANCELLED) {
    if (!RETURN_MANAGER_ROLES.includes(auth?.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'Chỉ nhân viên bán hàng hoặc quản trị viên được hủy yêu cầu đổi trả.');
    }
    if (request.status !== RETURN_STATUS.PENDING_APPROVAL) {
      throw conflict('Chỉ hủy yêu cầu đang chờ duyệt.', { status: request.status });
    }

    const updated = await repo.updateReturnRequestStatus(params.id, RETURN_STATUS.CANCELLED, {
      admin_note: body.note ?? request.admin_note ?? null,
    });

    return {
      return_request_id: updated?.id ?? params.id,
      return_code: updated?.return_code ?? request.return_code,
      status: RETURN_STATUS.CANCELLED,
      status_label: RETURN_STATUS_LABELS[RETURN_STATUS.CANCELLED],
      refund_amount: amountOf(request.refund_amount),
      order_status: order.status ?? null,
    };
  }

  throw invalid('Trạng thái đổi trả không được hỗ trợ.', { status: body.status });
}

/* ------------------------------------------------------------------ */
/* M06-F14 — Danh sách vận đơn & thống kê giao hàng                  */
/* ------------------------------------------------------------------ */

function summarizeShipment(row) {
  const order = row.orders ?? {};
  return {
    shipment_id: row.id,
    order_id: row.order_id,
    order_code: order.order_code ?? null,
    order_status: order.status ?? null,
    order_status_label: ORDER_STATUS_LABELS[order.status] ?? order.status ?? null,
    carrier_code: row.carrier_code,
    carrier_label: CARRIER_LABELS[row.carrier_code] ?? row.carrier_code,
    tracking_code: row.tracking_code,
    shipping_method: row.shipping_method,
    shipping_method_label: SHIPPING_METHOD_LABELS[row.shipping_method] ?? row.shipping_method,
    shipping_fee: amountOf(row.shipping_fee),
    status: row.status,
    status_label: SHIPMENT_STATUS_LABELS[row.status] ?? row.status,
    expected_delivery_date: row.expected_delivery_date,
    delivered_at: row.delivered_at,
    failure_count: Number(row.failure_count ?? 0),
    note: row.note ?? null,
    customer: {
      name: order.recipient_name ?? null,
      phone: order.recipient_phone ?? null,
      email: order.recipient_email ?? null,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function summarizeStats(rows) {
  const byCarrier = new Map();
  let delivered = 0;
  let failed = 0;
  let active = 0;

  for (const row of rows) {
    if (row.status === SHIPMENT_STATUS.DELIVERED) delivered += 1;
    else if (
      [SHIPMENT_STATUS.FAILED, SHIPMENT_STATUS.RETURNING, SHIPMENT_STATUS.RETURNED].includes(
        row.status,
      )
    ) {
      failed += 1;
    } else {
      active += 1;
    }

    const bucket = byCarrier.get(row.carrier_code) ?? {
      carrier_code: row.carrier_code,
      carrier_label: CARRIER_LABELS[row.carrier_code] ?? row.carrier_code,
      total: 0,
      delivered: 0,
      failed: 0,
    };
    bucket.total += 1;
    if (row.status === SHIPMENT_STATUS.DELIVERED) bucket.delivered += 1;
    if (
      [SHIPMENT_STATUS.FAILED, SHIPMENT_STATUS.RETURNING, SHIPMENT_STATUS.RETURNED].includes(
        row.status,
      )
    ) {
      bucket.failed += 1;
    }
    byCarrier.set(row.carrier_code, bucket);
  }

  const total = rows.length;
  const rate = (value) => (total > 0 ? Math.round((value / total) * 1_000) / 10 : 0);

  return {
    total,
    delivered,
    failed,
    active,
    success_rate: rate(delivered),
    by_carrier: [...byCarrier.values()].map((bucket) => ({
      ...bucket,
      success_rate:
        bucket.total > 0 ? Math.round((bucket.delivered / bucket.total) * 1_000) / 10 : 0,
    })),
  };
}

/**
 * M06-F14 — Danh sách vận đơn kèm thống kê tỷ lệ giao thành công.
 * @param {{ query: object }} input
 */
export async function listShipments({ query = {} }) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const filters = {
    status: query.status,
    carrierCode: query.carrier_code,
    fromDate: query.from_date,
    toDate: query.to_date,
    page,
    limit,
  };

  const [{ rows, total }, statRows] = await Promise.all([
    repo.listShipments(filters),
    repo.listShipmentStats({
      carrierCode: filters.carrierCode,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    }),
  ]);

  return {
    items: rows.map(summarizeShipment),
    pagination: {
      page,
      limit,
      total,
      total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
    stats: summarizeStats(statRows),
  };
}

/* ------------------------------------------------------------------ */
/* M06-F13 — Thông báo trạng thái đơn                                 */
/* ------------------------------------------------------------------ */

/**
 * M06-F13 — Đưa thông báo vào hàng đợi (worker gửi nằm ngoài phạm vi).
 * Không ném lỗi để không chặn luồng nghiệp vụ chính.
 * @param {{ order?: object, template?: string, extra?: object, channel?: 'EMAIL' | 'SMS' | 'IN_APP' }} input
 */
export async function notifyOrderStatus({ order, template, extra = {}, channel = 'EMAIL' } = {}) {
  if (!order?.user_id || !template) return null;

  try {
    return await repo.enqueueNotification({
      user_id: order.user_id,
      channel,
      template_key: template,
      payload: {
        order_code: order.order_code ?? null,
        order_status: order.status ?? null,
        customer_name: order.recipient_name ?? null,
        ...extra,
      },
    });
  } catch (error) {
    console.error('[m06] enqueue notification failed', template, error?.message);
    return null;
  }
}
