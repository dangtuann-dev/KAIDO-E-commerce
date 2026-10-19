import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M02 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M02-01': notImplementedHandler('API-M02-01'), // M02-F01
  'API-M02-02': notImplementedHandler('API-M02-02'), // M02-F10
  'API-M02-03': notImplementedHandler('API-M02-03'), // M02-F11
  'API-M02-04': notImplementedHandler('API-M02-04'), // M02-F04
  'API-M02-05': notImplementedHandler('API-M02-05'), // M02-F05
  'API-M02-06': notImplementedHandler('API-M02-06'), // M02-F06
  'API-M02-07': notImplementedHandler('API-M02-07'), // M02-F12
});
