import 'server-only';
import { AppError, NotImplementedError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getProductSnapshot } from '@/modules/m02-catalog/public.server.js';
import { checkAvailability } from '@/modules/m08-inventory/public.server.js';
import { CouponService } from '@/modules/m09-marketing/public.server.js';
import * as repo from './repository.js';
import {
  CART_STATUS,
  GUEST_CART_TTL_DAYS,
  MAX_QUANTITY_PER_ITEM,
  SAVE_FOR_LATER_ENABLED,
  UNDO_DELETE_MS,
} from './constants.js';

/**
 * [SERVER] TOY-M04 — Giỏ hàng (M04-F01 … M04-F10).
 * - Giỏ khách vãng lai khoá theo X-Guest-Session-Id, hết hạn sau 30 ngày (BR-M04-04).
 * - Mỗi dòng 1–20 đơn vị (BR-M04-05); không vượt tồn khả dụng của M08 (BR-M04-01).
 * - Giá lưu tại thời điểm thêm vào giỏ; GET /cart so lại giá hiện tại (BR-M04-02).
 * - Coupon luôn đi qua CouponService của M09 (OPEN_DECISIONS #9).
 */

const BLOCKING_STOCK_STATUSES = new Set(['OUT_OF_STOCK', 'UNAVAILABLE']);

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

function insufficientStock(message, details) {
  return new AppError(ERROR_CODES.INSUFFICIENT_STOCK, message, { details });
}

function actorOf({ auth, guestSessionId }) {
  const userId = auth?.userId ?? null;
  return userId ? { userId, guestSessionId: null } : { userId: null, guestSessionId: guestSessionId ?? null };
}

function requireActor(context) {
  const actor = actorOf(context);
  if (!actor.userId && !actor.guestSessionId) {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      'Thiếu phiên khách vãng lai hoặc đăng nhập để xác định giỏ hàng.',
    );
  }
  return actor;
}

function guestExpiry() {
  const expires = new Date();
  expires.setDate(expires.getDate() + GUEST_CART_TTL_DAYS);
  return expires.toISOString();
}

function parseIdList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item);
  if (typeof value !== 'string' || value.trim() === '') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function priceOf(product) {
  const regular = Number(product?.price_regular ?? 0);
  const sale = product?.price_sale == null ? null : Number(product.price_sale);
  return { regular, sale, price: sale != null && sale < regular ? sale : regular };
}

function thumbnailOf(product) {
  const images = Array.isArray(product?.product_images) ? [...product.product_images] : [];
  if (images.length === 0) return null;
  images.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  return (images.find((image) => image.is_thumbnail) ?? images[0])?.url ?? null;
}

function displayName(product, variant) {
  const productName = product?.name ?? '';
  const variantName = variant?.name;
  if (variantName && variantName !== 'Mặc định') {
    return productName ? `${productName} - ${variantName}` : variantName;
  }
  return productName || 'Sản phẩm';
}

/* ------------------------------------------------------------------ */
/* Giỏ hàng (M04-F02)                                                 */
/* ------------------------------------------------------------------ */

async function findCart(actor) {
  return actor.userId
    ? repo.findActiveCartByUser(actor.userId)
    : repo.findActiveCartByGuest(actor.guestSessionId);
}

async function ensureCart(actor) {
  const existing = await findCart(actor);
  if (existing) {
    const expired = existing.expires_at ? new Date(existing.expires_at).getTime() <= Date.now() : false;
    if (!expired) return existing;
    await repo.updateCartStatus(existing.id, CART_STATUS.ABANDONED);
  }

  try {
    return await repo.insertCart({
      user_id: actor.userId,
      guest_session_id: actor.guestSessionId,
      expires_at: actor.guestSessionId ? guestExpiry() : null,
    });
  } catch (error) {
    // Hai request song song cùng tạo giỏ: unique index ACTIVE chặn → đọc lại giỏ vừa tạo.
    if (error?.code === ERROR_CODES.DUPLICATE_RESOURCE || error?.code === ERROR_CODES.CONFLICT) {
      const retried = await findCart(actor);
      if (retried) return retried;
    }
    throw error;
  }
}

