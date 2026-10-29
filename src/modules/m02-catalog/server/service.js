import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { slugify } from '@/shared/utils/slugify.js';
import { checkAvailability } from '@/modules/m08-inventory/public.server.js';
import * as repo from './repository.js';
import { LOW_STOCK_THRESHOLD, RELATED_PRODUCTS_LIMIT } from './constants.js';

function fail(status, code, message, details) {
  return new AppError(code, message, { status, details });
}

function notFound(message = 'Không tìm thấy dữ liệu.') {
  return fail(404, ERROR_CODES.NOT_FOUND, message);
}

function duplicate(message, details) {
  return fail(409, ERROR_CODES.DUPLICATE_RESOURCE, message, details);
}

function conflict(message, details) {
  return fail(409, ERROR_CODES.CONFLICT, message, details);
}

function pickDefined(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function priceOf(product) {
  const regular = toNumber(product.price_regular);
  const sale = product.price_sale == null ? null : toNumber(product.price_sale);
  const price = sale != null && sale < regular ? sale : regular;
  const discountPercent =
    sale != null && sale < regular ? Math.round((1 - sale / regular) * 100) : 0;
  return { regular, sale, price, discountPercent };
}

function sortImages(images = []) {
  return [...images].sort((left, right) => {
    if (left.is_thumbnail !== right.is_thumbnail) return left.is_thumbnail ? -1 : 1;
    return toNumber(left.sort_order) - toNumber(right.sort_order);
  });
}

function thumbnailOf(images = []) {
  const sorted = sortImages(images);
  return sorted[0] ?? null;
}

function activeVariants(row) {
  return (row.product_variants ?? []).filter(
    (variant) => variant.is_active !== false && !variant.deleted_at,
  );
}

function categoryEntries(row) {
  return (row.product_categories ?? [])
    .map((entry) => ({ ...entry, category: entry.categories }))
    .filter((entry) => entry.category && !entry.category.deleted_at);
}

function primaryCategory(row) {
  const entries = categoryEntries(row);
  return entries.find((entry) => entry.is_primary)?.category ?? entries[0]?.category ?? null;
}

/**
 * Tồn kho M02 chỉ đọc từ M08. Khi M08 chưa có bản ghi, trạng thái là UNKNOWN
 * thay vì coi là hết hàng (BR-M02-05 chỉ áp dụng khi biết tồn = 0).
 */
async function fetchStockMap(skus) {
  const unique = [...new Set(skus.filter(Boolean))];
  if (unique.length === 0) return new Map();

  try {
    const rows = await checkAvailability(unique);
    return new Map(rows.map((entry) => [entry.sku, entry]));
  } catch (error) {
    console.warn('[m02:catalog] Không đọc được tồn kho M08:', error?.message ?? error);
    return new Map();
  }
}

function collectSkus(rows) {
  return rows.flatMap((row) => (row.product_variants ?? []).map((variant) => variant.sku));
}

function aggregateStock(row, stockMap) {
  let known = false;
  let available = 0;

  for (const variant of activeVariants(row)) {
    const entry = stockMap.get(variant.sku);
    if (!entry) continue;
    known = true;
    available += toNumber(entry.available);
  }

  if (!known) return { status: 'UNKNOWN', available: null };
  if (available <= 0) return { status: 'OUT_OF_STOCK', available: 0 };

  const threshold = toNumber(row.low_stock_threshold ?? LOW_STOCK_THRESHOLD);
  if (available <= threshold) return { status: 'LOW_STOCK', available };
  return { status: 'IN_STOCK', available };
}

function variantStock(variant, stockMap, threshold) {
  const entry = stockMap.get(variant.sku);
  if (!entry) return { status: 'UNKNOWN', available: null };

  const available = toNumber(entry.available);
  if (available <= 0) return { status: 'OUT_OF_STOCK', available: 0 };
  if (available <= toNumber(threshold ?? LOW_STOCK_THRESHOLD)) {
    return { status: 'LOW_STOCK', available };
  }
  return { status: 'IN_STOCK', available };
}

function mapSummary(row, stockMap) {
  const images = row.product_images ?? [];
  const thumbnail = thumbnailOf(images);
  const prices = priceOf(row);
  const category = primaryCategory(row);
  const variants = activeVariants(row);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    short_description: row.short_description ?? null,
    status: row.status,
    age_group: row.age_group,
    gender_target: row.gender_target,
    price_regular: prices.regular,
    price_sale: prices.sale,
    price: prices.price,
    discount_percent: prices.discountPercent,
    thumbnail_url: thumbnail?.url ?? null,
    thumbnail_alt: thumbnail?.alt_text ?? row.name,
    brand: row.brands ?? null,
    category: category
      ? { id: category.id, name: category.name, slug: category.slug }
      : null,
    variants_count: variants.length,
    default_sku: (variants.find((variant) => variant.is_default) ?? variants[0])?.sku ?? null,
    rating_avg: toNumber(row.rating_avg),
    rating_count: toNumber(row.rating_count),
    sold_count: toNumber(row.sold_count),
    is_featured: Boolean(row.is_featured),
    stock: aggregateStock(row, stockMap),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapCategoryRow(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent_id: category.parent_id ?? null,
    description: category.description ?? null,
    icon_url: category.icon_url ?? null,
    image_url: category.image_url ?? null,
    sort_order: toNumber(category.sort_order),
    is_active: Boolean(category.is_active),
  };
}

function mapBrandRow(brand) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo_url: brand.logo_url ?? null,
    description: brand.description ?? null,
    is_active: Boolean(brand.is_active),
  };
}

