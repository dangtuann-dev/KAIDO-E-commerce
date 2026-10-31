import 'server-only';

/**
 * [SERVER] TOY-M05 — Đặt hàng và thanh toán (M05-F01 … M05-F11).
 * - Giá/tên/người nhận chụp tại thời điểm đặt (BR-M05-05), không phụ thuộc catalog sau này.
 * - Giữ tồn nguyên tử qua RPC M08 reserve_stock; lỗi giữa đường thì hủy đơn để trả tồn (BR-M05-01).
 * - Thanh toán online có hạn 20 phút, quá hạn pg_cron tự hủy (BR-M05-02).
 * - COD giá trị lớn phải chờ duyệt (BR-M05-03); khách chỉ hủy khi đơn chưa đóng gói (BR-M05-04).
 * - Voucher luôn đi qua CouponService của M09, điểm đi qua M07 (OPEN_DECISIONS #9).
 */
import { AppError, NotImplementedError } from '@/server/http/errors.js';
import { rpc } from '@/server/db/supabase.js';
import { isAdminRole } from '@/shared/constants/roles.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  canTransitionOrder,
} from '@/shared/constants/order-status.js';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS,
  isOnlinePayment,
} from '@/shared/constants/payment.js';
import { SHIPPING_METHOD_LABELS } from '@/shared/constants/shipping.js';
import { getPaymentGatewayStatus } from '@/server/env.js';
import {
  buildSandboxSimulation,
  createPaymentUrl,
  getVnpaySettings,
  verifyIpn,
} from '@/server/integrations/payment/vnpay.js';
import { clearCartAfterOrder, getCartSummaryForCheckout } from '@/modules/m04-cart/public.server.js';
import {
  checkAvailability,
  releaseForOrder,
  reserveForOrder,
} from '@/modules/m08-inventory/public.server.js';
import { CouponService } from '@/modules/m09-marketing/public.server.js';
import * as LoyaltyService from '@/modules/m07-loyalty/public.server.js';
import * as repo from './repository.js';
import {
  COD_CONFIRMATION_THRESHOLD_VND,
  MAX_COUPONS_PER_ORDER,
  PAYMENT_TIMEOUT_MINUTES,
} from './constants.js';

const POINT_VALUE_VND = BUSINESS_RULES.LOYALTY.POINT_VALUE_VND;
const MAX_REDEMPTION_PERCENT = BUSINESS_RULES.LOYALTY.MAX_REDEMPTION_PERCENT;
const FREE_SHIPPING_THRESHOLD_VND = BUSINESS_RULES.SHIPPING.FREE_SHIPPING_THRESHOLD_VND;
const FREE_SHIPPING_PROVINCE_CODE = '79';