async function touchCart(cart, actor) {
  const patch = actor.guestSessionId ? { expires_at: guestExpiry() } : {};
  await repo.touchCart(cart.id, patch);
}

/* ------------------------------------------------------------------ */
/* Đọc tồn kho + dựng view một dòng (M04-F09)                         */
/* ------------------------------------------------------------------ */

async function loadStockMap(rows) {
  const skus = [
    ...new Set(rows.map((row) => row?.product_variants?.sku).filter((sku) => typeof sku === 'string')),
  ];
  if (skus.length === 0) return { stockMap: new Map(), stockChecked: true };

  try {
    const availability = await checkAvailability(skus);
    return {
      stockMap: new Map((availability ?? []).map((entry) => [entry.sku, entry])),
      stockChecked: true,
    };
  } catch {
    // M08 chưa sẵn sàng: vẫn hiển thị giỏ, chỉ không kết luận được tồn kho.
    return { stockMap: new Map(), stockChecked: false };
  }
}

function toItemView(row, stockMap, stockChecked) {
  const variant = row?.product_variants ?? {};
  const product = variant.products ?? {};
  const quantity = Number(row?.quantity ?? 0);
  const unitPrice = Number(row?.unit_price ?? 0);
  const current = priceOf(product);
  const entry = variant.sku ? stockMap.get(variant.sku) : null;
  const available = stockChecked ? Number(entry?.available ?? 0) : null;

  const isPurchasable =
    variant.is_active !== false &&
    !variant.deleted_at &&
    product.status === 'ACTIVE' &&
    !product.deleted_at;

  let stockStatus = 'UNKNOWN';
  if (!isPurchasable) stockStatus = 'UNAVAILABLE';
  else if (!stockChecked || available == null) stockStatus = 'UNKNOWN';
  else if (available <= 0) stockStatus = 'OUT_OF_STOCK';
  else if (available < quantity) stockStatus = 'INSUFFICIENT';
  else stockStatus = 'OK';

  // BR-M04-02: giá hiện tại là giá sẽ thu khi đặt hàng; unit_price chỉ để so lệch.
  const effectivePrice = current.price > 0 ? current.price : unitPrice;

  return {
    item_id: row?.id ?? null,
    saved_item_id: row?.saved_item_id ?? null,
    cart_id: row?.cart_id ?? null,
    product_id: variant.product_id ?? product.id ?? null,
    variant_id: row?.variant_id ?? null,
    sku: variant.sku ?? null,
    name: displayName(product, variant),
    product_name: product.name ?? null,
    variant_name: variant.name && variant.name !== 'Mặc định' ? variant.name : null,
    slug: product.slug ?? null,
    image_url: variant.image_url ?? thumbnailOf(product),
    quantity,
    unit_price: unitPrice,
    current_price: current.price,
    effective_price: effectivePrice,
    price_regular: current.regular,
    price_sale: current.sale,
    price_changed: unitPrice > 0 && unitPrice !== current.price,
    line_total: effectivePrice * quantity,
    available,
    stock_status: stockStatus,
    is_purchasable: isPurchasable,
    is_selected: false,
  };
}