function buildCategoryTree(rows) {
  const nodes = new Map(rows.map((row) => [row.id, { ...mapCategoryRow(row), children: [] }]));
  const roots = [];

  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortBranch = (branch) => {
    branch.sort(
      (left, right) =>
        left.sort_order - right.sort_order || left.name.localeCompare(right.name, 'vi'),
    );
    branch.forEach((node) => sortBranch(node.children));
  };

  sortBranch(roots);
  return roots;
}

function categoryDepth(rowsById, id) {
  let depth = 0;
  let current = rowsById.get(id);
  while (current) {
    depth += 1;
    current = current.parent_id ? rowsById.get(current.parent_id) : null;
  }
  return depth;
}

function categorySubtreeIds(rows, rootId) {
  const childrenByParent = new Map();
  for (const row of rows) {
    const key = row.parent_id ?? null;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(row.id);
  }

  const ids = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift();
    ids.push(id);
    queue.push(...(childrenByParent.get(id) ?? []));
  }
  return ids;
}

function categoryPath(rowsById, categoryId) {
  const path = [];
  let current = rowsById.get(categoryId);
  while (current) {
    path.unshift({ id: current.id, name: current.name, slug: current.slug });
    current = current.parent_id ? rowsById.get(current.parent_id) : null;
  }
  return path;
}

