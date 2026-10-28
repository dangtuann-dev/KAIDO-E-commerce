import 'server-only';
import * as service from './service.js';

/**
 * [SERVER] M08 — handler map theo registry API.
 * Mỗi handler nhận ctx của withApi và trả dữ liệu đã chuẩn hóa.
 */
export const handlers = Object.freeze({
  'API-M08-01': (ctx) => service.checkStockAvailability(ctx.query), // M08-F04
  'API-M08-02': (ctx) =>
    service.reserveStock({ order_ref: ctx.body.order_ref, items: ctx.body.items }), // M08-F05
  'API-M08-03': (ctx) => service.releaseStock({ order_ref: ctx.body.order_ref }), // M08-F07
  'API-M08-04': (ctx) => service.fulfillStock({ order_ref: ctx.body.order_ref }), // M08-F06
  'API-M08-05': (ctx) => service.createGoodsReceipt({ ...ctx.body, auth: ctx.auth }), // M08-F02
  'API-M08-06': (ctx) => service.createStockAdjustment({ ...ctx.body, auth: ctx.auth }), // M08-F09
  'API-M08-07': (ctx) => service.getStockCard(ctx.query), // M08-F13
  'API-M08-08': (ctx) => service.listInventoryStock(ctx.query), // M08-F03
  'API-M08-09': (ctx) => service.listWarehouses(ctx.query), // M08-F01
  'API-M08-10': (ctx) => service.createWarehouse(ctx.body), // M08-F01
  'API-M08-11': (ctx) => service.updateWarehouse({ id: ctx.params.id, patch: ctx.body }), // M08-F01
  'API-M08-12': (ctx) => service.listSuppliers(ctx.query), // M08-F12
  'API-M08-13': (ctx) => service.createSupplier(ctx.body), // M08-F12
  'API-M08-14': (ctx) => service.updateSupplier({ id: ctx.params.id, patch: ctx.body }), // M08-F12
  'API-M08-15': (ctx) => service.listGoodsReceipts(ctx.query), // M08-F02
  'API-M08-16': (ctx) => service.listStockAdjustments(ctx.query), // M08-F09
  'API-M08-17': (ctx) =>
    service.decideStockAdjustment({
      id: ctx.params.id,
      action: ctx.body.action,
      auth: ctx.auth,
    }), // M08-F09
  'API-M08-18': (ctx) => service.listStockTransfers(ctx.query), // M08-F10
  'API-M08-19': (ctx) => service.createStockTransfer({ ...ctx.body, auth: ctx.auth }), // M08-F10
  'API-M08-20': (ctx) =>
    service.updateStockTransfer({
      id: ctx.params.id,
      action: ctx.body.action,
      auth: ctx.auth,
    }), // M08-F10
  'API-M08-21': (ctx) => service.receiveReturnedStock({ ...ctx.body, auth: ctx.auth }), // M08-F08
  'API-M08-22': (ctx) => service.listLowStock(ctx.query), // M08-F11
  'API-M08-23': () => service.getInventorySummary(), // M08-F03
});