function buildWarnings(items) {
  const warnings = [];
  for (const item of items) {
    if (!item.is_purchasable) {
      warnings.push({
        item_id: item.item_id,
        item_name: item.name,
        type: 'UNAVAILABLE',
        message: `${item.name} đã ngừng kinh doanh, vui lòng xóa khỏi giỏ.`,
      });
      continue;
    }
    if (item.stock_status === 'OUT_OF_STOCK') {
      warnings.push({
        item_id: item.item_id,
        item_name: item.name,
        type: 'OUT_OF_STOCK',
        message: `${item.name} đã hết hàng.`,
      });
      continue;
    }
    if (item.stock_status === 'INSUFFICIENT') {
      warnings.push({
        item_id: item.item_id,
        item_name: item.name,
        type: 'INSUFFICIENT_STOCK',
        available: item.available,
        message: `${item.name} chỉ còn ${item.available} sản phẩm trong kho.`,
      });
    }
    if (item.price_changed) {
      warnings.push({
        item_id: item.item_id,
        item_name: item.name,
        type: 'PRICE_CHANGED',
        previous_price: item.unit_price,
        current_price: item.current_price,
        message: `Giá ${item.name} đã thay đổi thành ${item.current_price.toLocaleString('vi-VN')}đ.`,
      });
    }
  }
  return warnings;
}

function buildSummary({ cart, items, savedItems, selectedItemIds, isGuest }) {
  const warnings = buildWarnings(items);

  const selectable = items
    .filter((item) => !BLOCKING_STOCK_STATUSES.has(item.stock_status))
    .map((item) => item.item_id);
  const selectableSet = new Set(selectable);

  const requested =
    Array.isArray(selectedItemIds) && selectedItemIds.length > 0 ? selectedItemIds : selectable;
  const selected = [];
  for (const id of requested) {
    if (selectableSet.has(id) && !selected.includes(id)) selected.push(id);
  }
  const selectedSet = new Set(selected);

  const itemsWithSelection = items.map((item) => ({
    ...item,
    is_selected: selectedSet.has(item.item_id),
  }));

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const selectedSubtotal = items
    .filter((item) => selectedSet.has(item.item_id))
    .reduce((sum, item) => sum + item.line_total, 0);
  const totalDiscount = 0;

  return {
    cart_id: cart?.id ?? null,
    items: itemsWithSelection,
    saved_items: savedItems,
    total_items: totalItems,
    total_lines: items.length,
    subtotal,
    selected_item_ids: selected,
    selected_item_count: selected.length,
    selected_subtotal: selectedSubtotal,
    total_discount: totalDiscount,
    estimated_total: Math.max(0, selectedSubtotal - totalDiscount),
    warnings,
    coupon: null,
    // Giỏ khách chưa tạo vẫn phải báo is_guest để UI hiện đúng lời nhắc (M04-F02).
    is_guest: typeof isGuest === 'boolean' ? isGuest : Boolean(cart?.guest_session_id),
    expires_at: cart?.expires_at ?? null,
    save_for_later_enabled: SAVE_FOR_LATER_ENABLED,
    max_quantity_per_item: MAX_QUANTITY_PER_ITEM,
    undo_delete_ms: UNDO_DELETE_MS,
  };
}

function emptySummary(isGuest) {
  return buildSummary({ cart: null, items: [], savedItems: [], selectedItemIds: [], isGuest });
}

/** Dựng lại toàn bộ giỏ: so giá hiện tại + tồn khả dụng (M04-F09). */
export async function composeCart(cart, { selectedItemIds } = {}) {
  if (!cart) return emptySummary();

  const [itemRows, savedRows] = await Promise.all([
    repo.listCartItems(cart.id),
    repo.listSavedItems(cart.id),
  ]);

  const { stockMap, stockChecked } = await loadStockMap([...itemRows, ...savedRows]);
  const items = itemRows.map((row) => toItemView(row, stockMap, stockChecked));
  const savedItems = savedRows.map((row) => ({
    ...toItemView({ ...row, saved_item_id: row.id, item_id: null }, stockMap, stockChecked),
    saved_item_id: row.id,
  }));

  return buildSummary({ cart, items, savedItems, selectedItemIds });
}

/* ------------------------------------------------------------------ */
/* API-M04-01 — Xem giỏ (M04-F02, F09)                                */
/* ------------------------------------------------------------------ */

