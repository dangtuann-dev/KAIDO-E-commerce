import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M02 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'categories',
  'brands',
  'products',
  'product_categories',
  'product_variants',
  'product_images',
]);

const PRODUCT_SUMMARY_SELECT = [
  'id',
  'name',
  'slug',
  'short_description',
  'status',
  'age_group',
  'gender_target',
  'price_regular',
  'price_sale',
  'low_stock_threshold',
  'is_featured',
  'sold_count',
  'rating_avg',
  'rating_count',
  'created_at',
  'updated_at',
  'brands:brand_id(id,name,slug,logo_url)',
  `product_categories!inner(category_id,is_primary,categories(id,name,slug,parent_id,is_active,deleted_at))`,
  'product_images(url,alt_text,is_thumbnail,sort_order)',
  'product_variants(id,sku,name,is_default,is_active)',
].join(',');

const PRODUCT_DETAIL_SELECT = [
  'id',
  'name',
  'slug',
  'short_description',
  'description',
  'brand_id',
  'status',
  'age_group',
  'gender_target',
  'material',
  'origin_country',
  'safety_info',
  'price_regular',
  'price_sale',
  'low_stock_threshold',
  'is_featured',
  'sold_count',
  'rating_avg',
  'rating_count',
  'meta_title',
  'meta_description',
  'created_at',
  'updated_at',
  'deleted_at',
  'brands:brand_id(id,name,slug,logo_url,description)',
  'product_categories(category_id,is_primary,categories(id,name,slug,parent_id,is_active,deleted_at))',
  'product_images(id,url,alt_text,is_thumbnail,sort_order)',
  'product_variants(id,sku,name,attributes,image_url,is_default,is_active,sort_order,deleted_at)',
].join(',');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data;
}

/** @param {string} table */
const table = (name) => getSupabaseAdmin().from(name);

function sanitizeKeyword(value) {
  return String(value ?? '')
    .replace(/[,()%*\\]/g, ' ')
    .trim();
}

export function isUuid(value) {
  return UUID_PATTERN.test(String(value ?? ''));
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function listCategories({ includeInactive = false } = {}) {
  let query = table('categories')
    .select('id,parent_id,name,slug,description,icon_url,image_url,sort_order,is_active,seo_title,seo_description,created_at,updated_at')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);
  return run(query);
}

export async function findCategoryById(id) {
  return run(
    table('categories')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle(),
  );
}

export async function findCategoryBySlug(slug) {
  return run(
    table('categories')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle(),
  );
}

export async function insertCategory(data) {
  return run(table('categories').insert(data).select().single());
}

export async function updateCategoryRow(id, patch) {
  return run(
    table('categories')
      .update(patch)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .maybeSingle(),
  );
}

export async function softDeleteCategoryRow(id) {
  return run(
    table('categories')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle(),
  );
}

export async function countCategoryChildren(parentId) {
  const { count, error } = await table('categories')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', parentId)
    .is('deleted_at', null);
  if (error) throw fromSupabaseError(error);
  return count ?? 0;
}

