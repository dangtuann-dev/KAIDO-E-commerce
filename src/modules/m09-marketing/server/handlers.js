import 'server-only';
import * as service from './service.js';

/**
 * [SERVER] M09 — handler map theo registry API.
 * Mỗi handler nhận ctx của withApi và trả dữ liệu đã chuẩn hóa.
 */
export const handlers = Object.freeze({
  'API-M09-01': (ctx) => service.getBanners({ position: ctx.query.position ?? null }), // M09-F01/F07
  'API-M09-02': () => service.getActiveCampaigns(), // M09-F03/F07
  'API-M09-03': (ctx) => service.verifyCouponForHttp({ body: ctx.body, auth: ctx.auth }), // M09-F08
  'API-M09-04': (ctx) => service.createBanner({ body: ctx.body, auth: ctx.auth }), // M09-F01
  'API-M09-05': (ctx) => service.createCoupon({ body: ctx.body, auth: ctx.auth }), // M09-F04
  'API-M09-06': (ctx) => service.listPublicArticles({ query: ctx.query }), // M09-F02/F07
  'API-M09-07': (ctx) => service.getArticleBySlug({ slug: ctx.params.slug }), // M09-F02/F07
  'API-M09-08': (ctx) => service.getPublicCoupons({ query: ctx.query }), // M09-F04/F07
  'API-M09-09': (ctx) => service.listAdminBanners({ query: ctx.query }), // M09-F06
  'API-M09-10': (ctx) => service.updateBanner({ id: ctx.params.id, patch: ctx.body }), // M09-F01
  'API-M09-11': (ctx) => service.deleteBanner({ id: ctx.params.id }), // M09-F01
  'API-M09-12': (ctx) => service.listAdminArticles({ query: ctx.query }), // M09-F06
  'API-M09-13': (ctx) => service.createArticle({ body: ctx.body, auth: ctx.auth }), // M09-F02
  'API-M09-14': (ctx) => service.updateArticle({ id: ctx.params.id, patch: ctx.body }), // M09-F02
  'API-M09-15': (ctx) => service.deleteArticle({ id: ctx.params.id }), // M09-F02
  'API-M09-16': (ctx) => service.listAdminCampaigns({ query: ctx.query }), // M09-F06
  'API-M09-17': (ctx) => service.createCampaign({ body: ctx.body, auth: ctx.auth }), // M09-F03
  'API-M09-18': (ctx) => service.getAdminCampaign({ id: ctx.params.id }), // M09-F03
  'API-M09-19': (ctx) => service.updateCampaign({ id: ctx.params.id, patch: ctx.body }), // M09-F03
  'API-M09-20': (ctx) =>
    service.changeCampaignStatus({ id: ctx.params.id, action: ctx.body.action }), // M09-F05
  'API-M09-21': (ctx) => service.listAdminCoupons({ query: ctx.query }), // M09-F06
  'API-M09-22': (ctx) => service.updateCoupon({ id: ctx.params.id, patch: ctx.body }), // M09-F04
  'API-M09-23': (ctx) => service.deleteCoupon({ id: ctx.params.id }), // M09-F04
  'API-M09-24': (ctx) => service.getAdminArticle({ id: ctx.params.id }), // M09-F02/F06
});
