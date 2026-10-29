import 'server-only';
import {
  searchProducts,
  autocompleteKeyword,
  getPopularKeywords,
  getSearchStatistics,
} from './service.js';

/** [SERVER] M03 — handler map theo registry API. */
export const handlers = Object.freeze({
  'API-M03-01': async ({ query, auth, guestSessionId }) =>
    searchProducts({ query, userId: auth?.userId ?? null, guestSessionId }),
  'API-M03-02': async ({ query }) => autocompleteKeyword({ query }),
  'API-M03-03': async ({ query }) => getPopularKeywords({ query }),
  'API-M03-04': async ({ query }) => getSearchStatistics({ query }),
});
