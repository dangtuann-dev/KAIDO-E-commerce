import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';

/**
 * [SERVER] M03 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
export const handlers = Object.freeze({
  'API-M03-01': notImplementedHandler('API-M03-01'), // M03-F01
  'API-M03-02': notImplementedHandler('API-M03-02'), // M03-F02
  'API-M03-03': notImplementedHandler('API-M03-03'), // M03-F12
  'API-M03-04': notImplementedHandler('API-M03-04'), // M03-F12
});