async function uniqueSlug(base, findBySlug, excludeId = null) {
  const root = slugify(base) || `danh-muc-${Date.now()}`;
  let candidate = root;
  let suffix = 1;

  for (;;) {
    const existing = await findBySlug(candidate);
    if (!existing || (excludeId && existing.id === excludeId)) return candidate;
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
}

async function assertSkuAvailable(sku, allowedVariantIds = new Set()) {
  const existing = await repo.findVariantBySku(sku);
  if (existing && !allowedVariantIds.has(existing.id)) {
    throw duplicate(`SKU ${sku} đã tồn tại (BR-M02-01).`, { field: 'sku', sku });
  }
}

async function loadCategoriesById() {
  const rows = await repo.listCategories({ includeInactive: true });
  return { rows, byId: new Map(rows.map((row) => [row.id, row])) };
}

async function assertActiveCategory(categoryId, categoriesById) {
  const category = categoriesById.get(categoryId);
  if (!category) throw notFound('Không tìm thấy danh mục.');
  if (!category.is_active) {
    throw fail(422, ERROR_CODES.VALIDATION_ERROR, 'Danh mục đã ngừng hoạt động.', {
      field: 'category_id',
      category_id: categoryId,
    });
  }
  return category;
}

async function assertBrand(brandId) {
  if (!brandId) return null;
  const brand = await repo.findBrandById(brandId);
  if (!brand) throw notFound('Không tìm thấy thương hiệu.');
  return brand;
}

function normalizeCategoryIds(primaryId, extraIds = []) {
  return [...new Set([primaryId, ...extraIds])];
}

function normalizeImages(images, productName) {
  if (!Array.isArray(images) || images.length === 0) return [];

  const explicitThumb = images.findIndex((image) => image.is_primary === true);
  const thumbIndex = explicitThumb >= 0 ? explicitThumb : 0;

  return images.map((image, index) => ({
    url: image.url,
    alt_text: image.alt_text?.trim() || `${productName} - ảnh ${index + 1}`,
    sort_order: image.sort_order ?? index + 1,
    is_thumbnail: index === thumbIndex,
  }));
}

function normalizeVariantInputs(variants, productName) {
  const defaultIndex = Math.max(
    0,
    variants.findIndex((variant) => variant.is_default === true),
  );

  return variants.map((variant, index) => ({
    id: variant.id,
    sku: variant.sku,
    name: variant.name?.trim() || (index === defaultIndex ? 'Mặc định' : `${productName} ${index + 1}`),
    attributes: variant.attributes ?? {},
    image_url: variant.image_url ?? null,
    is_default: index === defaultIndex,
    is_active: variant.is_active ?? true,
    sort_order: variant.sort_order ?? index,
  }));
}

function resolveStockThreshold(row) {
  return row.low_stock_threshold ?? LOW_STOCK_THRESHOLD;
}

/* ------------------------------------------------------------------ */
/* Categories — M02-F01, M02-F02                                       */
/* ------------------------------------------------------------------ */

export async function getCategoryTree() {
  const rows = await repo.listCategories({ includeInactive: false });
  return buildCategoryTree(rows);
}

export async function listAdminCategories() {
  const rows = await repo.listCategories({ includeInactive: true });
  return buildCategoryTree(rows);
}

export async function createCategory({ body }) {
  const { rows, byId } = await loadCategoriesById();

  let parent = null;
  if (body.parent_id) {
    parent = byId.get(body.parent_id);
    if (!parent) throw notFound('Không tìm thấy danh mục cha.');
    if (categoryDepth(byId, parent.id) >= 3) {
      throw fail(
        422,
        ERROR_CODES.VALIDATION_ERROR,
        'Cây danh mục tối đa 3 cấp (M02-F02).',
        { field: 'parent_id' },
      );
    }
  }

  const slug = body.slug
    ? body.slug
    : await uniqueSlug(body.name, repo.findCategoryBySlug);

  if (body.slug && (await repo.findCategoryBySlug(body.slug))) {
    throw duplicate('Slug danh mục đã tồn tại.', { field: 'slug', slug: body.slug });
  }

  // Kiểm tra trùng tên trong cùng cấp để tránh menu trùng lặp.
  if (rows.some((row) => row.parent_id === (parent?.id ?? null) && row.name === body.name)) {
    throw duplicate('Danh mục cùng tên đã tồn tại trong cấp này.', { field: 'name' });
  }

  const created = await repo.insertCategory({
    parent_id: parent?.id ?? null,
    name: body.name,
    slug,
    description: body.description ?? null,
    icon_url: body.icon_url ?? null,
    image_url: body.image_url ?? null,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
  });

  return { category_id: created.id, slug: created.slug };
}

export async function updateCategory({ id, body }) {
  const existing = await repo.findCategoryById(id);
  if (!existing) throw notFound('Không tìm thấy danh mục.');

  const { rows, byId } = await loadCategoriesById();
  const patch = pickDefined({
    name: body.name,
    description: body.description,
    icon_url: body.icon_url,
    image_url: body.image_url,
    sort_order: body.sort_order,
    is_active: body.is_active,
    seo_title: body.seo_title,
    seo_description: body.seo_description,
  });

  if (body.parent_id !== undefined) {
    if (body.parent_id === id) {
      throw fail(422, ERROR_CODES.VALIDATION_ERROR, 'Danh mục không thể là cha của chính nó.', {
        field: 'parent_id',
      });
    }

    if (body.parent_id) {
      const parent = byId.get(body.parent_id);
      if (!parent) throw notFound('Không tìm thấy danh mục cha.');
      const descendants = new Set(categorySubtreeIds(rows, id));
      if (descendants.has(parent.id)) {
        throw fail(
          422,
          ERROR_CODES.VALIDATION_ERROR,
          'Không thể chuyển danh mục vào chính cây con của nó.',
          { field: 'parent_id' },
        );
      }
      if (categoryDepth(byId, parent.id) >= 3) {
        throw fail(422, ERROR_CODES.VALIDATION_ERROR, 'Cây danh mục tối đa 3 cấp (M02-F02).', {
          field: 'parent_id',
        });
      }
    }
    patch.parent_id = body.parent_id;
  }

  if (body.slug && body.slug !== existing.slug) {
    if (await repo.findCategoryBySlug(body.slug)) {
      throw duplicate('Slug danh mục đã tồn tại.', { field: 'slug', slug: body.slug });
    }
    patch.slug = body.slug;
  } else if (body.name && body.name !== existing.name) {
    patch.slug = await uniqueSlug(body.name, repo.findCategoryBySlug, id);
  }

  const updated = await repo.updateCategoryRow(id, patch);
  return { category_id: updated.id, slug: updated.slug, updated_at: updated.updated_at };
}

export async function deleteCategory({ id }) {
  const existing = await repo.findCategoryById(id);
  if (!existing) throw notFound('Không tìm thấy danh mục.');

  const childCount = await repo.countCategoryChildren(id);
  if (childCount > 0) {
    throw conflict('Không thể xóa danh mục còn danh mục con (BR-M02-02).', {
      reason: 'has_children',
      children: childCount,
    });
  }

  const productCount = await repo.countProductsInCategory(id);
  if (productCount > 0) {
    throw conflict('Không thể xóa danh mục còn sản phẩm. Hãy chuyển sản phẩm trước (BR-M02-02).', {
      reason: 'has_products',
      products: productCount,
    });
  }

  await repo.softDeleteCategoryRow(id);
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Brands — M02-F03                                                    */
/* ------------------------------------------------------------------ */

export async function listBrands() {
  const rows = await repo.listBrands({ includeInactive: false });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url ?? null,
  }));
}

export async function listAdminBrands() {
  const rows = await repo.listBrands({ includeInactive: true });
  return rows.map(mapBrandRow);
}

export async function createBrand({ body }) {
  const slug = body.slug
    ? body.slug
    : await uniqueSlug(body.name, repo.findBrandBySlug);

  if (body.slug && (await repo.findBrandBySlug(body.slug))) {
    throw duplicate('Slug thương hiệu đã tồn tại.', { field: 'slug', slug: body.slug });
  }

  const created = await repo.insertBrand({
    name: body.name,
    slug,
    logo_url: body.logo_url ?? null,
    description: body.description ?? null,
    is_active: body.is_active ?? true,
  });

  return { brand_id: created.id, slug: created.slug };
}

