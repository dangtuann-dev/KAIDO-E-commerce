import 'server-only';
import * as service from './service.js';

/**
 * [SERVER] M06 — handler map theo registry API.
 * API-M06-05 là alias của API-M05-05 nên không sinh route/handler riêng.
 */
export const handlers = Object.freeze({
  'API-M06-01': (ctx) => service.calculateShippingFee({ body: ctx.body }), // M06-F08
  'API-M06-02': (ctx) =>
    service.createFulfillment({
      auth: ctx.auth,
      params: ctx.params,
      body: ctx.body,
    }), // M06-F09
  'API-M06-03': (ctx) =>
    service.getOrderTracking({ auth: ctx.auth, params: ctx.params }), // M06-F03
  'API-M06-04': (ctx) =>
    service.handleCarrierWebhook({
      request: ctx.request,
      body: ctx.body,
      rawBody: ctx.rawBody,
    }), // M06-F10, F11
  'API-M06-06': (ctx) =>
    service.createReturnRequest({
      auth: ctx.auth,
      params: ctx.params,
      body: ctx.body,
    }), // M06-F12
  'API-M06-07': (ctx) =>
    service.approveReturnRequest({
      auth: ctx.auth,
      params: ctx.params,
      body: ctx.body,
    }), // M06-F12
  'API-M06-08': (ctx) => service.listReturnRequests({ query: ctx.query }), // M06-F12
  'API-M06-09': (ctx) => service.listShipments({ query: ctx.query }), // M06-F14
  'API-M06-10': (ctx) =>
    service.updateReturnStatus({
      auth: ctx.auth,
      params: ctx.params,
      body: ctx.body,
    }), // M06-F11, F12
});
