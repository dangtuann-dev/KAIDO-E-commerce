import 'server-only';
import {
  calculateLoyaltyDiscount,
  createVoucher,
  getMyPoints,
  getPointHistory,
  getTierSummary,
  validateVoucher,
} from './service.js';

export const handlers = Object.freeze({
  'API-M07-01': ({ body }) => validateVoucher(body),
  'API-M07-02': ({ auth }) => getMyPoints({ userId: auth.userId }),
  'API-M07-03': ({ auth, query }) =>
    getPointHistory({ userId: auth.userId, page: query.page, limit: query.limit }),
  'API-M07-04': ({ auth, body }) => calculateLoyaltyDiscount({ userId: auth.userId, body }),
  'API-M07-05': ({ auth, body }) => createVoucher({ ...body, created_by: auth.userId }),
  'API-M07-06': () => getTierSummary(),
});
