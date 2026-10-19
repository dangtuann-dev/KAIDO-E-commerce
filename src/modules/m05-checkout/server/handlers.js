import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M05 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M05-01': notImplementedHandler('API-M05-01'), // M05-F01
  'API-M05-02': notImplementedHandler('API-M05-02'), // M05-F06
  'API-M05-03': notImplementedHandler('API-M05-03'), // M05-F10
  'API-M05-04': notImplementedHandler('API-M05-04'), // M05-F07
  'API-M05-05': notImplementedHandler('API-M05-05'), // M05-F09
  'API-M05-06': notImplementedHandler('API-M05-06'), // M05-F11
  'API-M05-07': notImplementedHandler('API-M05-07'), // M05-F11
});
