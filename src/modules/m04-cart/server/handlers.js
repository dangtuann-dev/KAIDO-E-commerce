import 'server-only';
import * as service from './service.js';

/**
 * [SERVER] M04 — handler map theo registry API.
 * Mỗi handler nhận ctx của withApi và ủy quyền cho service.
 * `auth`/`guestSessionId` luôn được truyền để service tự phân giải chủ giỏ:
 * thành viên ưu tiên Authorization, khách vãng lai dùng X-Guest-Session-Id.
 */
export const handlers = Object.freeze({
  'API-M04-01': (ctx) =>
    service.getCart({ auth: ctx.auth, guestSessionId: ctx.guestSessionId, query: ctx.query }), // M04-F02, F09
  'API-M04-02': (ctx) =>
    service.addCartItem({ auth: ctx.auth, guestSessionId: ctx.guestSessionId, body: ctx.body }), // M04-F01
  'API-M04-03': (ctx) =>
    service.updateCartItem({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      params: ctx.params,
      body: ctx.body,
    }), // M04-F03
  'API-M04-04': (ctx) =>
    service.removeCartItem({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      params: ctx.params,
    }), // M04-F04
  'API-M04-05': (ctx) =>
    service.bulkRemoveCartItems({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      body: ctx.body,
    }), // M04-F04
  'API-M04-06': (ctx) => service.mergeGuestCart({ auth: ctx.auth, body: ctx.body }), // M04-F08
  'API-M04-07': (ctx) =>
    service.applyCouponToCart({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      body: ctx.body,
    }), // M04-F07
  'API-M04-08': (ctx) =>
    service.clearCart({ auth: ctx.auth, guestSessionId: ctx.guestSessionId }), // M04-F05
  'API-M04-09': (ctx) =>
    service.selectItemsForCheckout({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      body: ctx.body,
    }), // M04-F06
  'API-M04-10': (ctx) =>
    service.saveForLater({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      params: ctx.params,
    }), // M04-F10
  'API-M04-11': (ctx) =>
    service.restoreSavedItem({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      params: ctx.params,
    }), // M04-F10
  'API-M04-12': (ctx) =>
    service.removeSavedItem({
      auth: ctx.auth,
      guestSessionId: ctx.guestSessionId,
      params: ctx.params,
    }), // M04-F10
});
