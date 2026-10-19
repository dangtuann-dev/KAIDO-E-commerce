import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M07 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M07-01': notImplementedHandler('API-M07-01'), // M07-F02
  'API-M07-02': notImplementedHandler('API-M07-02'), // M07-F03
  'API-M07-03': notImplementedHandler('API-M07-03'), // M07-F07
  'API-M07-04': notImplementedHandler('API-M07-04'), // M07-F04
  'API-M07-05': notImplementedHandler('API-M07-05'), // M07-F01
  'API-M07-06': notImplementedHandler('API-M07-06'), // M07-F05
});
