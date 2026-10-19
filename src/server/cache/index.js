import 'server-only';

/**
 * [SERVER] Interface cache + adapter bộ nhớ (chỉ dev/test).
 * SRS: 2.3, NFR-M09-02 (rate limit voucher), 2.6 (serverless không có tiến trình thường trực).
 *
 * TODO(NFR-M09-02): thêm adapter Upstash Redis REST cho production trên Vercel.
 * Adapter bộ nhớ không đáng tin trên serverless: mỗi instance có bộ nhớ riêng và
 * có thể bị tái tạo bất kỳ lúc nào, nên rate limit chỉ là lớp bảo vệ tối thiểu khi dev.
 *
 * @typedef {Object} CacheAdapter
 * @property {(key: string) => Promise<unknown>} get
 * @property {(key: string, value: unknown, ttlSeconds?: number) => Promise<void>} set
 * @property {(key: string) => Promise<void>} delete
 * @property {(key: string, ttlSeconds?: number) => Promise<{ count: number, resetAt: number }>} increment
 * @property {() => Promise<void>} clear
 */

const DEFAULT_TTL_SECONDS = 60;
const MAX_ENTRIES = 5000;
const GLOBAL_CACHE_KEY = '__kaidoMemoryCache';

class MemoryCacheAdapter {
  constructor() {
    /** @type {Map<string, { value: unknown, expiresAt: number }>} */
    this.entries = new Map();
  }

  prune(now = Date.now()) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    if (this.entries.size > MAX_ENTRIES) {
      const overflow = this.entries.size - MAX_ENTRIES;
      let removed = 0;
      for (const key of this.entries.keys()) {
        this.entries.delete(key);
        removed += 1;
        if (removed >= overflow) break;
      }
    }
  }

  async get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    const ttl = Math.max(1, Number(ttlSeconds) || DEFAULT_TTL_SECONDS);
    this.entries.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    if (this.entries.size > MAX_ENTRIES) this.prune();
  }

  async delete(key) {
    this.entries.delete(key);
  }

  async increment(key, ttlSeconds = DEFAULT_TTL_SECONDS) {
    const now = Date.now();
    const ttl = Math.max(1, Number(ttlSeconds) || DEFAULT_TTL_SECONDS);
    const current = this.entries.get(key);
    const entry =
      current && current.expiresAt > now
        ? { value: Number(current.value) + 1, expiresAt: current.expiresAt }
        : { value: 1, expiresAt: now + ttl * 1000 };

    this.entries.set(key, entry);
    if (this.entries.size > MAX_ENTRIES) this.prune(now);

    return { count: Number(entry.value), resetAt: entry.expiresAt };
  }

  async clear() {
    this.entries.clear();
  }
}

/**
 * Trả singleton theo process. Hot reload trong dev dùng chung globalThis.
 * @returns {CacheAdapter}
 */
export function getCache() {
  if (!globalThis[GLOBAL_CACHE_KEY]) {
    globalThis[GLOBAL_CACHE_KEY] = new MemoryCacheAdapter();
  }
  return globalThis[GLOBAL_CACHE_KEY];
}

/** Dùng trong test để tránh rò rỉ bộ đếm giữa các case. */
export async function clearCache() {
  await getCache().clear();
}
