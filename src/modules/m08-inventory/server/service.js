import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { parsePagination } from '@/server/http/pagination.js';
import {
  RESERVATION_TTL_MINUTES,
  STOCKTAKE_ADMIN_APPROVAL_QUANTITY,
  STOCKTAKE_ADMIN_APPROVAL_VALUE_VND,
} from './constants.js';
import * as repo from './repository.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fail(status, code, message, details) {
  return new AppError(code, message, { status, details });
}

function notFound(message = 'Không tìm thấy dữ liệu.') {
  return fail(404, ERROR_CODES.NOT_FOUND, message);
}

function conflict(message, details) {
  return fail(409, ERROR_CODES.CONFLICT, message, details);
}

function invalid(message, details) {
  return fail(422, ERROR_CODES.VALIDATION_ERROR, message, details);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSku(sku) {
  return String(sku ?? '')
    .trim()
    .toUpperCase();
}

function uniqueSkus(items) {
  return [...new Set(items.map((item) => normalizeSku(item.sku)).filter(Boolean))];
}

function aggregateItems(items) {
  const totals = new Map();
  for (const item of items) {
    const sku = normalizeSku(item.sku);
    totals.set(sku, (totals.get(sku) ?? 0) + toNumber(item.quantity));
  }
  return [...totals.entries()].map(([sku, quantity]) => ({ sku, quantity }));
}

function mapWarehouse(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address ?? null,
    phone: row.phone ?? null,
    is_default: Boolean(row.is_default),
    is_active: row.is_active !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapSupplier(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    contact_name: row.contact_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    tax_code: row.tax_code ?? null,
    is_active: row.is_active !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapStockLevel(row) {
  return {
    stock_id: row.stock_id,
    variant_id: row.variant_id,
    sku: row.sku,
    variant_name: row.variant_name,
    product_id: row.product_id,
    product_name: row.product_name,
    product_status: row.product_status,
    warehouse_id: row.warehouse_id,
    warehouse_name: row.warehouse_name,
    on_hand: toNumber(row.on_hand),
    reserved: toNumber(row.reserved),
    available: toNumber(row.available),
    low_stock_threshold: toNumber(row.low_stock_threshold),
    price_regular: toNumber(row.price_regular),
    status: row.status,
    updated_at: row.updated_at,
  };
}

function mapReceipt(row) {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    note: row.note ?? null,
    total_amount: toNumber(row.total_amount),
    received_at: row.received_at,
    created_at: row.created_at,
    supplier_name: row.supplier?.name ?? null,
    warehouse_name: row.warehouse?.name ?? null,
    created_by_name: row.creator?.full_name ?? null,
  };
}

function mapAdjustment(row) {
  return {
    id: row.id,
    code: row.code,
    reason: row.reason,
    status: row.status,
    requires_admin_approval: Boolean(row.requires_admin_approval),
    created_at: row.created_at,
    approved_by_name: row.approver?.full_name ?? null,
    warehouse_name: row.warehouse?.name ?? null,
    created_by_name: row.creator?.full_name ?? null,
    item_count: toNumber(row.stock_adjustment_items?.[0]?.count),
  };
}

function mapTransfer(row) {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    note: row.note ?? null,
    shipped_at: row.shipped_at,
    received_at: row.received_at,
    created_at: row.created_at,
    from_warehouse_name: row.from_warehouse?.name ?? null,
    to_warehouse_name: row.to_warehouse?.name ?? null,
    item_count: toNumber(row.stock_transfer_items?.[0]?.count),
  };
}

function mapMovement(row) {
  return {
    id: row.id,
    movement_type: row.movement_type,
    quantity: toNumber(row.quantity),
    on_hand_after: toNumber(row.on_hand_after),
    reserved_after: toNumber(row.reserved_after),
    reference_type: row.reference_type ?? null,
    reference_id: row.reference_id ?? null,
    note: row.note ?? null,
    actor_name: row.actor_name ?? null,
    created_at: row.created_at,
  };
}

/**
 * Nạp variant theo SKU. Hàng nhập/kiểm kê/chuyển kho cho phép variant ngừng bán
 * (vẫn còn tồn); giữ chỗ cho đơn mới yêu cầu variant đang hoạt động.
 */
async function loadVariantMap(skus, { requireActive = false } = {}) {
  const rows = await repo.findVariantsBySkus(skus);
  const map = new Map();
  for (const row of rows) {
    if (row.deleted_at) continue;
    map.set(normalizeSku(row.sku), row);
  }

  const missing = skus.filter((sku) => !map.has(sku));
  if (missing.length > 0) {
    throw invalid(`Không tìm thấy SKU: ${missing.join(', ')}.`, { missing_skus: missing });
  }

  if (requireActive) {
    const inactive = skus.filter((sku) => {
      const variant = map.get(sku);
      return (
        !variant?.is_active || variant.products?.deleted_at || variant.products?.status !== 'ACTIVE'
      );
    });
    if (inactive.length > 0) {
      throw invalid(`SKU đã ngừng bán: ${inactive.join(', ')}.`, { inactive_skus: inactive });
    }
  }

  return map;
}

async function assertActiveWarehouse(warehouseId, label = 'Kho') {
  const warehouse = await repo.findWarehouseById(warehouseId);
  if (!warehouse) throw notFound(`${label} không tồn tại.`);
  if (warehouse.is_active === false) throw conflict(`${label} đã ngừng hoạt động.`);
  return warehouse;
}

/* ------------------------------------------------------------------ */
/* M08-F01 — Quản lý kho                                               */
/* ------------------------------------------------------------------ */

export async function listWarehouses({ include_inactive } = {}) {
  const rows = await repo.listWarehouses({ includeInactive: Boolean(include_inactive) });
  return rows.map(mapWarehouse);
}

export async function createWarehouse(payload) {
  const code = normalizeSku(payload.code);
  const existing = await repo.findWarehouseByCode(code);
  if (existing) {
    throw fail(409, ERROR_CODES.DUPLICATE_RESOURCE, 'Mã kho đã tồn tại.', {
      field: 'code',
      code,
    });
  }

  const row = await repo.saveWarehouse({
    code,
    name: payload.name,
    address: payload.address,
    phone: payload.phone,
    isDefault: Boolean(payload.is_default),
    isActive: payload.is_active !== false,
  });
  return mapWarehouse(row);
}

export async function updateWarehouse({ id, patch }) {
  const current = await repo.findWarehouseById(id);
  if (!current) throw notFound('Không tìm thấy kho.');

  const code = normalizeSku(patch.code ?? current.code);
  if (code !== current.code) {
    const duplicate = await repo.findWarehouseByCode(code, id);
    if (duplicate) {
      throw fail(409, ERROR_CODES.DUPLICATE_RESOURCE, 'Mã kho đã tồn tại.', {
        field: 'code',
        code,
      });
    }
  }

  const isDefault = patch.is_default ?? current.is_default;
  const isActive = patch.is_active ?? current.is_active;

  if (current.is_default && !isDefault) {
    throw conflict('Phải có một kho mặc định đang hoạt động.');
  }
  if (current.is_default && !isActive) {
    throw conflict('Không thể vô hiệu hóa kho mặc định. Hãy đặt kho khác làm mặc định trước.');
  }

  const row = await repo.saveWarehouse({
    id,
    code,
    name: patch.name ?? current.name,
    address: patch.address ?? current.address,
    phone: patch.phone ?? current.phone,
    isDefault,
    isActive,
  });
  return mapWarehouse(row);
}

/* ------------------------------------------------------------------ */
/* M08-F12 — Nhà cung cấp                                              */
/* ------------------------------------------------------------------ */

export async function listSuppliers({ keyword, include_inactive } = {}) {
  const rows = await repo.listSuppliers({
    keyword: keyword ?? '',
    includeInactive: Boolean(include_inactive),
  });
  return rows.map(mapSupplier);
}

export async function createSupplier(payload) {
  const code = normalizeSku(payload.code);
  const existing = await repo.findSupplierByCode(code);
  if (existing) {
    throw fail(409, ERROR_CODES.DUPLICATE_RESOURCE, 'Mã nhà cung cấp đã tồn tại.', {
      field: 'code',
      code,
    });
  }

  const row = await repo.insertSupplier({
    code,
    name: payload.name,
    contact_name: payload.contact_name ?? null,
    phone: payload.phone ?? null,
    email: payload.email ? payload.email.toLowerCase() : null,
    address: payload.address ?? null,
    tax_code: payload.tax_code ?? null,
    is_active: payload.is_active !== false,
  });
  return mapSupplier(row);
}

export async function updateSupplier({ id, patch }) {
  const current = await repo.findSupplierById(id);
  if (!current) throw notFound('Không tìm thấy nhà cung cấp.');

  const code = normalizeSku(patch.code ?? current.code);
  if (code !== current.code) {
    const duplicate = await repo.findSupplierByCode(code, id);
    if (duplicate) {
      throw fail(409, ERROR_CODES.DUPLICATE_RESOURCE, 'Mã nhà cung cấp đã tồn tại.', {
        field: 'code',
        code,
      });
    }
  }

  const row = await repo.updateSupplierRow(id, {
    code,
    name: patch.name ?? current.name,
    contact_name: patch.contact_name ?? current.contact_name,
    phone: patch.phone ?? current.phone,
    email:
      patch.email === undefined ? current.email : patch.email ? patch.email.toLowerCase() : null,
    address: patch.address ?? current.address,
    tax_code: patch.tax_code ?? current.tax_code,
    is_active: patch.is_active ?? current.is_active,
    updated_at: new Date().toISOString(),
  });
  return mapSupplier(row);
}

/* ------------------------------------------------------------------ */
/* M08-F03/F11 — Tồn kho và cảnh báo                                   */
/* ------------------------------------------------------------------ */

export async function listInventoryStock({ keyword, warehouse_id, low_stock_only, page, limit }) {
  const pagination = parsePagination({ page, limit });
  const result = await repo.listStockLevels({
    keyword,
    warehouseId: warehouse_id,
    lowStockOnly: Boolean(low_stock_only),
    page: pagination.page,
    limit: pagination.limit,
  });

  return {
    total: toNumber(result?.total),
    page: toNumber(result?.page) || pagination.page,
    limit: toNumber(result?.limit) || pagination.limit,
    total_pages: toNumber(result?.total_pages),
    items: (result?.items ?? []).map(mapStockLevel),
  };
}

export async function listLowStock({ limit = 10 } = {}) {
  const result = await repo.listStockLevels({
    lowStockOnly: true,
    page: 1,
    limit: Math.min(Math.max(toNumber(limit) || 10, 1), 100),
  });
  return {
    total: toNumber(result?.total),
    items: (result?.items ?? []).map(mapStockLevel),
  };
}

export async function getInventorySummary() {
  const result = (await repo.getInventorySummary()) ?? {};
  return {
    total_skus: toNumber(result.total_skus),
    on_hand: toNumber(result.on_hand),
    reserved: toNumber(result.reserved),
    available: toNumber(result.available),
    low_stock_count: toNumber(result.low_stock_count),
    out_of_stock_count: toNumber(result.out_of_stock_count),
    warehouse_count: toNumber(result.warehouse_count),
  };
}

/** Cron M08-F11 — quét tồn thấp, ghi cảnh báo IN_APP cho back-office. */
export async function scanLowStock() {
  const summary = await repo.getInventorySummary();
  const lowStockCount = toNumber(summary?.low_stock_count);
  const outOfStockCount = toNumber(summary?.out_of_stock_count);
  const lowStock = await repo.listStockLevels({
    lowStockOnly: true,
    page: 1,
    limit: 100,
  });

  let notificationId = null;
  if (lowStockCount + outOfStockCount > 0) {
    try {
      const notification = await repo.insertLowStockNotification({
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        skus: (lowStock?.items ?? []).slice(0, 20).map((item) => item.sku),
        scanned_at: new Date().toISOString(),
      });
      notificationId = notification?.id ?? null;
    } catch (error) {
      console.warn('[m08:inventory] Không ghi được cảnh báo tồn thấp:', error?.message ?? error);
    }
  }

  return {
    job: 'low-stock-scan',
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStockCount,
    notification_id: notificationId,
    scanned_at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* M08-F04/F05/F06/F07 — Tồn khả dụng và giữ/xuất/nhả tồn             */
/* ------------------------------------------------------------------ */

export async function checkStockAvailability({ skus }) {
  const requested = [...new Set((skus ?? []).map(normalizeSku).filter(Boolean))];
  const rows = await repo.listStocksBySkus(requested);

  const totals = new Map();
  for (const row of rows) {
    const sku = normalizeSku(row.product_variants?.sku);
    if (!sku) continue;
    const current = totals.get(sku) ?? { on_hand: 0, reserved: 0, available: 0 };
    current.on_hand += toNumber(row.on_hand);
    current.reserved += toNumber(row.reserved);
    current.available += toNumber(row.available);
    totals.set(sku, current);
  }

  // Trả đủ danh sách SKU được hỏi; SKU chưa có bản ghi tồn = 0 khả dụng.
  return {
    items: requested.map((sku) => {
      const entry = totals.get(sku) ?? { on_hand: 0, reserved: 0, available: 0 };
      return {
        sku,
        on_hand: entry.on_hand,
        reserved: entry.reserved,
        available: entry.available,
        in_stock: entry.available > 0,
      };
    }),
  };
}

export async function reserveStock({ order_ref, items }) {
  const orderRef = String(order_ref ?? '').trim();
  const aggregated = aggregateItems(items ?? []);
  const skus = aggregated.map((item) => item.sku);
  const variantMap = await loadVariantMap(skus, { requireActive: true });

  const existing = await repo.listActiveReservations(orderRef);
  if (existing.length > 0) {
    const expiresAt = existing.reduce(
      (latest, row) => (!latest || row.expires_at > latest ? row.expires_at : latest),
      null,
    );
    return {
      success: true,
      order_ref: orderRef,
      already_reserved: true,
      items: existing.length,
      expires_at: expiresAt,
    };
  }

  const stockRows = await repo.findStockOptions(skus);
  const optionsBySku = new Map();
  for (const row of stockRows) {
    const sku = normalizeSku(row.product_variants?.sku);
    if (!sku) continue;
    if (!optionsBySku.has(sku)) optionsBySku.set(sku, []);
    optionsBySku.get(sku).push(row);
  }

  const rpcItems = [];
  const shortages = [];

  for (const item of aggregated) {
    const variant = variantMap.get(item.sku);
    const options = (optionsBySku.get(item.sku) ?? []).sort((left, right) => {
      const defaultDelta =
        Number(Boolean(right.warehouses?.is_default)) -
        Number(Boolean(left.warehouses?.is_default));
      if (defaultDelta !== 0) return defaultDelta;
      return toNumber(right.available) - toNumber(left.available);
    });

    let remaining = item.quantity;
    for (const option of options) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, Math.max(0, toNumber(option.available)));
      if (take <= 0) continue;
      rpcItems.push({
        variant_id: option.variant_id ?? variant.id,
        warehouse_id: option.warehouse_id,
        quantity: take,
      });
      remaining -= take;
    }

    if (remaining > 0) {
      const available = options.reduce((sum, option) => sum + toNumber(option.available), 0);
      shortages.push({ sku: item.sku, requested: item.quantity, available });
    }
  }

  if (shortages.length > 0) {
    throw fail(
      409,
      ERROR_CODES.INSUFFICIENT_STOCK,
      `Không đủ tồn khả dụng cho ${shortages.map((entry) => entry.sku).join(', ')}.`,
      { items: shortages, ttl_minutes: RESERVATION_TTL_MINUTES },
    );
  }

  const result = await repo.reserveStockRpc({
    orderRef,
    items: rpcItems,
    expiresAt: null,
  });

  return {
    success: true,
    order_ref: result?.order_ref ?? orderRef,
    already_reserved: Boolean(result?.already_reserved),
    items: toNumber(result?.items),
    expires_at: result?.expires_at ?? null,
    ttl_minutes: RESERVATION_TTL_MINUTES,
  };
}

export async function releaseStock({ order_ref }) {
  const result = await repo.releaseStockRpc(String(order_ref ?? '').trim());
  return {
    success: true,
    order_ref: result?.order_ref ?? order_ref,
    released_items: toNumber(result?.released_items),
  };
}

export async function fulfillStock({ order_ref }) {
  const result = await repo.fulfillStockRpc(String(order_ref ?? '').trim());
  return {
    success: true,
    order_ref: result?.order_ref ?? order_ref,
    fulfilled_items: toNumber(result?.fulfilled_items),
  };
}

/* ------------------------------------------------------------------ */
/* M08-F02 — Nhập kho                                                  */
/* ------------------------------------------------------------------ */

export async function createGoodsReceipt({ supplier_id, warehouse_id, items, note, auth }) {
  await assertActiveWarehouse(warehouse_id);
  const supplier = await repo.findSupplierById(supplier_id);
  if (!supplier) throw notFound('Không tìm thấy nhà cung cấp.');
  if (supplier.is_active === false) throw conflict('Nhà cung cấp đã ngừng hợp tác.');

  const skus = uniqueSkus(items ?? []);
  const variantMap = await loadVariantMap(skus);
  const rpcItems = (items ?? []).map((item) => ({
    variant_id: variantMap.get(normalizeSku(item.sku)).id,
    quantity: toNumber(item.quantity),
    unit_cost: toNumber(item.unit_cost),
    vat_rate: toNumber(item.vat_rate),
  }));

  const result = await repo.createGoodsReceiptRpc({
    supplierId: supplier_id,
    warehouseId: warehouse_id,
    items: rpcItems,
    note,
    createdBy: auth?.userId,
  });

  return {
    receipt_id: result?.receipt_id,
    code: result?.code,
    status: result?.status,
    total_quantity: toNumber(result?.total_quantity),
    total_amount: toNumber(result?.total_amount),
    received_at: result?.received_at ?? null,
  };
}

export async function listGoodsReceipts(query) {
  const pagination = parsePagination(query);
  const { rows, total } = await repo.listGoodsReceipts({
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset,
    warehouseId: query.warehouse_id,
    supplierId: query.supplier_id,
    status: query.status,
  });

  return {
    total,
    page: pagination.page,
    limit: pagination.limit,
    total_pages: Math.ceil(total / pagination.limit),
    items: rows.map(mapReceipt),
  };
}

/* ------------------------------------------------------------------ */
/* M08-F09 — Kiểm kê và điều chỉnh                                     */
/* ------------------------------------------------------------------ */

export async function createStockAdjustment({ warehouse_id, items, auth }) {
  await assertActiveWarehouse(warehouse_id);

  const skus = uniqueSkus(items ?? []);
  const variantMap = await loadVariantMap(skus);
  const stockRows = await repo.findStockRowsByVariantIds(
    skus.map((sku) => variantMap.get(sku).id),
    warehouse_id,
  );
  const stockByVariant = new Map(
    stockRows.map((row) => [row.variant_id, { on_hand: toNumber(row.on_hand) }]),
  );

  let requiresAdminApproval = false;
  const reasons = new Set();
  const rpcItems = [];

  for (const item of items ?? []) {
    const sku = normalizeSku(item.sku);
    const variant = variantMap.get(sku);
    const systemQuantity = stockByVariant.get(variant.id)?.on_hand ?? 0;
    const diff = toNumber(item.diff_quantity);
    const countedQuantity = systemQuantity + diff;
    if (countedQuantity < 0) {
      throw invalid(`Số kiểm thực tế của ${sku} không được âm.`, { sku });
    }

    const unitValue = toNumber(variant.products?.price_regular);
    if (
      Math.abs(diff) > STOCKTAKE_ADMIN_APPROVAL_QUANTITY ||
      Math.abs(diff) * unitValue > STOCKTAKE_ADMIN_APPROVAL_VALUE_VND
    ) {
      requiresAdminApproval = true;
    }

    reasons.add(item.reason);
    rpcItems.push({
      variant_id: variant.id,
      counted_quantity: countedQuantity,
      reason: item.reason,
    });
  }

  const autoApprove = !requiresAdminApproval || auth?.role === 'ADMIN';
  const reason = [...reasons].join('; ').slice(0, 500);

  const result = await repo.createStockAdjustmentRpc({
    warehouseId: warehouse_id,
    reason,
    items: rpcItems,
    requiresAdminApproval,
    autoApprove,
    createdBy: auth?.userId,
  });

  return {
    adjustment_id: result?.adjustment_id,
    code: result?.code,
    status: result?.status,
    requires_admin_approval: Boolean(result?.requires_admin_approval),
    items: (result?.items ?? []).map((row) => ({
      variant_id: row.variant_id,
      system_quantity: toNumber(row.system_quantity),
      counted_quantity: toNumber(row.counted_quantity),
      difference: toNumber(row.difference),
    })),
  };
}

export async function decideStockAdjustment({ id, action, auth }) {
  const result = await repo.decideStockAdjustmentRpc({
    adjustmentId: id,
    action,
    actorId: auth?.userId,
  });
  return {
    adjustment_id: result?.adjustment_id ?? id,
    status: result?.status,
  };
}

export async function listStockAdjustments(query) {
  const pagination = parsePagination(query);
  const { rows, total } = await repo.listStockAdjustments({
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset,
    warehouseId: query.warehouse_id,
    status: query.status,
  });

  return {
    total,
    page: pagination.page,
    limit: pagination.limit,
    total_pages: Math.ceil(total / pagination.limit),
    items: rows.map(mapAdjustment),
  };
}

/* ------------------------------------------------------------------ */
/* M08-F10 — Chuyển kho nội bộ                                         */
/* ------------------------------------------------------------------ */

export async function createStockTransfer({
  from_warehouse_id,
  to_warehouse_id,
  items,
  note,
  auth,
}) {
  if (from_warehouse_id === to_warehouse_id) {
    throw invalid('Kho nguồn và kho đích phải khác nhau.', { field: 'to_warehouse_id' });
  }
  await assertActiveWarehouse(from_warehouse_id, 'Kho nguồn');
  await assertActiveWarehouse(to_warehouse_id, 'Kho đích');

  const skus = uniqueSkus(items ?? []);
  const variantMap = await loadVariantMap(skus);
  const rpcItems = (items ?? []).map((item) => ({
    variant_id: variantMap.get(normalizeSku(item.sku)).id,
    quantity: toNumber(item.quantity),
  }));

  const result = await repo.createStockTransferRpc({
    fromWarehouseId: from_warehouse_id,
    toWarehouseId: to_warehouse_id,
    items: rpcItems,
    note,
    createdBy: auth?.userId,
  });

  return {
    transfer_id: result?.transfer_id,
    code: result?.code,
    status: result?.status,
    created_at: result?.created_at ?? null,
  };
}

export async function updateStockTransfer({ id, action, auth }) {
  const result = await repo.transitionStockTransferRpc({
    transferId: id,
    action,
    actorId: auth?.userId,
  });
  return {
    transfer_id: result?.transfer_id ?? id,
    code: result?.code,
    status: result?.status,
    shipped_at: result?.shipped_at ?? null,
    received_at: result?.received_at ?? null,
  };
}

export async function listStockTransfers(query) {
  const pagination = parsePagination(query);
  const { rows, total } = await repo.listStockTransfers({
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset,
    status: query.status,
    fromWarehouseId: query.from_warehouse_id,
    toWarehouseId: query.to_warehouse_id,
  });

  return {
    total,
    page: pagination.page,
    limit: pagination.limit,
    total_pages: Math.ceil(total / pagination.limit),
    items: rows.map(mapTransfer),
  };
}

/* ------------------------------------------------------------------ */
/* M08-F08 — Nhập lại hàng hoàn                                        */
/* ------------------------------------------------------------------ */

export async function receiveReturnedStock({ order_ref, warehouse_id, items, note, auth }) {
  await assertActiveWarehouse(warehouse_id);

  const skus = uniqueSkus(items ?? []);
  const variantMap = await loadVariantMap(skus);
  const rpcItems = (items ?? []).map((item) => ({
    variant_id: variantMap.get(normalizeSku(item.sku)).id,
    quantity: toNumber(item.quantity),
    condition: normalizeSku(item.condition ?? 'SELLABLE'),
  }));

  const result = await repo.receiveReturnedStockRpc({
    orderRef: order_ref,
    warehouseId: warehouse_id,
    items: rpcItems,
    note,
    createdBy: auth?.userId,
  });

  return {
    order_ref: result?.order_ref ?? order_ref,
    warehouse_id: result?.warehouse_id ?? warehouse_id,
    sellable_quantity: toNumber(result?.sellable_quantity),
    damaged_quantity: toNumber(result?.damaged_quantity),
  };
}

/* ------------------------------------------------------------------ */
/* M08-F13 — Thẻ kho                                                   */
/* ------------------------------------------------------------------ */

function toRangeBoundary(value, endOfDay) {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const timestamp = isDateOnly ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}` : value;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getStockCard({ sku, warehouse_id, from_date, to_date }) {
  await assertActiveWarehouse(warehouse_id);

  const result = await repo.getStockCardRpc({
    sku: normalizeSku(sku),
    warehouseId: warehouse_id,
    fromDate: toRangeBoundary(from_date, false),
    toDate: toRangeBoundary(to_date, true),
  });

  return {
    sku: result?.sku ?? normalizeSku(sku),
    variant_name: result?.variant_name ?? null,
    product_name: result?.product_name ?? null,
    warehouse_id: result?.warehouse_id ?? warehouse_id,
    warehouse_name: result?.warehouse_name ?? null,
    from_date: result?.from_date ?? null,
    to_date: result?.to_date ?? null,
    opening: {
      on_hand: toNumber(result?.opening?.on_hand),
      reserved: toNumber(result?.opening?.reserved),
    },
    closing: {
      on_hand: toNumber(result?.closing?.on_hand),
      reserved: toNumber(result?.closing?.reserved),
    },
    movements: (result?.movements ?? []).map(mapMovement),
  };
}