export async function getCart({ auth, guestSessionId, query = {} } = {}) {
  const actor = actorOf({ auth, guestSessionId });
  const isGuest = !actor.userId;
  if (!actor.userId && !actor.guestSessionId) return emptySummary(isGuest);

  const cart = await findCart(actor);
  if (!cart) return emptySummary(isGuest);

  const summary = await composeCart(cart, { selectedItemIds: parseIdList(query.selected_item_ids) });
  return { ...summary, is_guest: isGuest };
}

/** M04-F09 — kiểm tra lại giá/tồn và trả cảnh báo cho UI. */
export async function revalidateCart(context = {}) {
  return getCart(context);
}

/* ------------------------------------------------------------------ */
/* API-M04-02 — Thêm sản phẩm (M04-F01, BR-M04-01/05)                 */
/* ------------------------------------------------------------------ */

export async function addCartItem({ auth, guestSessionId, body }) {
  const actor = requireActor({ auth, guestSessionId });
  const quantity = Number(body.quantity);

  const snapshot = await getProductSnapshot(body.product_id, body.variant_id ?? undefined);
  if (snapshot.status !== 'ACTIVE' || snapshot.deleted_at) {
    throw invalid('Sản phẩm hiện không được bán. Vui lòng chọn sản phẩm khác.', {
      product_id: snapshot.product_id,
      status: snapshot.status,
    });
  }

  const [availability] = await checkAvailability([snapshot.sku]);
  const available = Number(availability?.available ?? 0);

  const cart = await ensureCart(actor);
  const existing = await repo.findCartItemByVariant(cart.id, snapshot.variant_id);
  const currentQuantity = existing ? Number(existing.quantity) : 0;
  const nextQuantity = currentQuantity + quantity;

  if (nextQuantity > MAX_QUANTITY_PER_ITEM) {
    throw conflict(`Mỗi sản phẩm chỉ được thêm tối đa ${MAX_QUANTITY_PER_ITEM} đơn vị.`, {
      sku: snapshot.sku,
      max_quantity: MAX_QUANTITY_PER_ITEM,
      current_quantity: currentQuantity,
    });
  }
  if (available <= 0) {
    throw insufficientStock(`${snapshot.name} đã hết hàng.`, {
      sku: snapshot.sku,
      available,
    });
  }
  if (nextQuantity > available) {
    throw insufficientStock(`Chỉ còn ${available} sản phẩm ${snapshot.name} trong kho.`, {
      sku: snapshot.sku,
      available,
      current_quantity: currentQuantity,
      requested_quantity: nextQuantity,
    });
  }

  if (existing) {
    await repo.updateCartItemQuantity(existing.id, nextQuantity);
  } else {
    try {
      await repo.insertCartItem({
        cart_id: cart.id,
        variant_id: snapshot.variant_id,
        quantity,
        unit_price: snapshot.price,
      });
    } catch (error) {
      if (error?.code !== ERROR_CODES.DUPLICATE_RESOURCE) throw error;
      const raced = await repo.findCartItemByVariant(cart.id, snapshot.variant_id);
      if (!raced) throw error;
      await repo.updateCartItemQuantity(raced.id, Number(raced.quantity) + quantity);
    }
  }

  await touchCart(cart, actor);
  return { success: true, cart_summary: await composeCart(cart) };
}

/* ------------------------------------------------------------------ */
/* API-M04-03 — Cập nhật số lượng (M04-F03, BR-M04-06)                */
/* ------------------------------------------------------------------ */

