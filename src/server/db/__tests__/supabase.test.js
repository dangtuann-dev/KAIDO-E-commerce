import { describe, expect, it } from 'vitest';
import { getEnvStatus, isAuthConfigured, isSupabaseConfigured } from '@/server/env.js';
import { getSupabaseAdmin, pingDatabase } from '@/server/db/supabase.js';

describe('server env', () => {
  it('biến môi trường test hợp lệ và nhận diện cấu hình', () => {
    const status = getEnvStatus();
    expect(status.valid).toBe(true);
    expect(status.nodeEnv).toBe('test');
    expect(status.authConfigured).toBe(true);
    expect(isAuthConfigured()).toBe(true);
    expect(isSupabaseConfigured()).toBe(false);
    expect(status.supabaseConfigured).toBe(false);
    expect(JSON.stringify(status)).not.toContain('test-access-secret');
  });

  it('ném DATABASE_NOT_CONFIGURED khi chưa cấu hình Supabase', () => {
    expect(() => getSupabaseAdmin()).toThrow(
      expect.objectContaining({ code: 'DATABASE_NOT_CONFIGURED' }),
    );
  });

  it('health ping báo not_configured thay vì ném lỗi', async () => {
    await expect(pingDatabase()).resolves.toMatchObject({
      status: 'not_configured',
      latency_ms: null,
    });
  });
});
