import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M04 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze(['carts', 'cart_items', 'cart_saved_items']);

/**
 * Repository chỉ ánh xạ dữ liệu; business rule nằm ở service.
 */
const table = (name) => getSupabaseAdmin().from(name);

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data ?? [];
}

async function runOne(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data ?? null;
}

/**
 * Cột join dùng chung: dòng giỏ → biến thể → sản phẩm → ảnh.
 * Sản phẩm/biến thể đã soft-delete vẫn phải đọc được để hiển thị "ngừng bán"
 * thay vì âm thầm mất dòng (M04-F09).
 */
const CART_ITEM_SELECT = [
  'id',
  'cart_id',
  'variant_id',
  'quantity',
  'unit_price',
  'created_at',
  'updated_at',
  'product_variants!inner(id,sku,name,image_url,is_active,deleted_at,product_id,' +
    'products!inner(id,name,slug,status,price_regular,price_sale,deleted_at,' +
    'product_images(url,is_thumbnail,sort_order)))',
].join(',');

const SAVED_ITEM_SELECT = [
  'id',
  'cart_id',
  'variant_id',
  'quantity',
  'created_at',
  'product_variants!inner(id,sku,name,image_url,is_active,deleted_at,product_id,' +
    'products!inner(id,name,slug,status,price_regular,price_sale,deleted_at,' +
    'product_images(url,is_thumbnail,sort_order)))',
].join(',');

/* ------------------------------------------------------------------ */
/* carts (M04-F02, F05, F08)                                          */
/* ------------------------------------------------------------------ */

export async function findActiveCartByUser(userId) {
  return runOne(
    table('carts')
      .select('id,user_id,guest_session_id,status,expires_at,last_activity_at,created_at')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .maybeSingle(),
  );
}

export async function findActiveCartByGuest(guestSessionId) {
  return runOne(
    table('carts')
      .select('id,user_id,guest_session_id,status,expires_at,last_activity_at,created_at')
      .eq('guest_session_id', guestSessionId)
      .eq('status', 'ACTIVE')
      .maybeSingle(),
  );
}

export async function findCartById(cartId) {
  return runOne(
    table('carts')
      .select('id,user_id,guest_session_id,status,expires_at,last_activity_at,created_at')
      .eq('id', cartId)
      .maybeSingle(),
  );
}

export async function insertCart(data) {
  return runOne(
    table('carts')
      .insert({
        user_id: data.user_id ?? null,
        guest_session_id: data.guest_session_id ?? null,
        status: 'ACTIVE',
        expires_at: data.expires_at ?? null,
      })
      .select('id,user_id,guest_session_id,status,expires_at,last_activity_at,created_at')
      .single(),
  );
}

export async function touchCart(cartId, patch = {}) {
  return runOne(
    table('carts')
      .update({ last_activity_at: new Date().toISOString(), ...patch })
      .eq('id', cartId)
      .select('id,expires_at,last_activity_at')
      .single(),
  );
}

export async function updateCartStatus(cartId, status) {
  return runOne(
    table('carts')
      .update({ status, last_activity_at: new Date().toISOString() })
      .eq('id', cartId)
      .select('id,status')
      .single(),
  );
}

/* ------------------------------------------------------------------ */
/* cart_items (M04-F01, F03, F04, F05)                                */
/* ------------------------------------------------------------------ */

export async function listCartItems(cartId) {
  return run(
    table('cart_items')
      .select(CART_ITEM_SELECT)
      .eq('cart_id', cartId)
      .order('created_at', { ascending: true }),
  );
}

export async function findCartItemById(itemId) {
  return runOne(table('cart_items').select(CART_ITEM_SELECT).eq('id', itemId).maybeSingle());
}

export async function findCartItemByVariant(cartId, variantId) {
  return runOne(
    table('cart_items')
      .select(CART_ITEM_SELECT)
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
      .maybeSingle(),
  );
}

export async function insertCartItem(data) {
  return runOne(
    table('cart_items')
      .insert({
        cart_id: data.cart_id,
        variant_id: data.variant_id,
        quantity: data.quantity,
        unit_price: data.unit_price,
      })
      .select(CART_ITEM_SELECT)
      .single(),
  );
}

export async function updateCartItemQuantity(itemId, quantity) {
  return runOne(
    table('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select(CART_ITEM_SELECT)
      .single(),
  );
}

export async function deleteCartItem(itemId) {
  return runOne(table('cart_items').delete().eq('id', itemId).select(CART_ITEM_SELECT).maybeSingle());
}

export async function deleteCartItems(cartId, itemIds) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) return [];
  return run(
    table('cart_items').delete().eq('cart_id', cartId).in('id', itemIds).select(CART_ITEM_SELECT),
  );
}

export async function deleteAllCartItems(cartId) {
  return run(table('cart_items').delete().eq('cart_id', cartId).select('id'));
}

/* ------------------------------------------------------------------ */
/* cart_saved_items (M04-F10)                                         */
/* ------------------------------------------------------------------ */

export async function listSavedItems(cartId) {
  return run(
    table('cart_saved_items')
      .select(SAVED_ITEM_SELECT)
      .eq('cart_id', cartId)
      .order('created_at', { ascending: true }),
  );
}

export async function findSavedItemById(savedItemId) {
  return runOne(
    table('cart_saved_items').select(SAVED_ITEM_SELECT).eq('id', savedItemId).maybeSingle(),
  );
}

export async function findSavedItemByVariant(cartId, variantId) {
  return runOne(
    table('cart_saved_items')
      .select('id,cart_id,variant_id,quantity')
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
      .maybeSingle(),
  );
}

export async function insertSavedItem(data) {
  return runOne(
    table('cart_saved_items')
      .insert({ cart_id: data.cart_id, variant_id: data.variant_id, quantity: data.quantity })
      .select(SAVED_ITEM_SELECT)
      .single(),
  );
}

export async function deleteSavedItem(savedItemId) {
  return runOne(
    table('cart_saved_items')
      .delete()
      .eq('id', savedItemId)
      .select(SAVED_ITEM_SELECT)
      .maybeSingle(),
  );
}
