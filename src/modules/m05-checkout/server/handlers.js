import 'server-only';
import * as service from './service.js';

/**
 * [SERVER] M05 — handler map theo registry API.
 * Mỗi handler nhận ctx của withApi và ủy quyền cho service.
 * API-M05-04 trả về Response thô đúng chuẩn VNPAY ({ RspCode, Message }),
 * không bọc envelope chung.
 */
export const handlers = Object.freeze({
  'API-M05-01': (ctx) => service.getCheckoutSummary({ auth: ctx.auth, body: ctx.body }), // M05-F01, F03, F05
  'API-M05-02': (ctx) =>
    service.placeOrder({ auth: ctx.auth, body: ctx.body, request: ctx.request }), // M05-F06
  'API-M05-03': (ctx) =>
    service.getOrderDetail({ auth: ctx.auth, params: ctx.params, query: ctx.query }), // M05-F10
  'API-M05-04': (ctx) =>
    service.handleVnpayIpn({
      query: ctx.query,
      body: ctx.body,
      rawBody: ctx.rawBody,
    }), // M05-F07
  'API-M05-05': (ctx) =>
    service.cancelOrder({ auth: ctx.auth, params: ctx.params, body: ctx.body }), // M05-F09
  'API-M05-06': (ctx) => service.listAdminOrders({ query: ctx.query }), // M05-F11
  'API-M05-07': (ctx) =>
    service.updateOrderStatus({ auth: ctx.auth, params: ctx.params, body: ctx.body }), // M05-F11
});