export async function updateCartItem({ auth, guestSessionId, params, body }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const item = await repo.findCartItemById(params.itemId);
  if (!item || item.cart_id !== cart.id) throw notFound('Không tìm thấy sản phẩm trong giỏ hàng.');

  const quantity = Number(body.quantity);

  if (quantity === 0) {
    await repo.deleteCartItem(item.id);
    await touchCart(cart, actor);
    const summary = await composeCart(cart);
    return {
      item_id: item.id,
      quantity: 0,
      removed: true,
      line_total: 0,
      cart_subtotal: summary.selected_subtotal,
      cart_summary: summary,
    };
  }

  if (quantity > MAX_QUANTITY_PER_ITEM) {
    throw conflict(`Mỗi sản phẩm chỉ được thêm tối đa ${MAX_QUANTITY_PER_ITEM} đơn vị.`, {
      max_quantity: MAX_QUANTITY_PER_ITEM,
    });
  }

  const itemView = toItemView(item, new Map(), false);
  const sku = itemView.sku;
  if (sku) {
    const [availability] = await checkAvailability([sku]);
    const available = Number(availability?.available ?? 0);
    if (available <= 0) {
      throw insufficientStock(`${itemView.name} đã hết hàng.`, { sku, available });
    }
    if (quantity > available) {
      throw insufficientStock(`Chỉ còn ${available} sản phẩm ${itemView.name} trong kho.`, {
        sku,
        available,
        requested_quantity: quantity,
      });
    }
  }

  const updated = await repo.updateCartItemQuantity(item.id, quantity);
  await touchCart(cart, actor);
  const cartSummary = await composeCart(cart);
  const refreshed = cartSummary.items.find((entry) => entry.item_id === updated.id);

  return {
    item_id: updated.id,
    quantity: Number(updated.quantity),
    line_total: refreshed?.line_total ?? 0,
    cart_subtotal: cartSummary.subtotal,
    cart_summary: cartSummary,
  };
}

/* ------------------------------------------------------------------ */
/* API-M04-04 / 05 / 08 — Xóa (M04-F04, F05)                          */
/* ------------------------------------------------------------------ */

function undoPayload(view) {
  if (!view) return null;
  return {
    item_id: view.item_id,
    product_id: view.product_id,
    variant_id: view.variant_id,
    quantity: view.quantity,
    name: view.name,
    unit_price: view.unit_price,
    image_url: view.image_url,
  };
}

export async function removeCartItem({ auth, guestSessionId, params }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const item = await repo.findCartItemById(params.itemId);
  if (!item || item.cart_id !== cart.id) throw notFound('Không tìm thấy sản phẩm trong giỏ hàng.');

  const removedView = toItemView(item, new Map(), false);
  await repo.deleteCartItem(item.id);
  await touchCart(cart, actor);

  return {
    success: true,
    message: 'Đã xóa sản phẩm khỏi giỏ hàng.',
    removed_item: undoPayload(removedView),
    undo_window_ms: UNDO_DELETE_MS,
    cart_summary: await composeCart(cart),
  };
}

export async function bulkRemoveCartItems({ auth, guestSessionId, body }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const removedRows = await repo.deleteCartItems(cart.id, body.item_ids);
  if (removedRows.length === 0) throw notFound('Không tìm thấy sản phẩm nào để xóa.');

  await touchCart(cart, actor);
  return {
    success: true,
    removed_count: removedRows.length,
    removed_items: removedRows.map((row) => undoPayload(toItemView(row, new Map(), false))),
    message: `Đã xóa ${removedRows.length} sản phẩm khỏi giỏ hàng.`,
    cart_summary: await composeCart(cart),
  };
}

export async function clearCart({ auth, guestSessionId }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) return { success: true, removed_count: 0, message: 'Giỏ hàng đang trống.', cart_summary: emptySummary() };

  const removed = await repo.deleteAllCartItems(cart.id);
  await touchCart(cart, actor);

  return {
    success: true,
    removed_count: removed.length,
    message: 'Đã xóa toàn bộ sản phẩm trong giỏ hàng.',
    cart_summary: await composeCart(cart),
  };
}

/* ------------------------------------------------------------------ */
/* API-M04-09 — Chọn sản phẩm để thanh toán (M04-F06)                 */
/* ------------------------------------------------------------------ */

