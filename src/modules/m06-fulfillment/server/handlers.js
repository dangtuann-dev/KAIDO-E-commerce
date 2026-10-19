import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M06 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M06-01': notImplementedHandler('API-M06-01'), // M06-F08
  'API-M06-02': notImplementedHandler('API-M06-02'), // M06-F09
  'API-M06-03': notImplementedHandler('API-M06-03'), // M06-F03
  'API-M06-04': notImplementedHandler('API-M06-04'), // M06-F10
  'API-M06-05': notImplementedHandler('API-M06-05'), // M06-F04
  'API-M06-06': notImplementedHandler('API-M06-06'), // M06-F12
  'API-M06-07': notImplementedHandler('API-M06-07'), // M06-F12
});
