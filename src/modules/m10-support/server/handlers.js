import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M10 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M10-01': notImplementedHandler('API-M10-01'), // M10-F03
  'API-M10-02': notImplementedHandler('API-M10-02'), // M10-F01
  'API-M10-03': notImplementedHandler('API-M10-03'), // M10-F06
  'API-M10-04': notImplementedHandler('API-M10-04'), // M10-F07
  'API-M10-05': notImplementedHandler('API-M10-05'), // M10-F07
  'API-M10-06': notImplementedHandler('API-M10-06'), // M10-F10
  'API-M10-07': notImplementedHandler('API-M10-07'), // M10-F04
});