export async function countProductsInCategory(categoryId) {
  const { count, error } = await table('product_categories')
    .select('product_id,products!inner(id,deleted_at)', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .is('products.deleted_at', null);
  if (error) throw fromSupabaseError(error);
  return count ?? 0;
}

/* ------------------------------------------------------------------ */
/* Brands                                                              */
/* ------------------------------------------------------------------ */

export async function listBrands({ includeInactive = false } = {}) {
  let query = table('brands')
    .select('id,name,slug,logo_url,description,is_active,created_at,updated_at')
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  return run(query);
}

export async function findBrandById(id) {
  return run(table('brands').select('*').eq('id', id).is('deleted_at', null).maybeSingle());
}

export async function findBrandBySlug(slug) {
  return run(table('brands').select('*').eq('slug', slug).is('deleted_at', null).maybeSingle());
}

export async function insertBrand(data) {
  return run(table('brands').insert(data).select().single());
}

export async function updateBrandRow(id, patch) {
  return run(
    table('brands')
      .update(patch)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .maybeSingle(),
  );
}

export async function softDeleteBrandRow(id) {
  return run(
    table('brands')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle(),
  );
}

export async function countProductsByBrand(brandId) {
  const { count, error } = await table('products')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .is('deleted_at', null);
  if (error) throw fromSupabaseError(error);
  return count ?? 0;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {{
 *   page: number, limit: number, status?: string, onlyActive?: boolean,
 *   categoryIds?: string[], brandId?: string, keyword?: string, sort?: string,
 *   excludeId?: string,
 * }} filters
 */
export async function listProductRows(filters) {
  const select = filters.detail ? PRODUCT_DETAIL_SELECT : PRODUCT_SUMMARY_SELECT;
  let query = table('products').select(select, { count: 'exact' }).is('deleted_at', null);

  if (filters.status) query = query.eq('status', filters.status);
  else if (filters.onlyActive) query = query.eq('status', 'ACTIVE');

  if (filters.brandId) query = query.eq('brand_id', filters.brandId);
  if (filters.excludeId) query = query.neq('id', filters.excludeId);

  if (filters.categoryIds) {
    if (filters.categoryIds.length === 0) return { rows: [], total: 0 };
    query = query
      .in('product_categories.category_id', filters.categoryIds)
      .eq('product_categories.is_primary', true);
  } else if (filters.onlyActive) {
    query = query.eq('product_categories.is_primary', true);
  }

  const keyword = sanitizeKeyword(filters.keyword);
  if (keyword) query = query.ilike('name', `%${keyword}%`);

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price_regular', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_regular', { ascending: false });
      break;
    case 'bestselling':
      query = query.order('sold_count', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('sold_count', { ascending: false })
        .order('created_at', { ascending: false });
  }

  const offset = (filters.page - 1) * filters.limit;
  query = query.range(offset, offset + filters.limit - 1);

  const { data, error, count } = await query;
  if (error) throw fromSupabaseError(error);
  return { rows: data ?? [], total: count ?? 0 };
}

export async function findProductByIdOrSlug(identifier, { onlyActive = false } = {}) {
  const column = isUuid(identifier) ? 'id' : 'slug';
  let query = table('products').select(PRODUCT_DETAIL_SELECT).eq(column, identifier);

  if (onlyActive) query = query.eq('status', 'ACTIVE');
  query = query.is('deleted_at', null);

  return run(query.maybeSingle());
}

export async function findProductById(id, { includeDeleted = false } = {}) {
  let query = table('products').select(PRODUCT_DETAIL_SELECT).eq('id', id);
  if (!includeDeleted) query = query.is('deleted_at', null);
  return run(query.maybeSingle());
}

export async function findProductBySlug(slug) {
  return run(
    table('products')
      .select('id,slug')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle(),
  );
}

export async function insertProductRow(data) {
  return run(table('products').insert(data).select('id,slug,name,status,created_at,updated_at').single());
}

/** Chỉ dùng để dọn dữ liệu khi tạo sản phẩm thất bại giữa chừng. */
export async function hardDeleteProductRow(id) {
  return run(table('products').delete().eq('id', id).select('id').maybeSingle());
}

export async function updateProductRow(id, patch) {
  return run(
    table('products')
      .update(patch)
      .eq('id', id)
      .is('deleted_at', null)
      .select('id,slug,status,updated_at')
      .maybeSingle(),
  );
}

export async function softDeleteProductRow(id) {
  return run(
    table('products')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'INACTIVE',
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle(),
  );
}

export async function updateProductRatingSummaryRow(id, { rating_avg, rating_count }) {
  return run(
    table('products')
      .update({ rating_avg, rating_count })
      .eq('id', id)
      .select('id,rating_avg,rating_count')
      .maybeSingle(),
  );
}

/* ------------------------------------------------------------------ */
/* Product ↔ category                                                  */
/* ------------------------------------------------------------------ */

export async function replaceProductCategories(productId, rows) {
  await run(table('product_categories').delete().eq('product_id', productId));
  if (rows.length === 0) return [];
  return run(table('product_categories').insert(rows).select('product_id,category_id,is_primary'));
}

/* ------------------------------------------------------------------ */
/* Variants                                                            */
/* ------------------------------------------------------------------ */

export async function listVariantsByProduct(productId, { includeDeleted = false } = {}) {
  let query = table('product_variants')
    .select('id,product_id,sku,name,attributes,image_url,is_default,is_active,sort_order,created_at,updated_at,deleted_at')
    .eq('product_id', productId)
    .order('is_default', { ascending: false })
    .order('sort_order', { ascending: true });
  if (!includeDeleted) query = query.is('deleted_at', null);
  return run(query);
}

export async function findVariantBySku(sku) {
  return run(
    table('product_variants')
      .select('id,product_id,sku,deleted_at')
      .eq('sku', sku)
      .maybeSingle(),
  );
}

export async function findVariantById(id) {
  return run(table('product_variants').select('*').eq('id', id).maybeSingle());
}

export async function insertVariantRow(data) {
  return run(table('product_variants').insert(data).select().single());
}

export async function updateVariantRow(id, patch) {
  return run(
    table('product_variants')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle(),
  );
}

export async function softDeleteVariantsExcept(productId, keepIds) {
  let query = table('product_variants')
    .update({ deleted_at: new Date().toISOString(), is_active: false, is_default: false })
    .eq('product_id', productId)
    .is('deleted_at', null);

  if (keepIds.length > 0) {
    query = query.not('id', 'in', `(${keepIds.join(',')})`);
  }

  return run(query.select('id'));
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

export async function listImagesByProduct(productId) {
  return run(
    table('product_images')
      .select('id,product_id,url,alt_text,is_thumbnail,sort_order')
      .eq('product_id', productId)
      .order('is_thumbnail', { ascending: false })
      .order('sort_order', { ascending: true }),
  );
}

export async function replaceProductImages(productId, rows) {
  await run(table('product_images').delete().eq('product_id', productId));
  if (rows.length === 0) return [];
  return run(table('product_images').insert(rows).select('id,url,alt_text,is_thumbnail,sort_order'));
}

export async function insertProductImageRow(data) {
  return run(table('product_images').insert(data).select('id,url,alt_text,is_thumbnail,sort_order').single());
}

export async function updateProductImageRow(id, patch) {
  return run(table('product_images').update(patch).eq('id', id).select().maybeSingle());
}

export async function deleteProductImageRow(id) {
  return run(table('product_images').delete().eq('id', id).select('id').maybeSingle());
}

/* ------------------------------------------------------------------ */
/* Cross queries                                                       */
/* ------------------------------------------------------------------ */

export async function listProductSummariesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  return run(
    table('products')
      .select(PRODUCT_SUMMARY_SELECT)
      .in('id', ids)
      .is('deleted_at', null),
  );
}

export async function listRelatedProductRows({ categoryId, excludeId, limit }) {
  const { data, error } = await table('products')
    .select(PRODUCT_SUMMARY_SELECT, { count: 'exact' })
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)
    .neq('id', excludeId)
    .eq('product_categories.category_id', categoryId)
    .eq('product_categories.is_primary', true)
    .order('sold_count', { ascending: false })
    .limit(limit);

  if (error) throw fromSupabaseError(error);
  return data ?? [];
}

export async function listCatalogDeltaRows(sinceIso) {
  let query = table('products')
    .select(
      'id,slug,name,status,price_regular,price_sale,updated_at,deleted_at,' +
        'product_variants(id,sku,name,is_default,is_active,deleted_at)',
    )
    .order('updated_at', { ascending: true });

  if (sinceIso) query = query.gte('updated_at', sinceIso);
  return run(query);
}

export async function listProductsWithVariants({ onlyActive = true } = {}) {
  let query = table('products')
    .select(
      'id,name,slug,low_stock_threshold,status,price_regular,price_sale,' +
        'product_variants(id,sku,name,is_active,deleted_at)',
    )
    .is('deleted_at', null);
  if (onlyActive) query = query.eq('status', 'ACTIVE');
  return run(query);
}