export async function selectItemsForCheckout({ auth, guestSessionId, body }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const rows = await repo.listCartItems(cart.id);
  const ownedIds = new Set(rows.map((row) => row.id));
  const foreign = body.item_ids.filter((id) => !ownedIds.has(id));
  if (foreign.length > 0) {
    throw invalid('Có sản phẩm không thuộc giỏ hàng hiện tại.', { item_ids: foreign });
  }

  const summary = await composeCart(cart, { selectedItemIds: body.item_ids });
  if (summary.selected_item_ids.length === 0) {
    throw invalid('Vui lòng chọn ít nhất một sản phẩm còn hàng để thanh toán.');
  }

  return summary;
}

/* ------------------------------------------------------------------ */
/* API-M04-07 — Áp mã giảm giá (M04-F07, OPEN_DECISIONS #9)           */
/* ------------------------------------------------------------------ */

export async function applyCouponToCart({ auth, guestSessionId, body }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const summary = await composeCart(cart, {
    selectedItemIds: parseIdList(body.item_ids),
  });
  if (summary.selected_item_ids.length === 0) {
    throw invalid('Vui lòng chọn sản phẩm cần áp mã giảm giá.');
  }

  const selected = new Set(summary.selected_item_ids);
  const items = summary.items
    .filter((item) => selected.has(item.item_id))
    .map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      sku: item.sku,
      quantity: item.quantity,
      line_total: item.line_total,
    }));

  let coupon;
  try {
    coupon = await CouponService.verifyCoupon({
      code: body.coupon_code,
      order_amount: summary.selected_subtotal,
      user_id: actor.userId,
      guest_session_id: actor.guestSessionId,
      items,
    });
  } catch (error) {
    if (error instanceof NotImplementedError) {
      throw new AppError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Tính năng mã giảm giá đang được hoàn thiện và sẽ sớm ra mắt. Bạn vẫn có thể đặt hàng bình thường.',
        { details: { reason: 'M09_COUPON_PENDING', feature: 'M04-F07' } },
      );
    }
    throw error;
  }

  const discountAmount = Number(coupon?.discount_amount ?? 0);
  return {
    code: body.coupon_code,
    discount_amount: discountAmount,
    new_total: Math.max(0, summary.selected_subtotal - discountAmount),
    message: coupon?.message ?? 'Mã giảm giá hợp lệ.',
    cart_summary: summary,
  };
}

/* ------------------------------------------------------------------ */
/* API-M04-06 — Gộp giỏ guest vào thành viên (M04-F08)                */
/* ------------------------------------------------------------------ */

