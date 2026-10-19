import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M08 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M08-01': notImplementedHandler('API-M08-01'), // M08-F04
  'API-M08-02': notImplementedHandler('API-M08-02'), // M08-F05
  'API-M08-03': notImplementedHandler('API-M08-03'), // M08-F07
  'API-M08-04': notImplementedHandler('API-M08-04'), // M08-F06
  'API-M08-05': notImplementedHandler('API-M08-05'), // M08-F02
  'API-M08-06': notImplementedHandler('API-M08-06'), // M08-F09
  'API-M08-07': notImplementedHandler('API-M08-07'), // M08-F13
});
