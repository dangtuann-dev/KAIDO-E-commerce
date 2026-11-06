import 'server-only';
import * as service from './service.js';

/**
 * [SERVER] M10 — handler map theo registry API.
 * Mỗi handler nhận ctx của withApi và trả dữ liệu đã chuẩn hóa.
 */
export const handlers = Object.freeze({
  'API-M10-01': (ctx) =>
    service.listProductReviews({ idOrSlug: ctx.params.idOrSlug, query: ctx.query }), // M10-F03
  'API-M10-02': (ctx) =>
    service.createReview({ auth: ctx.auth, idOrSlug: ctx.params.idOrSlug, body: ctx.body }), // M10-F01
  'API-M10-03': (ctx) => service.createSupportTicket({ auth: ctx.auth, body: ctx.body }), // M10-F06
  'API-M10-04': (ctx) =>
    service.getSupportTicket({ auth: ctx.auth, ticketRef: ctx.params.ticketRef }), // M10-F07
  'API-M10-05': (ctx) =>
    service.replySupportTicket({ auth: ctx.auth, ticketRef: ctx.params.ticketRef, body: ctx.body }), // M10-F07
  'API-M10-06': (ctx) => service.listFaqs({ query: ctx.query }), // M10-F10
  'API-M10-07': (ctx) =>
    service.moderateReview({ auth: ctx.auth, id: ctx.params.id, body: ctx.body }), // M10-F04
  'API-M10-08': (ctx) => service.updateReview({ auth: ctx.auth, id: ctx.params.id, body: ctx.body }), // M10-F02
  'API-M10-09': (ctx) => service.deleteReview({ auth: ctx.auth, id: ctx.params.id }), // M10-F02
  'API-M10-10': (ctx) => service.listMyReviews({ auth: ctx.auth, query: ctx.query }), // M10-F02
  'API-M10-11': (ctx) =>
    service.replyToReview({ auth: ctx.auth, id: ctx.params.id, body: ctx.body }), // M10-F05
  'API-M10-12': (ctx) => service.listAdminReviews({ query: ctx.query }), // M10-F04
  'API-M10-13': (ctx) => service.listMySupportTickets({ auth: ctx.auth, query: ctx.query }), // M10-F07
  'API-M10-14': (ctx) => service.listAdminSupportTickets({ query: ctx.query }), // M10-F08
  'API-M10-15': (ctx) => service.getAdminSupportTicket({ auth: ctx.auth, id: ctx.params.id }), // M10-F08
  'API-M10-16': (ctx) =>
    service.processSupportTicket({ auth: ctx.auth, id: ctx.params.id, body: ctx.body }), // M10-F08
  'API-M10-17': () => service.getSupportDashboard(), // M10-F11
  'API-M10-18': (ctx) => service.listAdminFaqs({ query: ctx.query }), // M10-F09
  'API-M10-19': (ctx) => service.createFaq({ body: ctx.body }), // M10-F09
  'API-M10-20': (ctx) => service.updateFaq({ id: ctx.params.id, body: ctx.body }), // M10-F09
  'API-M10-21': (ctx) => service.deleteFaq({ id: ctx.params.id }), // M10-F09
  'API-M10-22': (ctx) => service.listFaqCategories({ query: ctx.query }), // M10-F09
  'API-M10-23': (ctx) => service.createFaqCategory({ body: ctx.body }), // M10-F09
});