async function mergeIntoUserCart(userId, guestSessionId) {
  if (!userId) throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Cần đăng nhập để gộp giỏ hàng.');
  if (!guestSessionId) throw invalid('Thiếu mã phiên giỏ khách vãng lai.');

  const guestCart = await repo.findActiveCartByGuest(guestSessionId);

  if (!guestCart) {
    // Không có giỏ khách thì không tạo giỏ rỗng cho thành viên (gọi lặp sau mỗi lần đăng nhập).
    const existingUserCart = await repo.findActiveCartByUser(userId);
    const summary = existingUserCart ? await composeCart(existingUserCart) : null;
    return {
      merged_cart_id: existingUserCart?.id ?? null,
      total_items: summary?.total_items ?? 0,
      merged_items: 0,
      warnings: [],
      message: 'Không có giỏ khách vãng lai để gộp.',
    };
  }

  const userCart = await ensureCart({ userId, guestSessionId: null });
  if (guestCart.id === userCart.id) {
    const summary = await composeCart(userCart);
    return {
      merged_cart_id: userCart.id,
      total_items: summary.total_items,
      merged_items: 0,
      warnings: [],
      message: 'Giỏ hàng đã thuộc tài khoản hiện tại.',
    };
  }

  const [guestRows, guestSavedRows] = await Promise.all([
    repo.listCartItems(guestCart.id),
    repo.listSavedItems(guestCart.id),
  ]);
  const { stockMap, stockChecked } = await loadStockMap([...guestRows, ...guestSavedRows]);
  const warnings = [];
  let mergedItems = 0;

  for (const row of guestRows) {
    const view = toItemView(row, stockMap, stockChecked);
    if (!view.is_purchasable) {
      warnings.push({
        item_id: view.item_id,
        item_name: view.name,
        type: 'UNAVAILABLE',
        message: `${view.name} đã ngừng kinh doanh nên không được gộp vào giỏ.`,
      });
      continue;
    }

    const available = stockChecked ? (view.available ?? 0) : MAX_QUANTITY_PER_ITEM;
    const existing = await repo.findCartItemByVariant(userCart.id, row.variant_id);
    const currentQuantity = existing ? Number(existing.quantity) : 0;
    const target = Math.min(currentQuantity + Number(row.quantity), MAX_QUANTITY_PER_ITEM, available);

    if (target <= currentQuantity) {
      warnings.push({
        item_id: view.item_id,
        item_name: view.name,
        type: 'INSUFFICIENT_STOCK',
        available,
        message: `${view.name} chỉ còn ${available} sản phẩm nên không gộp thêm được.`,
      });
      continue;
    }

    if (existing) {
      await repo.updateCartItemQuantity(existing.id, target);
    } else {
      await repo.insertCartItem({
        cart_id: userCart.id,
        variant_id: row.variant_id,
        quantity: target,
        unit_price: view.unit_price || view.current_price,
      });
    }
    if (target < currentQuantity + Number(row.quantity)) {
      warnings.push({
        item_id: view.item_id,
        item_name: view.name,
        type: 'QUANTITY_CAPPED',
        available,
        message: `${view.name} được điều chỉnh còn ${target} sản phẩm do giới hạn tồn kho.`,
      });
    }
    mergedItems += 1;
  }

  for (const row of guestSavedRows) {
    const existing = await repo.findSavedItemByVariant(userCart.id, row.variant_id);
    if (existing) continue;
    await repo.insertSavedItem({
      cart_id: userCart.id,
      variant_id: row.variant_id,
      quantity: Number(row.quantity),
    });
  }

  await repo.deleteAllCartItems(guestCart.id);
  await repo.updateCartStatus(guestCart.id, CART_STATUS.MERGED);
  await touchCart(userCart, { userId, guestSessionId: null });

  const summary = await composeCart(userCart);
  return {
    merged_cart_id: userCart.id,
    total_items: summary.total_items,
    merged_items: mergedItems,
    warnings,
    message: mergedItems > 0 ? `Đã gộp ${mergedItems} sản phẩm vào giỏ hàng.` : 'Không có sản phẩm nào được gộp.',
    cart_summary: summary,
  };
}

export async function mergeGuestCart({ auth, body }) {
  const userId = auth?.userId ?? null;
  return mergeIntoUserCart(userId, body.guest_session_id);
}

/** Dùng cho M01 sau khi đăng nhập thành công (M04-F08). */
export async function mergeGuestCartIntoUser(userId, guestSessionId) {
  return mergeIntoUserCart(userId, guestSessionId);
}

/* ------------------------------------------------------------------ */
/* M04-F10 — Để dành mua sau                                          */
/* ------------------------------------------------------------------ */

export async function saveForLater({ auth, guestSessionId, params }) {
  if (!SAVE_FOR_LATER_ENABLED) {
    throw new AppError(ERROR_CODES.NOT_IMPLEMENTED, 'Tính năng “Để dành mua sau” đang tạm tắt.');
  }

  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const item = await repo.findCartItemById(params.itemId);
  if (!item || item.cart_id !== cart.id) throw notFound('Không tìm thấy sản phẩm trong giỏ hàng.');

  const existing = await repo.findSavedItemByVariant(cart.id, item.variant_id);
  const saved = existing
    ? existing
    : await repo.insertSavedItem({
        cart_id: cart.id,
        variant_id: item.variant_id,
        quantity: Number(item.quantity),
      });

  await repo.deleteCartItem(item.id);
  await touchCart(cart, actor);

  return {
    success: true,
    saved_item: { saved_item_id: saved.id, variant_id: item.variant_id, quantity: Number(item.quantity) },
    message: 'Đã chuyển sản phẩm sang “Để dành mua sau”.',
    cart_summary: await composeCart(cart),
  };
}

