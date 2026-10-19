import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M04 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M04-01': notImplementedHandler('API-M04-01'), // M04-F02
  'API-M04-02': notImplementedHandler('API-M04-02'), // M04-F01
  'API-M04-03': notImplementedHandler('API-M04-03'), // M04-F03
  'API-M04-04': notImplementedHandler('API-M04-04'), // M04-F04
  'API-M04-05': notImplementedHandler('API-M04-05'), // M04-F04
  'API-M04-06': notImplementedHandler('API-M04-06'), // M04-F08
  'API-M04-07': notImplementedHandler('API-M04-07'), // M04-F07
});