export async function updateBrand({ id, body }) {
  const existing = await repo.findBrandById(id);
  if (!existing) throw notFound('Không tìm thấy thương hiệu.');

  const patch = pickDefined({
    name: body.name,
    logo_url: body.logo_url,
    description: body.description,
    is_active: body.is_active,
  });

  if (body.slug && body.slug !== existing.slug) {
    if (await repo.findBrandBySlug(body.slug)) {
      throw duplicate('Slug thương hiệu đã tồn tại.', { field: 'slug', slug: body.slug });
    }
    patch.slug = body.slug;
  } else if (body.name && body.name !== existing.name) {
    patch.slug = await uniqueSlug(body.name, repo.findBrandBySlug, id);
  }

  const updated = await repo.updateBrandRow(id, patch);
  return { brand_id: updated.id, slug: updated.slug, updated_at: updated.updated_at };
}

export async function deleteBrand({ id }) {
  const existing = await repo.findBrandById(id);
  if (!existing) throw notFound('Không tìm thấy thương hiệu.');

  const productCount = await repo.countProductsByBrand(id);
  if (productCount > 0) {
    throw conflict('Không thể xóa thương hiệu còn sản phẩm (M02-F03).', {
      reason: 'has_products',
      products: productCount,
    });
  }

  await repo.softDeleteBrandRow(id);
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Product catalog — M02-F10, M02-F11                                  */
/* ------------------------------------------------------------------ */

async function resolveCategoryFilter(categorySlug, { onlyActive }) {
  const { rows, byId } = await loadCategoriesById();
  const root = rows.find((row) => row.slug === categorySlug);
  if (!root) return { ids: [], rows, byId };
  if (onlyActive && !root.is_active) return { ids: [], rows, byId };

  const ids = categorySubtreeIds(rows, root.id);
  const idsActive = onlyActive
    ? ids.filter((id) => byId.get(id)?.is_active)
    : ids;
  return { ids: idsActive, rows, byId };
}

function emptyPage(page, limit) {
  return { total: 0, page, limit, total_pages: 0, items: [] };
}

export async function listProducts({ query }) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;

  const { rows: categories } = await loadCategoriesById();
  const activeCategoryIds = categories.filter((row) => row.is_active).map((row) => row.id);
  if (activeCategoryIds.length === 0) return emptyPage(page, limit);

  let categoryIds = activeCategoryIds;
  if (query.category_slug) {
    const resolved = await resolveCategoryFilter(query.category_slug, { onlyActive: true });
    if (resolved.ids.length === 0) return emptyPage(page, limit);
    categoryIds = resolved.ids;
  }

  let brandId;
  if (query.brand_slug) {
    const brand = await repo.findBrandBySlug(query.brand_slug);
    if (!brand || !brand.is_active) return emptyPage(page, limit);
    brandId = brand.id;
  }

  const { rows, total } = await repo.listProductRows({
    page,
    limit,
    onlyActive: true,
    categoryIds,
    brandId,
    keyword: query.keyword,
    sort: query.sort,
  });

  const stockMap = await fetchStockMap(collectSkus(rows));
  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    items: rows.map((row) => mapSummary(row, stockMap)),
  };
}

/**
 * M03 read-only contract — trả toàn bộ sản phẩm ACTIVE kèm dữ liệu tìm kiếm.
 * Chỉ đọc; M03 không ghi ngược vào bảng sản phẩm.
 */
export async function getSearchCatalog() {
  const rows = await repo.listSearchCatalogRows();
  const stockMap = await fetchStockMap(collectSkus(rows));

  return rows.map((row) => {
    const categories = categoryEntries(row)
      .filter((entry) => entry.category.is_active)
      .map((entry) => ({
        id: entry.category.id,
        name: entry.category.name,
        slug: entry.category.slug,
      }));

    return {
      ...mapSummary(row, stockMap),
      description: row.description ?? null,
      categories,
      category_ids: categories.map((category) => category.id),
      sku_list: activeVariants(row).map((variant) => variant.sku),
    };
  });
}

export async function listAdminProducts({ query }) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  let categoryIds;
  if (query.category_slug) {
    const resolved = await resolveCategoryFilter(query.category_slug, { onlyActive: false });
    if (resolved.ids.length === 0) return emptyPage(page, limit);
    categoryIds = resolved.ids;
  }

  const { rows, total } = await repo.listProductRows({
    page,
    limit,
    status: query.status,
    categoryIds,
    keyword: query.keyword,
    sort: query.sort,
  });

  const stockMap = await fetchStockMap(collectSkus(rows));
  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    items: rows.map((row) => mapSummary(row, stockMap)),
  };
}

async function buildCategoryPathFor(categoryId) {
  const { byId } = await loadCategoriesById();
  return categoryPath(byId, categoryId);
}