export async function restoreSavedItem({ auth, guestSessionId, params }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const saved = await repo.findSavedItemById(params.savedItemId);
  if (!saved || saved.cart_id !== cart.id) throw notFound('Không tìm thấy sản phẩm đã lưu.');

  const view = toItemView({ ...saved, item_id: null }, new Map(), false);
  if (!view.is_purchasable) {
    throw conflict(`${view.name} đã ngừng kinh doanh nên không thể thêm lại vào giỏ.`);
  }

  const [availability] = await checkAvailability([view.sku]);
  const available = Number(availability?.available ?? 0);
  if (view.sku && available <= 0) {
    throw insufficientStock(`${view.name} đã hết hàng.`, { sku: view.sku, available });
  }

  const existing = await repo.findCartItemByVariant(cart.id, saved.variant_id);
  const currentQuantity = existing ? Number(existing.quantity) : 0;
  const target = Math.min(currentQuantity + Number(saved.quantity), MAX_QUANTITY_PER_ITEM, available);
  if (target <= currentQuantity) {
    throw conflict(`Giỏ hàng đã có tối đa ${MAX_QUANTITY_PER_ITEM} đơn vị ${view.name}.`, {
      max_quantity: MAX_QUANTITY_PER_ITEM,
    });
  }

  let itemId = existing?.id ?? null;
  if (existing) {
    await repo.updateCartItemQuantity(existing.id, target);
  } else {
    const created = await repo.insertCartItem({
      cart_id: cart.id,
      variant_id: saved.variant_id,
      quantity: target,
      unit_price: view.current_price,
    });
    itemId = created.id;
  }

  await repo.deleteSavedItem(saved.id);
  await touchCart(cart, actor);

  return {
    success: true,
    item_id: itemId,
    quantity: target,
    message: 'Đã thêm lại sản phẩm vào giỏ hàng.',
    cart_summary: await composeCart(cart),
  };
}

export async function removeSavedItem({ auth, guestSessionId, params }) {
  const actor = requireActor({ auth, guestSessionId });
  const cart = await findCart(actor);
  if (!cart) throw notFound('Không tìm thấy giỏ hàng.');

  const saved = await repo.findSavedItemById(params.savedItemId);
  if (!saved || saved.cart_id !== cart.id) throw notFound('Không tìm thấy sản phẩm đã lưu.');

  await repo.deleteSavedItem(saved.id);
  await touchCart(cart, actor);

  return {
    success: true,
    message: 'Đã xóa sản phẩm khỏi danh sách mua sau.',
    cart_summary: await composeCart(cart),
  };
}

/* ------------------------------------------------------------------ */
/* Hợp đồng cho M05 (public.server.js)                                */
/* ------------------------------------------------------------------ */

/** M04-F06 — Tóm tắt giỏ cho đúng các dòng M05 sắp đặt. */
export async function getCartSummaryForCheckout(userId, itemIds) {
  const cart = userId ? await repo.findActiveCartByUser(userId) : null;
  if (!cart) return emptySummary();

  const ids = Array.isArray(itemIds) ? itemIds.filter(Boolean) : [];
  return composeCart(cart, { selectedItemIds: ids });
}

/** M04-F05 — Chốt giỏ sau khi tạo đơn thành công. */
export async function clearCartAfterOrder(cartId) {
  const cart = await repo.findCartById(cartId);
  if (!cart) return { cart_id: cartId, cleared: false, removed_count: 0 };

  const removed = await repo.deleteAllCartItems(cart.id);
  await repo.updateCartStatus(cart.id, CART_STATUS.CONVERTED);

  return { cart_id: cart.id, cleared: true, status: CART_STATUS.CONVERTED, removed_count: removed.length };
}
