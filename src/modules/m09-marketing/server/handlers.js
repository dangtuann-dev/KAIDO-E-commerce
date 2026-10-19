import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M09 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M09-01': notImplementedHandler('API-M09-01'), // M09-F01
  'API-M09-02': notImplementedHandler('API-M09-02'), // M09-F03
  'API-M09-03': notImplementedHandler('API-M09-03'), // M09-F08
  'API-M09-04': notImplementedHandler('API-M09-04'), // M09-F01
  'API-M09-05': notImplementedHandler('API-M09-05'), // M09-F04
  'API-M09-06': notImplementedHandler('API-M09-06'), // M09-F02
});