async function buildProductDetail(row, { admin = false } = {}) {
  const stockMap = await fetchStockMap(collectSkus([row]));
  const prices = priceOf(row);
  const images = sortImages(row.product_images ?? []).map((image) => ({
    id: image.id,
    url: image.url,
    alt_text: image.alt_text ?? row.name,
    is_thumbnail: Boolean(image.is_thumbnail),
    sort_order: toNumber(image.sort_order),
  }));

  const variants = (row.product_variants ?? [])
    .filter((variant) => !variant.deleted_at && (admin || variant.is_active !== false))
    .map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes ?? {},
      image_url: variant.image_url ?? null,
      is_default: Boolean(variant.is_default),
      is_active: variant.is_active !== false,
      stock: variantStock(variant, stockMap, resolveStockThreshold(row)),
    }));

  const categories = categoryEntries(row).map((entry) => ({
    ...mapCategoryRow(entry.category),
    is_primary: Boolean(entry.is_primary),
  }));
  const primary = primaryCategory(row);
  const path = primary ? await buildCategoryPathFor(primary.id) : [];

  const productDetails = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    short_description: row.short_description ?? null,
    description: row.description ?? null,
    status: row.status,
    age_group: row.age_group,
    gender_target: row.gender_target,
    material: row.material ?? null,
    origin_country: row.origin_country ?? null,
    safety_info: row.safety_info ?? null,
    price_regular: prices.regular,
    price_sale: prices.sale,
    price: prices.price,
    discount_percent: prices.discountPercent,
    low_stock_threshold: resolveStockThreshold(row),
    is_featured: Boolean(row.is_featured),
    sold_count: toNumber(row.sold_count),
    rating_avg: toNumber(row.rating_avg),
    rating_count: toNumber(row.rating_count),
    meta_title: row.meta_title ?? null,
    meta_description: row.meta_description ?? null,
    brand: row.brands ? mapBrandRow(row.brands) : null,
    categories,
    primary_category: primary ? mapCategoryRow(primary) : null,
    category_path: path,
    stock: aggregateStock(row, stockMap),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return {
    product_details: productDetails,
    images,
    variants,
    brand: row.brands ? mapBrandRow(row.brands) : null,
    categories,
    specs: {
      material: row.material ?? null,
      origin_country: row.origin_country ?? null,
      age_group: row.age_group,
      gender_target: row.gender_target,
      safety_info: row.safety_info ?? null,
    },
  };
}

export async function getProductDetail({ idOrSlug }) {
  const row = await repo.findProductByIdOrSlug(idOrSlug, { onlyActive: true });
  if (!row) throw notFound('Không tìm thấy sản phẩm.');

  const primary = primaryCategory(row);
  if (!primary || primary.deleted_at || !primary.is_active) {
    throw notFound('Không tìm thấy sản phẩm.');
  }

  const detail = await buildProductDetail(row);
  const relatedRows = await repo.listRelatedProductRows({
    categoryId: primary.id,
    excludeId: row.id,
    limit: RELATED_PRODUCTS_LIMIT,
  });
  const relatedStock = await fetchStockMap(collectSkus(relatedRows));

  return {
    ...detail,
    related_products: relatedRows.map((item) => mapSummary(item, relatedStock)),
  };
}

export async function getAdminProductDetail({ id }) {
  const row = await repo.findProductById(id);
  if (!row) throw notFound('Không tìm thấy sản phẩm.');
  return buildProductDetail(row, { admin: true });
}

/* ------------------------------------------------------------------ */
/* Product mutations — M02-F04..F08                                    */
/* ------------------------------------------------------------------ */

function createProductRow(body) {
  return {
    name: body.name,
    short_description: body.short_description ?? null,
    description: body.description ?? null,
    brand_id: body.brand_id ?? null,
    status: body.status ?? 'DRAFT',
    age_group: body.age_group,
    gender_target: body.gender_target ?? 'UNISEX',
    material: body.material ?? null,
    origin_country: body.origin_country ?? null,
    safety_info: body.safety_info ?? null,
    price_regular: body.price_regular,
    price_sale: body.price_sale ?? null,
    low_stock_threshold: body.low_stock_threshold ?? LOW_STOCK_THRESHOLD,
    is_featured: body.is_featured ?? false,
    meta_title: body.meta_title ?? null,
    meta_description: body.meta_description ?? null,
  };
}

function updateProductPatch(body) {
  return pickDefined({
    name: body.name,
    short_description: body.short_description,
    description: body.description,
    brand_id: body.brand_id,
    status: body.status,
    age_group: body.age_group,
    gender_target: body.gender_target,
    material: body.material,
    origin_country: body.origin_country,
    safety_info: body.safety_info,
    price_regular: body.price_regular,
    price_sale: body.price_sale,
    low_stock_threshold: body.low_stock_threshold,
    is_featured: body.is_featured,
    meta_title: body.meta_title,
    meta_description: body.meta_description,
  });
}

async function validateCategorySelection(primaryId, extraIds = []) {
  const categoryIds = normalizeCategoryIds(primaryId, extraIds);
  if (categoryIds.length > 5) {
    throw fail(422, ERROR_CODES.VALIDATION_ERROR, 'Mỗi sản phẩm tối đa 5 danh mục.', {
      field: 'category_ids',
    });
  }

  const { byId } = await loadCategoriesById();
  for (const id of categoryIds) {
    await assertActiveCategory(id, byId);
  }
  return categoryIds;
}