const PAYMENT_METHOD_OPTIONS = Object.freeze([
  {
    method: PAYMENT_METHODS.COD,
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Kiểm tra hàng rồi mới trả tiền. Đơn trên 3.000.000đ cần nhân viên xác nhận.',
    requires_online_payment: false,
  },
  {
    method: PAYMENT_METHODS.VNPAY,
    label: 'VNPAY (ATM/QR/Visa)',
    description: 'Chuyển sang cổng VNPAY, giữ tồn trong 20 phút.',
    requires_online_payment: true,
  },
  {
    method: PAYMENT_METHODS.MOMO,
    label: 'Ví MoMo',
    description: 'Thanh toán bằng ví điện tử MoMo.',
    requires_online_payment: true,
  },
  {
    method: PAYMENT_METHODS.ZALOPAY,
    label: 'ZaloPay',
    description: 'Thanh toán bằng ví ZaloPay.',
    requires_online_payment: true,
  },
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

function insufficientStock(message, details) {
  return new AppError(ERROR_CODES.INSUFFICIENT_STOCK, message, { details });
}

function serviceUnavailable(message, details) {
  return new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, message, { details });
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

function isoOrNull(value) {
  return value ?? null;
}

function isOwnedBy(order, userId) {
  return Boolean(order?.user_id) && order.user_id === userId;
}

function assertCanViewOrder(order, auth) {
  if (!order) throw notFound('Không tìm thấy đơn hàng.');
  if (isOwnedBy(order, auth?.userId)) return;
  if (isAdminRole(auth?.role)) return;
  throw forbidden('Bạn không có quyền xem đơn hàng này.');
}

function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

function shippingMethodLabel(method) {
  return SHIPPING_METHOD_LABELS[method] ?? method;
}

/* ------------------------------------------------------------------ */
/* Dựng view (BR-M05-05 — snapshot tại thời điểm đặt)                 */
/* ------------------------------------------------------------------ */

function toLineView(item, quantity) {
  const unitPrice = amountOf(item?.effective_price ?? item?.current_price ?? item?.unit_price);
  const lineQuantity = Number(quantity ?? item?.quantity ?? 0);
  return {
    item_id: item?.item_id ?? null,
    cart_id: item?.cart_id ?? null,
    product_id: item?.product_id ?? null,
    variant_id: item?.variant_id ?? null,
    sku: item?.sku ?? null,
    name: item?.name ?? item?.product_name ?? null,
    product_name: item?.product_name ?? item?.name ?? null,
    variant_name: item?.variant_name ?? null,
    slug: item?.slug ?? null,
    image_url: item?.image_url ?? null,
    unit_price: unitPrice,
    list_price: amountOf(item?.price_regular ?? unitPrice),
    quantity: lineQuantity,
    line_total: unitPrice * lineQuantity,
    available: item?.available ?? null,
    stock_status: item?.stock_status ?? 'UNKNOWN',
    is_purchasable: item?.is_purchasable !== false,
  };
}

function toOrderItemView(row) {
  return {
    order_item_id: row.id,
    product_id: row.product_id,
    variant_id: row.variant_id,
    sku: row.sku,
    product_name: row.product_name,
    variant_name: row.variant_name,
    image_url: row.image_url,
    unit_price: amountOf(row.unit_price),
    quantity: Number(row.quantity ?? 0),
    line_total: amountOf(row.line_total),
    slug: row.product_snapshot?.slug ?? null,
  };
}

function toOrderSummary(order, { items = [], customer = null } = {}) {
  const status = order.status;
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const first = items[0] ?? null;

  return {
    order_id: order.id,
    order_code: order.order_code,
    status,
    status_label: ORDER_STATUS_LABELS[status] ?? status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    payment_method_label: paymentMethodLabel(order.payment_method),
    shipping_method: order.shipping_method,
    shipping_method_label: shippingMethodLabel(order.shipping_method),
    carrier_code: order.carrier_code ?? null,
    subtotal: amountOf(order.subtotal),
    discount_amount: amountOf(order.discount_amount),
    points_discount_amount: amountOf(order.points_discount_amount),
    shipping_fee: amountOf(order.shipping_fee),
    total_amount: amountOf(order.total_amount),
    coupon_code: order.coupon_code ?? null,
    points_used: Number(order.points_used ?? 0),
    item_count: itemCount,
    first_item: first
      ? {
          name: first.product_name,
          variant_name: first.variant_name,
          image_url: first.image_url,
        }
      : null,
    recipient: {
      name: order.recipient_name,
      phone: order.recipient_phone,
      email: order.recipient_email ?? null,
      province: order.shipping_province,
      district: order.shipping_district ?? null,
      ward: order.shipping_ward,
      address_line: order.shipping_address,
    },
    note: order.note ?? null,
    cancel_reason: order.cancel_reason ?? null,
    payment_expires_at: isoOrNull(order.payment_expires_at),
    placed_at: order.placed_at,
    created_at: order.created_at,
    confirmed_at: isoOrNull(order.confirmed_at),
    completed_at: isoOrNull(order.completed_at),
    cancelled_at: isoOrNull(order.cancelled_at),
    updated_at: order.updated_at,
    can_cancel: CUSTOMER_CANCELLABLE_STATUSES.includes(status),
    is_paid: order.payment_status === PAYMENT_STATUS.SUCCESS,
    customer: customer
      ? {
          user_id: customer.id,
          full_name: customer.full_name ?? null,
          email: customer.email ?? null,
          phone: customer.phone ?? null,
        }
      : null,
  };
}

/* ------------------------------------------------------------------ */
/* M05-F03 — Phí vận chuyển theo bảng shipping_fee_rules              */
/* ------------------------------------------------------------------ */

function pickRulesForRegion(rules, provinceCode) {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  if (provinceCode) {
    const exact = rules.filter((rule) => rule.province_code === provinceCode);
    if (exact.length > 0) return exact;
  }

  if (provinceCode === FREE_SHIPPING_PROVINCE_CODE) {
    const innerCity = rules.filter((rule) => rule.region_type === 'INNER_CITY');
    if (innerCity.length > 0) return innerCity;
  }

  const province = rules.filter((rule) => rule.region_type === 'PROVINCE');
  return province.length > 0 ? province : rules;
}

/**
 * M05-F03 — Danh sách lựa chọn vận chuyển + phí đã áp ngưỡng miễn phí.
 * @param {{ provinceCode?: string, shippingMethod?: string, subtotal?: number }} input
 */
export async function getShippingOptions(input = {}) {
  const subtotal = amountOf(input.subtotal);
  const methods = input.shippingMethod ? [input.shippingMethod] : undefined;
  const allRules = await repo.listActiveShippingFeeRules();
  const regionRules = pickRulesForRegion(allRules, input.provinceCode);
  const filtered = methods
    ? regionRules.filter((rule) => methods.includes(rule.shipping_method))
    : regionRules;

  const rules = filtered.length > 0 ? filtered : regionRules;

  if (rules.length === 0) {
    return {
      options: [
        {
          rule_id: null,
          name: 'Giao tiêu chuẩn',
          region_type: 'PROVINCE',
          shipping_method: 'STANDARD',
          method_label: shippingMethodLabel('STANDARD'),
          base_fee: 0,
          fee: 0,
          is_free: true,
          free_shipping_threshold: FREE_SHIPPING_THRESHOLD_VND,
        },
      ],
      selected: null,
      free_shipping_threshold: FREE_SHIPPING_THRESHOLD_VND,
      free_shipping_remaining: 0,
      fee_rule_missing: true,
    };
  }

  const options = rules.map((rule) => {
    const baseFee = amountOf(rule.base_fee);
    const threshold = amountOf(rule.free_shipping_threshold ?? FREE_SHIPPING_THRESHOLD_VND);
    const isFree = subtotal >= threshold;
    return {
      rule_id: rule.id,
      name: rule.name,
      region_type: rule.region_type,
      shipping_method: rule.shipping_method,
      method_label: shippingMethodLabel(rule.shipping_method),
      base_fee: baseFee,
      fee: isFree ? 0 : baseFee,
      is_free: isFree,
      free_shipping_threshold: threshold,
    };
  });

  const preferredMethod = input.shippingMethod || options[0].shipping_method;
  const selected =
    options.find((option) => option.shipping_method === preferredMethod) ?? options[0];
  const threshold = selected.free_shipping_threshold;

  return {
    options,
    selected,
    free_shipping_threshold: threshold,
    free_shipping_remaining: Math.max(0, threshold - subtotal),
    fee_rule_missing: false,
  };
}

/* ------------------------------------------------------------------ */
/* M05-F04 — Phương thức thanh toán khả dụng                          */
/* ------------------------------------------------------------------ */

function resolveMethodAvailability() {
  const gatewayStatus = getPaymentGatewayStatus();
  const sandboxAllowed = (() => {
    try {
      return getVnpaySettings().mode === 'sandbox';
    } catch {
      return false;
    }
  })();

  return PAYMENT_METHOD_OPTIONS.map((option) => {
    if (option.method === PAYMENT_METHODS.COD) {
      return { ...option, available: true, mode: 'cod', sandbox: false };
    }

    if (option.method === PAYMENT_METHODS.VNPAY) {
      return {
        ...option,
        available: gatewayStatus.VNPAY || sandboxAllowed,
        mode: sandboxAllowed ? 'sandbox' : 'live',
        sandbox: sandboxAllowed,
        note: sandboxAllowed && !gatewayStatus.VNPAY ? 'Chế độ mô phỏng (chưa cấu hình cổng thật).' : null,
      };
    }

    return {
      ...option,
      available: Boolean(gatewayStatus[option.method]),
      mode: 'pending',
      sandbox: false,
      note: 'Cổng thanh toán đang được hoàn thiện.',
    };
  });
}

/**
 * M05-F04 — Kiểm tra phương thức được chọn có dùng được không.
 * @param {string} method
 */
export async function selectPaymentMethod(method) {
  const options = resolveMethodAvailability();
  const option = options.find((entry) => entry.method === method);
  if (!option) {
    throw invalid('Phương thức thanh toán không hợp lệ.', { method });
  }
  if (!option.available) {
    throw serviceUnavailable(
      `${option.label} đang được hoàn thiện. Vui lòng chọn thanh toán khi nhận hàng (COD).`,
      { reason: `${option.method}_PENDING`, provider: option.method, feature: 'M05-F04' },
    );
  }
  return option;
}

/* ------------------------------------------------------------------ */
/* M05-F05 — Giảm giá (voucher M09 + điểm M07, hạ cấp an toàn)        */
/* ------------------------------------------------------------------ */

async function verifyCouponSafely({ couponCode, subtotal, userId, lines }) {
  if (!couponCode) return { coupon: null, discountAmount: 0, warnings: [] };

  if (MAX_COUPONS_PER_ORDER < 1) {
    throw invalid('Mỗi đơn chỉ áp dụng tối đa một mã giảm giá.');
  }

  try {
    const verified = await CouponService.verifyCoupon({
      code: couponCode,
      order_amount: subtotal,
      user_id: userId,
      items: lines.map((line) => ({
        product_id: line.product_id,
        variant_id: line.variant_id,
        quantity: line.quantity,
        line_total: line.line_total,
      })),
    });

    const discountAmount = Math.min(subtotal, amountOf(verified?.discount_amount ?? 0));
    return {
      coupon: {
        code: couponCode,
        valid: true,
        name: verified?.name ?? null,
        discount_type: verified?.discount_type ?? null,
        discount_amount: discountAmount,
      },
      discountAmount,
      warnings: [],
    };
  } catch (error) {
    if (error instanceof NotImplementedError) {
      return {
        coupon: { code: couponCode, valid: false, reason: 'M09_COUPON_PENDING' },
        discountAmount: 0,
        warnings: [
          {
            type: 'COUPON_UNAVAILABLE',
            message:
              'Tính năng mã giảm giá đang được hoàn thiện nên đơn này chưa áp dụng voucher. Bạn vẫn đặt hàng bình thường.',
            code: couponCode,
          },
        ],
      };
    }
    throw error;
  }
}

async function calculatePointsSafely({ userId, pointsRedeemed, subtotal, capacity }) {
  const points = Number(pointsRedeemed ?? 0);
  if (!Number.isFinite(points) || points <= 0) {
    return { pointsUsed: 0, discountAmount: 0, warnings: [], pointsAvailable: 0 };
  }

  const maxDiscount = Math.floor((subtotal * MAX_REDEMPTION_PERCENT) / 100);
  const ceiling = Math.min(maxDiscount, capacity);

  try {
    const result = await LoyaltyService.calculatePointsDiscount(userId, points, subtotal);
    const discountAmount = Math.min(ceiling, amountOf(result?.discount_amount ?? points * POINT_VALUE_VND));
    return {
      pointsUsed: points,
      discountAmount,
      pointsAvailable: Number(result?.available_points ?? 0),
      warnings: [],
    };
  } catch (error) {
    if (error instanceof NotImplementedError) {
      return {
        pointsUsed: 0,
        discountAmount: 0,
        pointsAvailable: 0,
        warnings: [
          {
            type: 'LOYALTY_UNAVAILABLE',
            message:
              'Tính năng dùng điểm đang được hoàn thiện nên đơn này chưa trừ điểm. Bạn vẫn đặt hàng bình thường.',
          },
        ],
      };
    }
    throw error;
  }
}

/**
 * M05-F05 — Tính toán giảm giá cho một đơn.
 * @param {{ userId: string, couponCode?: string, pointsRedeemed?: number, subtotal: number, lines: object[] }} input
 */
export async function applyOrderDiscounts(input) {
  const subtotal = amountOf(input.subtotal);
  const couponResult = await verifyCouponSafely({
    couponCode: input.couponCode,
    subtotal,
    userId: input.userId,
    lines: input.lines ?? [],
  });

  const pointsResult = await calculatePointsSafely({
    userId: input.userId,
    pointsRedeemed: input.pointsRedeemed,
    subtotal,
    capacity: Math.max(0, subtotal - couponResult.discountAmount),
  });

  const remainingAfterCoupon = Math.max(0, subtotal - couponResult.discountAmount);
  const couponDiscount = Math.min(couponResult.discountAmount, subtotal);
  const pointsDiscount = Math.min(pointsResult.discountAmount, remainingAfterCoupon);

  return {
    discountAmount: couponDiscount,
    pointsDiscountAmount: pointsDiscount,
    coupon: couponResult.coupon,
    pointsUsed: pointsResult.pointsUsed,
    pointsAvailable: pointsResult.pointsAvailable,
    warnings: [...couponResult.warnings, ...pointsResult.warnings],
  };
}

/* ------------------------------------------------------------------ */
/* M05-F01 — Tóm tắt checkout                                         */
/* ------------------------------------------------------------------ */

function buildAddressSnapshot(input) {
  if (!input) return null;
  return {
    recipient_name: input.recipient_name,
    recipient_phone: input.recipient_phone,
    recipient_email: input.recipient_email || null,
    province: input.province,
    province_code: input.province_code ?? null,
    district: input.district ?? null,
    district_code: input.district_code ?? null,
    ward: input.ward,
    ward_code: input.ward_code ?? null,
    address_line: input.address_line,
  };
}

async function resolveAddressSnapshot({ userId, addressId, shippingAddress }) {
  if (shippingAddress) return buildAddressSnapshot(shippingAddress);
  if (!addressId) return null;

  const address = await repo.findAddressForUser(userId, addressId);
  if (!address) throw notFound('Không tìm thấy địa chỉ giao hàng của bạn.');

  return {
    recipient_name: address.recipient_name,
    recipient_phone: address.phone,
    recipient_email: null,
    province: address.province_name,
    province_code: address.province_code,
    district: address.district_name ?? null,
    district_code: address.district_code ?? null,
    ward: address.ward_name,
    ward_code: address.ward_code,
    address_line: address.street_address,
  };
}

async function loadCartLines(userId, itemIds) {
  const cart = await getCartSummaryForCheckout(userId, itemIds);
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const selectedIds = Array.isArray(cart?.selected_item_ids) ? cart.selected_item_ids : [];
  const selectedSet = new Set(selectedIds);
  const lines = items.filter((item) => selectedSet.has(item.item_id)).map((item) => toLineView(item));

  return { cart, items, lines, selectedIds };
}

export async function getCheckoutSummary({ auth, body = {} }) {
  const userId = requireUserId(auth);
  const { cart, items, lines, selectedIds } = await loadCartLines(userId, body.item_ids);

  if (items.length === 0) {
    throw invalid('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.');
  }

  if (lines.length === 0) {
    const blocked = items
      .filter((item) => !selectedIds.includes(item.item_id))
      .map((item) => ({ item_id: item.item_id, name: item.name, stock_status: item.stock_status }));
    throw conflict(
      'Các sản phẩm đã chọn hiện không thể mua (hết hàng hoặc ngừng bán). Vui lòng cập nhật giỏ hàng.',
      { blocked_items: blocked },
    );
  }

  const blockedInSelection = items.filter(
    (item) => selectedIds.includes(item.item_id) && !item.is_purchasable,
  );
  if (blockedInSelection.length > 0) {
    throw conflict('Có sản phẩm đã ngừng bán trong đơn. Vui lòng bỏ khỏi giỏ hàng.', {
      blocked_items: blockedInSelection.map((item) => ({ item_id: item.item_id, name: item.name })),
    });
  }

  const address = await resolveAddressSnapshot({
    userId,
    addressId: body.address_id,
    shippingAddress: body.shipping_address,
  });
  if (!address) {
    throw invalid('Vui lòng chọn hoặc nhập địa chỉ giao hàng trước khi thanh toán.');
  }

  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const shipping = await getShippingOptions({
    provinceCode: address.province_code,
    shippingMethod: body.shipping_method,
    subtotal,
  });
  const shippingFee = shipping.selected?.fee ?? 0;

  const discounts = await applyOrderDiscounts({
    userId,
    couponCode: body.coupon_code,
    pointsRedeemed: body.points_redeemed,
    subtotal,
    lines,
  });

  const total = Math.max(0, subtotal + shippingFee - discounts.discountAmount - discounts.pointsDiscountAmount);

  return {
    cart_id: cart?.cart_id ?? null,
    items: lines,
    item_count: lines.reduce((sum, line) => sum + line.quantity, 0),
    shipping_address: address,
    subtotal,
    shipping_fee: shippingFee,
    shipping_method: shipping.selected?.shipping_method ?? 'STANDARD',
    shipping_options: shipping.options,
    free_shipping_threshold: shipping.free_shipping_threshold,
    free_shipping_remaining: shipping.free_shipping_remaining,
    discount_amount: discounts.discountAmount,
    points_discount_amount: discounts.pointsDiscountAmount,
    points_used: discounts.pointsUsed,
    coupon: discounts.coupon,
    total_amount: total,
    cod_confirmation_threshold: COD_CONFIRMATION_THRESHOLD_VND,
    payment_timeout_minutes: PAYMENT_TIMEOUT_MINUTES,
    payment_methods: resolveMethodAvailability(),
    warnings: discounts.warnings,
  };
}

/* ------------------------------------------------------------------ */
/* M05-F02 — Chuẩn hóa thông tin giao hàng                            */
/* ------------------------------------------------------------------ */

/**
 * M05-F02 — Trả snapshot địa chỉ đã chuẩn hóa (dùng lại khi đặt hàng).
 * @param {{ userId: string, addressId?: string, shippingAddress?: object }} input
 */
export async function saveShippingInformation(input) {
  const address = await resolveAddressSnapshot(input);
  if (!address) {
    throw invalid('Thông tin giao hàng là bắt buộc.');
  }
  return address;
}

/* ------------------------------------------------------------------ */
/* M05-F06 — Đặt hàng                                                 */
/* ------------------------------------------------------------------ */

function resolveRequestedLine(requested, cartItems, usedItemIds) {
  if (requested.variant_id) {
    return (
      cartItems.find(
        (item) => item.variant_id === requested.variant_id && !usedItemIds.has(item.item_id),
      ) ?? null
    );
  }

  const candidates = cartItems.filter(
    (item) => item.product_id === requested.product_id && !usedItemIds.has(item.item_id),
  );

  if (candidates.length > 1) {
    throw invalid('Sản phẩm này có nhiều phân loại, vui lòng chọn phân loại cụ thể.', {
      product_id: requested.product_id,
    });
  }

  return candidates[0] ?? null;
}

async function assertStockAvailable(lines) {
  const skus = [...new Set(lines.map((line) => line.sku).filter(Boolean))];
  if (skus.length === 0) return;

  const availability = await checkAvailability(skus);
  const stockMap = new Map((availability ?? []).map((entry) => [entry.sku, entry]));

  for (const line of lines) {
    const entry = stockMap.get(line.sku);
    const available = Number(entry?.available ?? 0);
    if (available <= 0) {
      throw insufficientStock(`${line.name} đã hết hàng. Vui lòng chọn sản phẩm khác.`, {
        sku: line.sku,
        available,
        requested_quantity: line.quantity,
      });
    }
    if (available < line.quantity) {
      throw insufficientStock(`Chỉ còn ${available} sản phẩm ${line.name} trong kho.`, {
        sku: line.sku,
        available,
        requested_quantity: line.quantity,
      });
    }
  }
}

function decideInitialStatus({ paymentMethod, totalAmount }) {
  if (isOnlinePayment(paymentMethod)) {
    return {
      status: ORDER_STATUS.PENDING_PAYMENT,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentExpiresAt: new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString(),
      requiresApproval: false,
    };
  }

  const requiresApproval = totalAmount > COD_CONFIRMATION_THRESHOLD_VND;
  return {
    status: requiresApproval ? ORDER_STATUS.PENDING_APPROVAL : ORDER_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    paymentExpiresAt: null,
    requiresApproval,
  };
}

async function cancelUnreservedOrder(order, auth, reason) {
  try {
    await repo.updateOrder(order.id, {
      status: ORDER_STATUS.CANCELLED,
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    });
    await repo.insertOrderStatusHistory({
      order_id: order.id,
      from_status: order.status,
      to_status: ORDER_STATUS.CANCELLED,
      changed_by: auth?.userId ?? null,
      changed_by_role: auth?.role ?? null,
      change_source: 'SYSTEM',
      note: reason,
    });
    await releaseForOrder(order.order_code);
  } catch {
    // Đơn nháp không giữ được tồn; pg_cron vẫn dọn các bản ghi treo.
  }
}

function paymentRedirectPath(order) {
  return `/order-success/${encodeURIComponent(order.order_code)}`;
}

async function initiateOnlinePaymentFor(order, { ipAddress } = {}) {
  const availability = await selectPaymentMethod(order.payment_method);

  if (order.payment_method !== PAYMENT_METHODS.VNPAY) {
    throw serviceUnavailable(
      `${paymentMethodLabel(order.payment_method)} đang được hoàn thiện. Vui lòng chọn thanh toán khi nhận hàng (COD).`,
      { reason: `${order.payment_method}_PENDING`, provider: order.payment_method },
    );
  }

  const { paymentUrl, mode, sandbox } = await createPaymentUrl({
    orderRef: order.order_code,
    amountVnd: amountOf(order.total_amount),
    orderInfo: `Thanh toan don hang ${order.order_code}`,
    ipAddress: ipAddress || '127.0.0.1',
    expiresAt: order.payment_expires_at,
  });

  return { paymentUrl, mode, sandbox, availability };
}

export async function placeOrder({ auth, body, request }) {
  const userId = requireUserId(auth);
  const requestedItems = Array.isArray(body.items) ? body.items : [];
  if (requestedItems.length === 0) {
    throw invalid('Đơn hàng phải có ít nhất một sản phẩm.');
  }

  const { cart, items: cartItems } = await loadCartLines(userId, null);
  if (cartItems.length === 0) {
    throw invalid('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng.');
  }

  const usedItemIds = new Set();
  const lines = [];

  for (const requested of requestedItems) {
    const cartItem = resolveRequestedLine(requested, cartItems, usedItemIds);
    if (!cartItem) {
      throw conflict('Giỏ hàng đã thay đổi. Vui lòng tải lại trang và thử lại.', {
        product_id: requested.product_id,
        variant_id: requested.variant_id ?? null,
      });
    }

    usedItemIds.add(cartItem.item_id);
    if (!cartItem.is_purchasable) {
      throw invalid(`${cartItem.name} đã ngừng bán. Vui lòng bỏ khỏi giỏ hàng.`, {
        item_id: cartItem.item_id,
      });
    }

    const quantity = Number(requested.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw invalid('Số lượng sản phẩm không hợp lệ.', { item_id: cartItem.item_id });
    }
    if (quantity > Number(cartItem.quantity)) {
      throw conflict('Số lượng đặt vượt quá số lượng trong giỏ hàng. Vui lòng tải lại trang.', {
        item_id: cartItem.item_id,
        cart_quantity: cartItem.quantity,
        requested_quantity: quantity,
      });
    }

    lines.push(toLineView(cartItem, quantity));
  }

  await assertStockAvailable(lines);

  const address = await saveShippingInformation({
    userId,
    addressId: body.address_id,
    shippingAddress: body.shipping_address,
  });

  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const shipping = await getShippingOptions({
    provinceCode: address.province_code,
    shippingMethod: body.shipping_method,
    subtotal,
  });
  const shippingFee = shipping.selected?.fee ?? 0;

  const discounts = await applyOrderDiscounts({
    userId,
    couponCode: body.coupon_code,
    pointsRedeemed: body.points_redeemed,
    subtotal,
    lines,
  });

  const totalAmount = Math.max(
    0,
    subtotal + shippingFee - discounts.discountAmount - discounts.pointsDiscountAmount,
  );

  const paymentMethod = body.payment_method;
  await selectPaymentMethod(paymentMethod);

  const initial = decideInitialStatus({ paymentMethod, totalAmount });

  let order;
  try {
    order = await repo.insertOrder({
      user_id: userId,
      status: initial.status,
      payment_status: initial.paymentStatus,
      payment_method: paymentMethod,
      shipping_method: shipping.selected?.shipping_method ?? body.shipping_method ?? 'STANDARD',
      currency: 'VND',
      subtotal,
      discount_amount: discounts.discountAmount,
      points_discount_amount: discounts.pointsDiscountAmount,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      coupon_code: discounts.coupon?.valid ? discounts.coupon.code : null,
      points_used: discounts.pointsUsed,
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      recipient_email: address.recipient_email,
      shipping_province: address.province,
      shipping_district: address.district,
      shipping_ward: address.ward,
      shipping_address: address.address_line,
      note: body.note ?? null,
      payment_expires_at: initial.paymentExpiresAt,
    });
  } catch (error) {
    if (error instanceof AppError && error.code === ERROR_CODES.DUPLICATE_RESOURCE) {
      throw conflict('Đơn hàng vừa được tạo, vui lòng kiểm tra lại danh sách đơn của bạn.');
    }
    throw error;
  }

  try {
    await repo.insertOrderItems(
      lines.map((line) => ({
        order_id: order.id,
        product_id: line.product_id,
        variant_id: line.variant_id,
        sku: line.sku,
        product_name: line.product_name,
        variant_name: line.variant_name,
        image_url: line.image_url,
        unit_price: line.unit_price,
        quantity: line.quantity,
        line_total: line.line_total,
        product_snapshot: {
          name: line.name,
          variant_name: line.variant_name,
          sku: line.sku,
          image_url: line.image_url,
          slug: line.slug,
          list_price: line.list_price,
          unit_price: line.unit_price,
          captured_at: new Date().toISOString(),
        },
      })),
    );
  } catch (error) {
    await cancelUnreservedOrder(order, auth, 'Không lưu được chi tiết đơn hàng');
    throw error;
  }

  // BR-M05-01 — giữ tồn nguyên tử; thất bại thì hủy đơn để không giữ chỗ ảo.
  try {
    await reserveForOrder(
      order.order_code,
      lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
    );
  } catch (error) {
    await cancelUnreservedOrder(order, auth, 'Không đủ tồn kho khi đặt hàng');
    if (error instanceof AppError && error.code === ERROR_CODES.INSUFFICIENT_STOCK) throw error;
    throw insufficientStock(
      'Một số sản phẩm vừa hết hàng trong lúc bạn đặt. Vui lòng kiểm tra lại giỏ hàng.',
      { reason: error?.code ?? 'RESERVE_FAILED', message: error?.message ?? null },
    );
  }

  await repo.insertOrderStatusHistory({
    order_id: order.id,
    from_status: null,
    to_status: order.status,
    changed_by: userId,
    changed_by_role: auth?.role ?? 'CUSTOMER',
    change_source: 'CUSTOMER',
    note: 'Khách đặt hàng',
  });

  let paymentTransaction = null;
  if (totalAmount > 0) {
    try {
      paymentTransaction = await repo.insertPaymentTransaction({
        order_id: order.id,
        provider: paymentMethod,
        transaction_ref: order.order_code,
        amount: totalAmount,
        status: PAYMENT_STATUS.PENDING,
        idempotency_key: `${order.order_code}:${paymentMethod}`,
        request_payload: {
          items: lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
          payment_method: paymentMethod,
          shipping_method: order.shipping_method,
        },
      });
    } catch (error) {
      if (!(error instanceof AppError && error.code === ERROR_CODES.DUPLICATE_RESOURCE)) {
        throw error;
      }
      paymentTransaction = await repo.findPaymentTransactionByIdempotencyKey(
        `${order.order_code}:${paymentMethod}`,
      );
    }
  }

  if (cart?.cart_id) {
    try {
      await clearCartAfterOrder(cart.cart_id);
    } catch {
      // Giỏ sẽ được dọn ở lần đọc kế tiếp; không chặn đơn đã tạo.
    }
  }

  try {
    await repo.enqueueNotification({
      user_id: userId,
      channel: 'EMAIL',
      template_key: 'ORDER_PLACED',
      payload: {
        order_code: order.order_code,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: order.status,
      },
    });
  } catch {
    // Hàng đợi email lỗi không được làm hỏng giao dịch đặt hàng.
  }

  let paymentUrl = null;
  let paymentMode = 'cod';
  if (isOnlinePayment(paymentMethod)) {
    try {
      const initiated = await initiateOnlinePaymentFor(order, {
        ipAddress: request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim(),
      });
      paymentUrl = initiated.paymentUrl;
      paymentMode = initiated.mode;
    } catch (error) {
      // Đơn đã tạo và giữ tồn: trả về để khách thử thanh toán lại từ trang đơn hàng.
      paymentMode = error?.details?.reason === 'VNPAY_NOT_CONFIGURED' ? 'unavailable' : 'error';
    }
  }

  return {
    order_id: order.id,
    order_code: order.order_code,
    status: order.status,
    status_label: ORDER_STATUS_LABELS[order.status] ?? order.status,
    payment_method: paymentMethod,
    payment_status: order.payment_status,
    payment_url: paymentUrl,
    payment_mode: paymentMode,
    payment_transaction_id: paymentTransaction?.id ?? null,
    payment_expires_at: order.payment_expires_at,
    requires_approval: initial.requiresApproval,
    subtotal,
    shipping_fee: shippingFee,
    discount_amount: discounts.discountAmount,
    points_discount_amount: discounts.pointsDiscountAmount,
    total_amount: totalAmount,
    redirect_path: paymentRedirectPath(order),
    payment_timeout_minutes: PAYMENT_TIMEOUT_MINUTES,
    warnings: discounts.warnings,
  };
}

/* ------------------------------------------------------------------ */
/* M05-F07 — Khởi tạo thanh toán online + IPN VNPAY                   */
/* ------------------------------------------------------------------ */

export async function initiateOnlinePayment({ auth, params }) {
  const userId = requireUserId(auth);
  const order = await repo.findOrderByRef(params.orderRef);
  assertCanViewOrder(order, auth);
  if (!isOwnedBy(order, userId) && !isAdminRole(auth?.role)) {
    throw forbidden('Bạn không có quyền thanh toán đơn hàng này.');
  }

  if (!isOnlinePayment(order.payment_method)) {
    throw conflict('Đơn hàng này không dùng thanh toán online.', {
      payment_method: order.payment_method,
    });
  }
  if (order.payment_status === PAYMENT_STATUS.SUCCESS) {
    throw conflict('Đơn hàng đã được thanh toán.', { order_code: order.order_code });
  }
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    throw conflict('Đơn hàng không còn ở trạng thái chờ thanh toán.', { status: order.status });
  }
  if (order.payment_expires_at && new Date(order.payment_expires_at).getTime() < Date.now()) {
    throw conflict('Đã quá 20 phút thanh toán, đơn hàng sẽ được hủy tự động.', {
      payment_expires_at: order.payment_expires_at,
    });
  }

  const initiated = await initiateOnlinePaymentFor(order);
  return {
    order_code: order.order_code,
    payment_url: initiated.paymentUrl,
    payment_mode: initiated.mode,
    payment_expires_at: order.payment_expires_at,
  };
}

function vnpayResponse(rspCode, message) {
  return new Response(JSON.stringify({ RspCode: rspCode, Message: message }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function mergeIpnPayload({ query = {}, body }) {
  const merged = { ...query };
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) merged[key] = String(value);
    }
  }
  return merged;
}

/**
 * M05-F07 — Xử lý IPN VNPAY idempotent (API-M05-04).
 * Luôn trả 200 kèm { RspCode, Message } theo chuẩn cổng.
 */
export async function handleVnpayIpn(ctx = {}) {
  const payload = mergeIpnPayload({ query: ctx.query, body: ctx.body });

  let verified;
  try {
    verified = await verifyIpn(payload);
  } catch (error) {
    if (error?.code === ERROR_CODES.SERVICE_UNAVAILABLE) {
      return vnpayResponse('99', 'Gateway not configured');
    }
    throw error;
  }

  if (!verified.valid) {
    return vnpayResponse('97', 'Invalid signature');
  }

  const order = await repo.findOrderByRef(verified.orderRef);
  if (!order) {
    return vnpayResponse('01', 'Order not found');
  }

  const expectedAmount = amountOf(order.total_amount) * 100;
  const receivedAmount = amountOf(verified.result?.amountVnd) * 100;
  if (expectedAmount !== receivedAmount) {
    return vnpayResponse('04', 'Invalid amount');
  }

  if (order.payment_status === PAYMENT_STATUS.SUCCESS) {
    return vnpayResponse('02', 'Order already confirmed');
  }

  const transaction =
    (await repo.findPaymentTransactionByProvider(
      PAYMENT_METHODS.VNPAY,
      verified.result?.transactionRef,
    )) ??
    (await repo.findLatestPaymentTransaction(order.id)) ??
    (await repo.insertPaymentTransaction({
      order_id: order.id,
      provider: PAYMENT_METHODS.VNPAY,
      transaction_ref: order.order_code,
      provider_transaction_id: verified.result?.transactionRef ?? null,
      amount: amountOf(order.total_amount),
      status: PAYMENT_STATUS.PENDING,
      idempotency_key: `${order.order_code}:${PAYMENT_METHODS.VNPAY}`,
    }));

  const paidAt = new Date().toISOString();

  if (verified.isSuccess) {
    await repo.updatePaymentTransaction(transaction.id, {
      status: PAYMENT_STATUS.SUCCESS,
      provider_transaction_id: verified.result?.transactionRef ?? transaction.provider_transaction_id,
      response_payload: verified.result?.raw ?? null,
      paid_at: paidAt,
    });

    await repo.updateOrder(order.id, {
      payment_status: PAYMENT_STATUS.SUCCESS,
      status: ORDER_STATUS.PENDING,
      confirmed_at: paidAt,
    });

    await repo.insertOrderStatusHistory({
      order_id: order.id,
      from_status: order.status,
      to_status: ORDER_STATUS.PENDING,
      changed_by: null,
      changed_by_role: null,
      change_source: 'SYSTEM',
      note: `VNPAY xác nhận thanh toán thành công (${verified.result?.transactionRef ?? 'n/a'})`,
    });

    return vnpayResponse('00', 'Confirm Success');
  }

  await repo.updatePaymentTransaction(transaction.id, {
    status: PAYMENT_STATUS.FAILED,
    provider_transaction_id: verified.result?.transactionRef ?? transaction.provider_transaction_id,
    response_payload: verified.result?.raw ?? null,
  });

  return vnpayResponse('00', 'Confirm Success');
}

/* ------------------------------------------------------------------ */
/* M05-F08 — Dữ liệu trang đặt hàng thành công                        */
/* ------------------------------------------------------------------ */

export async function getOrderSuccess({ auth, params }) {
  const detail = await getOrderDetail({ auth, params });
  const order = detail.order;

  return {
    order,
    items: detail.order_items,
    tracking_history: detail.tracking_history,
    payment_info: detail.payment_info,
    next_steps:
      order.payment_status === PAYMENT_STATUS.SUCCESS
        ? ['Đơn đã thanh toán, KAIDO sẽ đóng gói và giao trong 2–4 ngày làm việc.']
        : order.status === ORDER_STATUS.PENDING_PAYMENT
          ? [
              `Vui lòng hoàn tất thanh toán trong ${PAYMENT_TIMEOUT_MINUTES} phút để giữ tồn kho.`,
              'Quá hạn, đơn sẽ tự động hủy và tồn kho được trả lại.',
            ]
          : order.status === ORDER_STATUS.PENDING_APPROVAL
            ? ['Đơn COD giá trị lớn cần nhân viên xác nhận trước khi giao.']
            : ['KAIDO sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.'],
  };
}

/* ------------------------------------------------------------------ */
/* M05-F10 — Xem đơn của khách                                        */
/* ------------------------------------------------------------------ */

/**
 * Chế độ cổng thanh toán: UI chỉ mở trang mô phỏng khi đang là 'sandbox'.
 * @param {string} paymentMethod
 * @returns {'cod' | 'live' | 'sandbox' | 'unavailable'}
 */
function resolvePaymentMode(paymentMethod) {
  if (!isOnlinePayment(paymentMethod)) return 'cod';
  try {
    return getVnpaySettings().mode;
  } catch {
    return 'unavailable';
  }
}

export async function getOrderDetail({ auth, params }) {
  const order = await repo.findOrderByRef(params.orderRef);
  assertCanViewOrder(order, auth);

  const [itemRows, history, payments, customerRows] = await Promise.all([
    repo.listOrderItems(order.id),
    repo.listOrderStatusHistory(order.id),
    repo.listPaymentTransactions(order.id),
    repo.listUsersByIds([order.user_id]),
  ]);

  const items = itemRows.map(toOrderItemView);
  const customer = customerRows[0] ?? null;

  return {
    order: toOrderSummary(order, { items: itemRows, customer }),
    order_items: items,
    tracking_history: history.map((row) => ({
      history_id: String(row.id),
      from_status: row.from_status ?? null,
      to_status: row.to_status,
      to_status_label: ORDER_STATUS_LABELS[row.to_status] ?? row.to_status,
      change_source: row.change_source,
      changed_by_role: row.changed_by_role ?? null,
      note: row.note ?? null,
      created_at: row.created_at,
    })),
    payment_info: {
      status: order.payment_status,
      method: order.payment_method,
      method_label: paymentMethodLabel(order.payment_method),
      payment_mode: resolvePaymentMode(order.payment_method),
      paid_at: payments.find((row) => row.status === PAYMENT_STATUS.SUCCESS)?.paid_at ?? null,
      expires_at: order.payment_expires_at,
      transactions: payments.map((row) => ({
        transaction_id: row.id,
        provider: row.provider,
        provider_transaction_id: row.provider_transaction_id,
        amount: amountOf(row.amount),
        status: row.status,
        paid_at: row.paid_at ?? null,
        created_at: row.created_at,
      })),
    },
  };
}

export async function listCustomerOrders({ auth, query = {} }) {
  const userId = requireUserId(auth);
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  const { rows, total } = await repo.listOrdersByUser(userId, {
    status: query.status,
    page,
    limit,
  });

  const itemRows = await repo.listOrderItemsForOrders(rows.map((row) => row.id));
  const itemsByOrder = new Map();
  for (const item of itemRows) {
    const bucket = itemsByOrder.get(item.order_id) ?? [];
    bucket.push(item);
    itemsByOrder.set(item.order_id, bucket);
  }

  return {
    items: rows.map((row) => toOrderSummary(row, { items: itemsByOrder.get(row.id) ?? [] })),
    pagination: {
      page,
      limit,
      total,
      total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

/* ------------------------------------------------------------------ */
/* M05-F09 — Hủy đơn / quét đơn quá hạn                               */
/* ------------------------------------------------------------------ */

export async function cancelOrder({ auth, params, body }) {
  const userId = requireUserId(auth);
  const order = await repo.findOrderByRef(params.orderRef);
  if (!order) throw notFound('Không tìm thấy đơn hàng.');

  const isOwner = isOwnedBy(order, userId);

  // API-M06-05 là alias của API-M05-05 (OPEN_DECISIONS #16): nhân viên dùng chung route.
  if (!isOwner && !isAdminRole(auth?.role)) {
    throw forbidden('Bạn không có quyền hủy đơn hàng này.');
  }
  if (isOwner && !CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
    throw conflict(
      `Đơn ${order.order_code} đang ở trạng thái "${ORDER_STATUS_LABELS[order.status]}" nên không thể hủy.`,
      { status: order.status, cancellable: CUSTOMER_CANCELLABLE_STATUSES },
    );
  }
  if (
    !isOwner &&
    ![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PENDING, ORDER_STATUS.PENDING_APPROVAL, ORDER_STATUS.CONFIRMED].includes(
      order.status,
    )
  ) {
    throw conflict('Chỉ hủy được đơn chưa đóng gói.', { status: order.status });
  }

  const reason = body?.reason?.trim() || 'Khách hủy đơn';
  const cancelledAt = new Date().toISOString();

  const updated = await repo.updateOrder(order.id, {
    status: ORDER_STATUS.CANCELLED,
    cancelled_at: cancelledAt,
    cancel_reason: reason,
    payment_status:
      order.payment_status === PAYMENT_STATUS.SUCCESS
        ? PAYMENT_STATUS.REFUNDED
        : PAYMENT_STATUS.CANCELLED,
  });

  try {
    await releaseForOrder(updated.order_code);
  } catch {
    // Không có giữ tồn (đơn chưa reserve) hoặc M08 lỗi: pg_cron dọn reservation hết hạn.
  }

  await repo.insertOrderStatusHistory({
    order_id: updated.id,
    from_status: order.status,
    to_status: ORDER_STATUS.CANCELLED,
    changed_by: userId,
    changed_by_role: auth?.role ?? 'CUSTOMER',
    change_source: isOwner ? 'CUSTOMER' : 'STAFF',
    note: reason,
  });

  if (order.coupon_code) {
    try {
      await CouponService.releaseCoupon({ code: order.coupon_code, order_id: order.id });
    } catch {
      // M09 chưa sẵn sàng — voucher đã không được tiêu thụ ở M05.
    }
  }

  return {
    success: true,
    order_id: updated.id,
    order_code: updated.order_code,
    new_status: updated.status,
    status_label: ORDER_STATUS_LABELS[updated.status],
    cancelled_at: updated.cancelled_at,
  };
}

export async function cancelTimeoutOrders() {
  const cancelled = await rpc('cancel_timeout_orders', {});
  return {
    cancelled_count: Number(cancelled ?? 0),
    executed_at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* M05-F11 — Quản trị đơn hàng                                        */
/* ------------------------------------------------------------------ */

export async function listAdminOrders({ query = {} } = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const filters = {
    status: query.status,
    search: query.search,
    fromDate: query.from_date,
    toDate: query.to_date,
    page,
    limit,
  };

  const [{ rows, total }, counter] = await Promise.all([
    repo.listAdminOrders(filters),
    repo.countOrdersByStatus({
      search: query.search,
      fromDate: query.from_date,
      toDate: query.to_date,
    }),
  ]);

  const [itemRows, userRows] = await Promise.all([
    repo.listOrderItemsForOrders(rows.map((row) => row.id)),
    repo.listUsersByIds(rows.map((row) => row.user_id)),
  ]);

  const itemsByOrder = new Map();
  for (const item of itemRows) {
    const bucket = itemsByOrder.get(item.order_id) ?? [];
    bucket.push(item);
    itemsByOrder.set(item.order_id, bucket);
  }
  const usersById = new Map(userRows.map((user) => [user.id, user]));

  return {
    items: rows.map((row) =>
      toOrderSummary(row, {
        items: itemsByOrder.get(row.id) ?? [],
        customer: row.user_id ? usersById.get(row.user_id) ?? null : null,
      }),
    ),
    pagination: {
      page,
      limit,
      total,
      total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
    status_counts: counter.counts,
    total_orders: counter.total,
  };
}

export async function updateOrderStatus({ auth, params, body }) {
  const order = await repo.findOrderById(params.id);
  if (!order) throw notFound('Không tìm thấy đơn hàng.');

  const nextStatus = body.new_status;
  if (order.status === nextStatus) {
    throw conflict(`Đơn hàng đã ở trạng thái "${ORDER_STATUS_LABELS[nextStatus]}".`, {
      status: order.status,
    });
  }
  if (!canTransitionOrder(order.status, nextStatus)) {
    throw new AppError(ERROR_CODES.INVALID_STATUS_TRANSITION, undefined, {
      details: {
        from_status: order.status,
        to_status: nextStatus,
        allowed: ORDER_TRANSITIONS[order.status] ?? [],
      },
    });
  }

  const now = new Date().toISOString();
  const patch = { status: nextStatus };

  if (nextStatus === ORDER_STATUS.CONFIRMED) patch.confirmed_at = now;
  if (nextStatus === ORDER_STATUS.COMPLETED) patch.completed_at = now;
  if (nextStatus === ORDER_STATUS.CANCELLED || nextStatus === ORDER_STATUS.CANCELLED_TIMEOUT) {
    patch.cancelled_at = now;
    patch.cancel_reason = body.note ?? 'Nhân viên hủy đơn';
  }
  if (
    nextStatus === ORDER_STATUS.COMPLETED &&
    order.payment_method === PAYMENT_METHODS.COD &&
    order.payment_status !== PAYMENT_STATUS.SUCCESS
  ) {
    patch.payment_status = PAYMENT_STATUS.SUCCESS;
  }

  const updated = await repo.updateOrder(order.id, patch);

  if (nextStatus === ORDER_STATUS.CANCELLED || nextStatus === ORDER_STATUS.CANCELLED_TIMEOUT) {
    try {
      await releaseForOrder(updated.order_code);
    } catch {
      // Reservation có thể chưa tồn tại; bỏ qua để không chặn nghiệp vụ.
    }
  }

  await repo.insertOrderStatusHistory({
    order_id: updated.id,
    from_status: order.status,
    to_status: nextStatus,
    changed_by: auth?.userId ?? null,
    changed_by_role: auth?.role ?? null,
    change_source: 'STAFF',
    note: body.note ?? null,
  });

  if (nextStatus === ORDER_STATUS.COMPLETED) {
    try {
      await LoyaltyService.awardPointsForOrder(updated.id);
    } catch {
      // M07 chưa sẵn sàng: điểm sẽ được chốt bù khi triển khai.
    }

    if (order.payment_status === PAYMENT_STATUS.SUCCESS) {
      const latest = await repo.findLatestPaymentTransaction(updated.id);
      if (latest) {
        await repo.updatePaymentTransaction(latest.id, {
          status: PAYMENT_STATUS.SUCCESS,
          paid_at: latest.paid_at ?? now,
        });
      }
    }
  }

  return {
    order_id: updated.id,
    order_code: updated.order_code,
    status: updated.status,
    status_label: ORDER_STATUS_LABELS[updated.status],
    payment_status: updated.payment_status,
    updated_at: updated.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/* M05-F07 — Mô phỏng thanh toán (chỉ khi chưa cấu hình cổng thật)    */
/* ------------------------------------------------------------------ */

/**
 * Dữ liệu cho trang sandbox: form POST đã ký tới API-M05-04.
 * @param {{ auth: object, params: { orderRef: string } }} input
 */
export async function getPaymentSandbox({ auth, params }) {
  // Chỉ mở ở chế độ mô phỏng: cấu hình cổng thật thì tuyệt đối không cho bỏ qua thanh toán.
  if (getVnpaySettings().mode !== 'sandbox') {
    throw notFound('Trang mô phỏng thanh toán chỉ mở khi chưa cấu hình cổng VNPAY thật.');
  }

  const order = await repo.findOrderByRef(params.orderRef);
  assertCanViewOrder(order, auth);

  if (!isOnlinePayment(order.payment_method)) {
    throw conflict('Đơn hàng này không dùng thanh toán online.', {
      payment_method: order.payment_method,
    });
  }

  const success = buildSandboxSimulation({
    orderRef: order.order_code,
    amountVnd: amountOf(order.total_amount),
    success: true,
  });
  const failure = buildSandboxSimulation({
    orderRef: order.order_code,
    amountVnd: amountOf(order.total_amount),
    success: false,
  });

  return {
    order: toOrderSummary(order),
    action: success.action,
    success_fields: success.fields,
    failure_fields: failure.fields,
  };
}
