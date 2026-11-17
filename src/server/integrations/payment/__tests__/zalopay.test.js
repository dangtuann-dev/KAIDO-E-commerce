// Kiểm thử adapter ZaloPay: ký tạo đơn bằng Key1, xác thực callback/redirect bằng Key2.
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAppTransId,
  createOrder,
  getZalopaySettings,
  parseOrderRefFromAppTransId,
  verifyCallback,
  verifyRedirect,
} from '@/server/integrations/payment/zalopay.js';

const APP_ID = '554';
const KEY1 = 'key1-demo';
const KEY2 = 'key2-demo';
const ORDER_REF = 'KD-261117-0001';

const ORIGINAL_ENV = { ...process.env };

function setEnv(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function hmac(input, key) {
  return createHmac('sha256', key).update(String(input), 'utf8').digest('hex');
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('ZaloPay adapter', () => {
  beforeEach(() => {
    setEnv({
      NODE_ENV: 'test',
      ZALOPAY_APP_ID: APP_ID,
      ZALOPAY_KEY1: KEY1,
      ZALOPAY_KEY2: KEY2,
      ZALOPAY_ENDPOINT: undefined,
    });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('thiếu khóa thì từ chối (503) để M05 hạ cấp sang COD', () => {
    setEnv({ ZALOPAY_APP_ID: undefined });
    expect(() => getZalopaySettings()).toThrowError(/chưa được cấu hình/);
  });

  it('app_trans_id theo yymmdd giờ Việt Nam + appid + mã đơn', () => {
    // 16/11/2026 17:30 UTC = 17/11/2026 00:30 GMT+7.
    const id = buildAppTransId(ORDER_REF, new Date('2026-11-16T17:30:00Z'));
    expect(id).toBe(`261117_${APP_ID}_${ORDER_REF}`);
    expect(parseOrderRefFromAppTransId(id)).toBe(ORDER_REF);
    expect(parseOrderRefFromAppTransId('khong-dung-dinh-dang')).toBeNull();
  });

  it('tạo đơn ký HMAC-SHA256 (Key1) và trả order_url của cổng', async () => {
    const fetchMock = vi.fn(async (url, init) => {
      const body = JSON.parse(init.body);
      expect(url).toBe('https://sb-openapi.zalopay.vn/v2/create');
      expect(body.app_id).toBe(Number(APP_ID));
      expect(body.amount).toBe(250000);
      expect(body.callback_url).toMatch(/\/api\/v1\/payments\/zalopay\/callback$/);
      expect(body.embed_data).toContain('/payment/zalopay-return');
      expect(body.mac).toBe(
        hmac(
          [
            APP_ID,
            body.app_trans_id,
            body.app_user,
            body.amount,
            body.app_time,
            body.embed_data,
            body.item,
          ].join('|'),
          KEY1,
        ),
      );
      return jsonResponse({
        return_code: 1,
        order_url: 'https://sbgateway.zalopay.vn/openinapp?order=abc',
        zp_trans_token: 'token-1',
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createOrder({ orderRef: ORDER_REF, amountVnd: 250000 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.paymentUrl).toContain('openinapp');
    expect(result.transactionRef).toBe('token-1');
    expect(result.sandbox).toBe(true);
    expect(parseOrderRefFromAppTransId(result.appTransId)).toBe(ORDER_REF);
  });

  it('cổng từ chối yêu cầu thì ném lỗi nghiệp vụ', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ return_code: 3, sub_return_message: 'invalid app' })),
    );

    await expect(createOrder({ orderRef: ORDER_REF, amountVnd: 250000 })).rejects.toThrowError(
      /invalid app/,
    );
  });

  it('callback hợp lệ: xác thực Key2 rồi lấy mã đơn, số tiền, mã giao dịch', async () => {
    const appTransId = buildAppTransId(ORDER_REF);
    const data = JSON.stringify({
      app_id: Number(APP_ID),
      app_trans_id: appTransId,
      amount: 250000,
      zp_trans_id: '221117000000001',
    });

    const result = await verifyCallback({ body: { data, mac: hmac(data, KEY2), type: 1 } });

    expect(result.valid).toBe(true);
    expect(result.orderRef).toBe(ORDER_REF);
    expect(result.amountVnd).toBe(250000);
    expect(result.transactionRef).toBe('221117000000001');
    expect(result.isSuccess).toBe(true);
  });

  it('callback sai chữ ký thì bị từ chối', async () => {
    const data = JSON.stringify({ app_trans_id: buildAppTransId(ORDER_REF), amount: 250000 });

    const result = await verifyCallback({ body: { data, mac: 'deadbeef', type: 1 } });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('ZALOPAY_CALLBACK_INVALID_MAC');
  });

  it('redirect: checksum đúng được chấp nhận, checksum sai bị từ chối', async () => {
    const params = {
      appid: APP_ID,
      apptransid: buildAppTransId(ORDER_REF),
      pmcid: '38',
      bankcode: 'SBI',
      amount: '250000',
      discountamount: '0',
      status: '1',
    };
    const checksum = hmac(
      [
        params.appid,
        params.apptransid,
        params.pmcid,
        params.bankcode,
        params.amount,
        params.discountamount,
        params.status,
      ].join('|'),
      KEY2,
    );

    const ok = await verifyRedirect({ ...params, checksum });
    expect(ok.valid).toBe(true);
    expect(ok.orderRef).toBe(ORDER_REF);
    expect(ok.isSuccess).toBe(true);

    const bad = await verifyRedirect({ ...params, checksum: 'bad' });
    expect(bad.valid).toBe(false);
    expect(bad.reason).toBe('ZALOPAY_REDIRECT_INVALID_CHECKSUM');
  });
});