async function categoryLinkRows(productId, categoryIds, primaryId) {
  return categoryIds.map((categoryId) => ({
    product_id: productId,
    category_id: categoryId,
    is_primary: categoryId === primaryId,
  }));
}

async function syncVariantSku(productId, sku, allowedVariantIds) {
  const variants = await repo.listVariantsByProduct(productId, { includeDeleted: true });
  if (variants.length === 0) {
    await assertSkuAvailable(sku, allowedVariantIds);
    return repo.insertVariantRow({
      product_id: productId,
      sku,
      name: 'Mặc định',
      attributes: {},
      is_default: true,
      is_active: true,
      sort_order: 0,
    });
  }

  const target =
    variants.find((variant) => variant.is_default && !variant.deleted_at) ??
    variants.find((variant) => !variant.deleted_at) ??
    variants[0];

  if (target.sku === sku) return target;

  const duplicateSku = await repo.findVariantBySku(sku);
  if (duplicateSku && !allowedVariantIds.has(duplicateSku.id)) {
    throw duplicate(`SKU ${sku} đã tồn tại (BR-M02-01).`, { field: 'sku', sku });
  }

  return repo.updateVariantRow(target.id, {
    sku,
    deleted_at: null,
    is_active: true,
    is_default: true,
  });
}

async function syncVariants(productId, inputs, productName) {
  const normalized = normalizeVariantInputs(inputs, productName);
  const skuSet = new Set();
  for (const variant of normalized) {
    if (skuSet.has(variant.sku)) {
      throw duplicate(`SKU ${variant.sku} xuất hiện nhiều lần trong biến thể.`, {
        field: 'variants',
        sku: variant.sku,
      });
    }
    skuSet.add(variant.sku);
  }

  const existing = await repo.listVariantsByProduct(productId, { includeDeleted: true });
  const existingById = new Map(existing.map((variant) => [variant.id, variant]));
  const existingBySku = new Map(existing.map((variant) => [variant.sku, variant]));
  const keepIds = [];

  for (const input of normalized) {
    let target = input.id ? existingById.get(input.id) : existingBySku.get(input.sku);

    if (input.id && !target) {
      throw notFound('Không tìm thấy biến thể cần cập nhật.');
    }
    if (target && target.product_id !== productId) {
      throw conflict('Biến thể thuộc sản phẩm khác.');
    }
    if (!target) {
      const occupied = await repo.findVariantBySku(input.sku);
      if (occupied) {
        throw duplicate(`SKU ${input.sku} đã tồn tại (BR-M02-01).`, {
          field: 'sku',
          sku: input.sku,
        });
      }
    } else if (target.sku !== input.sku) {
      const duplicateSku = await repo.findVariantBySku(input.sku);
      if (duplicateSku && duplicateSku.id !== target.id) {
        throw duplicate(`SKU ${input.sku} đã tồn tại (BR-M02-01).`, {
          field: 'sku',
          sku: input.sku,
        });
      }
    }

    const patch = {
      sku: input.sku,
      name: input.name,
      attributes: input.attributes,
      image_url: input.image_url,
      is_default: input.is_default,
      is_active: input.is_active,
      sort_order: input.sort_order,
      deleted_at: null,
    };

    if (target) {
      const updated = await repo.updateVariantRow(target.id, patch);
      keepIds.push(updated.id);
    } else {
      const inserted = await repo.insertVariantRow({ product_id: productId, ...patch });
      keepIds.push(inserted.id);
    }
  }

  await repo.softDeleteVariantsExcept(productId, keepIds);
  return keepIds;
}

export async function createProduct({ body }) {
  const categoryIds = await validateCategorySelection(body.category_id, body.category_ids);
  if (body.brand_id) await assertBrand(body.brand_id);

  const variantInputs =
    body.variants && body.variants.length > 0
      ? body.variants
      : [{ sku: body.sku, name: 'Mặc định', is_default: true, is_active: true }];

  if (!variantInputs.some((variant) => variant.sku === body.sku)) {
    throw fail(
      422,
      ERROR_CODES.VALIDATION_ERROR,
      'SKU sản phẩm phải trùng SKU của một biến thể.',
      { field: 'sku' },
    );
  }

  const skuList = new Set();
  for (const variant of variantInputs) {
    if (skuList.has(variant.sku)) {
      throw duplicate(`SKU ${variant.sku} xuất hiện nhiều lần.`, { field: 'variants' });
    }
    skuList.add(variant.sku);
    await assertSkuAvailable(variant.sku);
  }

  const slug = await uniqueSlug(body.name, repo.findProductBySlug);
  const product = await repo.insertProductRow({ ...createProductRow(body), slug });

  try {
    await repo.replaceProductCategories(
      product.id,
      await categoryLinkRows(product.id, categoryIds, body.category_id),
    );

    await syncVariants(product.id, variantInputs, body.name);

    if (body.images && body.images.length > 0) {
      await repo.replaceProductImages(
        product.id,
        normalizeImages(body.images, body.name).map((image) => ({
          ...image,
          product_id: product.id,
        })),
      );
    }
  } catch (error) {
    try {
      await repo.hardDeleteProductRow(product.id);
    } catch (cleanupError) {
      console.error('[m02:catalog] Không dọn được sản phẩm tạo lỗi:', cleanupError);
    }
    throw error;
  }

  return { product_id: product.id, slug: product.slug, sku: body.sku, status: product.status };
}

