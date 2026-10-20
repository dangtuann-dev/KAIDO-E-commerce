import 'server-only';
import { notImplementedHandler } from '@/server/http/handlers.js';
import { registerAccount } from './service.js';

/**
 * [SERVER] M01 — handler map theo registry API.
 * Giai đoạn nền tảng: mọi handler trả 501 NOT_IMPLEMENTED kèm mã API.
 * TODO: thay từng handler bằng service tương ứng khi triển khai nghiệp vụ.
 */
const registerHandler = async ({ body }) => {
  const user = await registerAccount(body);
  return { status: 201, data: user };
};

export const handlers = Object.freeze({
  'API-M01-01': registerHandler, // M01-F01
  'API-M01-02': notImplementedHandler('API-M01-02'), // M01-F02
  'API-M01-03': notImplementedHandler('API-M01-03'), // M01-F03
  'API-M01-04': notImplementedHandler('API-M01-04'), // M01-F03
  'API-M01-05': notImplementedHandler('API-M01-05'), // M01-F04
  'API-M01-06': notImplementedHandler('API-M01-06'), // M01-F05
  'API-M01-07': notImplementedHandler('API-M01-07'), // M01-F07
});