export async function updateProduct({ id, body }) {
  const existing = await repo.findProductById(id);
  if (!existing) throw notFound('Không tìm thấy sản phẩm.');

  const nextRegular =
    body.price_regular !== undefined ? body.price_regular : toNumber(existing.price_regular);
  const nextSale =
    body.price_sale !== undefined
      ? body.price_sale
      : existing.price_sale == null
        ? null
        : toNumber(existing.price_sale);

  if (nextSale != null && nextSale > nextRegular) {
    throw fail(
      422,
      ERROR_CODES.VALIDATION_ERROR,
      'Giá sale không được lớn hơn giá niêm yết (BR-M02-03).',
      { field: 'price_sale' },
    );
  }

  let categoryIds;
  let primaryId;
  if (body.category_id !== undefined || body.category_ids !== undefined) {
    const existingEntries = categoryEntries(existing);
    const existingPrimary =
      existingEntries.find((entry) => entry.is_primary)?.category.id ??
      existingEntries[0]?.category.id;
    primaryId = body.category_id ?? existingPrimary;
    if (!primaryId) {
      throw fail(422, ERROR_CODES.VALIDATION_ERROR, 'Vui lòng chọn danh mục chính.', {
        field: 'category_id',
      });
    }
    const extraIds =
      body.category_ids !== undefined
        ? body.category_ids
        : existingEntries
            .map((entry) => entry.category.id)
            .filter((categoryId) => categoryId !== existingPrimary);
    categoryIds = await validateCategorySelection(primaryId, extraIds);
  }

  if (body.brand_id !== undefined) await assertBrand(body.brand_id);

  const patch = updateProductPatch(body);
  if (body.price_regular !== undefined) patch.price_regular = nextRegular;
  if (body.price_sale !== undefined) patch.price_sale = nextSale;

  if (
    Object.keys(patch).length === 0 &&
    !categoryIds &&
    body.images === undefined &&
    body.variants === undefined &&
    body.sku === undefined
  ) {
    throw fail(422, ERROR_CODES.VALIDATION_ERROR, 'Cần ít nhất một trường cập nhật.');
  }

  const updated = await repo.updateProductRow(id, patch);
  if (!updated) throw notFound('Không tìm thấy sản phẩm.');

  if (categoryIds) {
    await repo.replaceProductCategories(
      id,
      await categoryLinkRows(id, categoryIds, primaryId),
    );
  }

  if (body.variants) {
    const hasSku = body.variants.some((variant) => variant.sku === body.sku);
    if (!hasSku) {
      throw fail(
        422,
        ERROR_CODES.VALIDATION_ERROR,
        'SKU sản phẩm phải trùng SKU của một biến thể.',
        { field: 'sku' },
      );
    }
    await syncVariants(id, body.variants, body.name ?? existing.name);
  } else if (body.sku) {
    const allowed = new Set(
      (await repo.listVariantsByProduct(id, { includeDeleted: true })).map((variant) => variant.id),
    );
    await syncVariantSku(id, body.sku, allowed);
  }

  if (body.images !== undefined) {
    await repo.replaceProductImages(
      id,
      normalizeImages(body.images, body.name ?? existing.name).map((image) => ({
        ...image,
        product_id: id,
      })),
    );
  }

  return { product_id: id, slug: updated.slug, status: updated.status, updated_at: updated.updated_at };
}

export async function softDeleteProduct({ id }) {
  const existing = await repo.findProductById(id);
  if (!existing) throw notFound('Không tìm thấy sản phẩm.');
  await repo.softDeleteProductRow(id);
  return { success: true, message: 'Đã xóa mềm sản phẩm.' };
}

export async function changeProductStatus({ id, status }) {
  const existing = await repo.findProductById(id);
  if (!existing) throw notFound('Không tìm thấy sản phẩm.');
  const updated = await repo.updateProductRow(id, { status });
  return { product_id: id, status: updated.status, updated_at: updated.updated_at };
}

export async function updateProductPricing({ id, price_regular, price_sale }) {
  const existing = await repo.findProductById(id);
  if (!existing) throw notFound('Không tìm thấy sản phẩm.');

  const regular = price_regular ?? toNumber(existing.price_regular);
  const sale = price_sale !== undefined ? price_sale : existing.price_sale;

  if (sale != null && Number(sale) > Number(regular)) {
    throw fail(
      422,
      ERROR_CODES.VALIDATION_ERROR,
      'Giá sale không được lớn hơn giá niêm yết (BR-M02-03).',
      { field: 'price_sale' },
    );
  }

  const updated = await repo.updateProductRow(id, {
    price_regular: regular,
    price_sale: sale == null ? null : Number(sale),
  });
  return { product_id: id, updated_at: updated.updated_at };
}

/* ------------------------------------------------------------------ */
/* Images — M02-F07                                                    */
/* ------------------------------------------------------------------ */

export async function attachProductImage({ productId, image }) {
  const product = await repo.findProductById(productId);
  if (!product) throw notFound('Không tìm thấy sản phẩm.');

  const images = await repo.listImagesByProduct(productId);
  if (images.length >= 10) {
    throw conflict('Mỗi sản phẩm tối đa 10 ảnh (M02-F07).', { reason: 'image_limit' });
  }

  const inserted = await repo.insertProductImageRow({
    product_id: productId,
    url: image.url,
    alt_text: image.alt_text?.trim() || `${product.name} - ảnh ${images.length + 1}`,
    sort_order: image.sort_order ?? images.length + 1,
    is_thumbnail: images.length === 0,
  });

  return { image_id: inserted.id };
}

export async function removeProductImage({ productId, imageId }) {
  const product = await repo.findProductById(productId);
  if (!product) throw notFound('Không tìm thấy sản phẩm.');

  const images = await repo.listImagesByProduct(productId);
  const target = images.find((image) => image.id === imageId);
  if (!target) throw notFound('Không tìm thấy ảnh sản phẩm.');

  await repo.deleteProductImageRow(imageId);

  if (target.is_thumbnail) {
    const remaining = await repo.listImagesByProduct(productId);
    if (remaining.length > 0) {
      await repo.updateProductImageRow(remaining[0].id, { is_thumbnail: true });
    }
  }

  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Stock & internal sync — M02-F09, M02-F12, M02-F13                   */
/* ------------------------------------------------------------------ */

export async function readStockSummary({ productId }) {
  const product = await repo.findProductById(productId);
  if (!product) throw notFound('Không tìm thấy sản phẩm.');

  const variants = activeVariants(product);
  const stockMap = await fetchStockMap(variants.map((variant) => variant.sku));

  return {
    product_id: productId,
    stock: aggregateStock(product, stockMap),
    variants: variants.map((variant) => ({
      variant_id: variant.id,
      sku: variant.sku,
      name: variant.name,
      ...variantStock(variant, stockMap, resolveStockThreshold(product)),
    })),
  };
}

export async function getCatalogDelta({ since_timestamp: sinceTimestamp } = {}) {
  const sinceIso = sinceTimestamp ? new Date(sinceTimestamp * 1000).toISOString() : null;
  const rows = await repo.listCatalogDeltaRows(sinceIso);

  const skus = rows.flatMap((row) =>
    (row.product_variants ?? []).map((variant) => variant.sku),
  );
  const stockMap = await fetchStockMap(skus);

  const items = [];
  for (const row of rows) {
    const prices = priceOf(row);
    const variants = row.product_variants ?? [];
    const status = row.deleted_at ? 'DELETED' : row.status;

    if (variants.length === 0) {
      items.push({
        product_id: row.id,
        variant_id: null,
        sku: null,
        name: row.name,
        slug: row.slug,
        price: prices.price,
        price_regular: prices.regular,
        price_sale: prices.sale,
        stock: null,
        status,
        updated_at: row.updated_at,
      });
      continue;
    }

    for (const variant of variants) {
      const stock = stockMap.get(variant.sku);
      items.push({
        product_id: row.id,
        variant_id: variant.id,
        sku: variant.sku,
        name:
          variant.name && variant.name !== 'Mặc định'
            ? `${row.name} - ${variant.name}`
            : row.name,
        slug: row.slug,
        price: prices.price,
        price_regular: prices.regular,
        price_sale: prices.sale,
        stock: stock ? toNumber(stock.available) : null,
        status: variant.deleted_at || variant.is_active === false ? 'INACTIVE' : status,
        updated_at: row.updated_at,
      });
    }
  }

  return items;
}

export async function listLowStockProducts({ threshold = LOW_STOCK_THRESHOLD } = {}) {
  const rows = await repo.listProductsWithVariants({ onlyActive: true });
  const skus = rows.flatMap((row) =>
    (row.product_variants ?? [])
      .filter((variant) => variant.is_active !== false && !variant.deleted_at)
      .map((variant) => variant.sku),
  );
  const stockMap = await fetchStockMap(skus);

  const result = [];
  for (const row of rows) {
    const variants = (row.product_variants ?? []).filter(
      (variant) => variant.is_active !== false && !variant.deleted_at,
    );
    const withStock = variants.filter((variant) => stockMap.has(variant.sku));
    if (withStock.length === 0) continue;

    const available = withStock.reduce(
      (total, variant) => total + toNumber(stockMap.get(variant.sku).available),
      0,
    );
    const limit = toNumber(row.low_stock_threshold ?? threshold);

    if (available <= limit) {
      result.push({
        product_id: row.id,
        name: row.name,
        slug: row.slug,
        threshold: limit,
        available,
        skus: variants.map((variant) => variant.sku),
      });
    }
  }

  return result;
}
