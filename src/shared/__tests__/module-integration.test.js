/**
 * [SHARED] Kiểm thử tích hợp tĩnh giữa 10 module.
 *
 * Không kết nối DB: kiểm tra các hợp đồng dễ vỡ khi ghép module —
 *  1. Ranh giới module: chỉ import qua public.client.js / public.server.js.
 *  2. Tên export được import từ public.* thực sự tồn tại.
 *  3. Mã endpoint client dùng đều có trong registry.
 *  4. Route ↔ handler ↔ validation của từng endpoint chính.
 *  5. Trang app trỏ tới module page tồn tại.
 *  6. Link nội bộ trỏ tới route thực có.
 *  7. Sidebar admin/khách hàng chỉ chứa link tồn tại.
 *  8. Trạng thái registry khớp với handler NOT_IMPLEMENTED.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  API_ENDPOINTS,
  API_ENDPOINT_BY_CODE,
  PRIMARY_API_ENDPOINTS,
} from '@/shared/api-endpoints.js';
import { MODULES } from '@/shared/constants/modules.js';
import { ADMIN_SIDEBAR_MODULES } from '@/shared/rbac/permissions.js';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const APP = path.join(SRC, 'app');
const MODULES_DIR = path.join(SRC, 'modules');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(name) ? [full] : [];
  });
}

const SOURCE_FILES = walk(SRC);
const PAGE_FILES = walk(APP).filter((file) => /[\\/]page\.js$/.test(file));

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function read(file) {
  return readFileSync(file, 'utf8');
}

/**
 * Chuyển thư mục page thành mẫu route: bỏ route group `(x)`,
 * thay segment động `[param]` bằng `*`.
 */
function pageRoutePatterns() {
  return PAGE_FILES.map((file) => {
    const segments = path
      .relative(APP, file)
      .split(path.sep)
      .slice(0, -1)
      .filter((segment) => !/^\(.*\)$/.test(segment))
      .map((segment) => (/^\[.*\]$/.test(segment) ? '*' : segment));
    return segments;
  });
}

const ROUTE_PATTERNS = pageRoutePatterns();

function matchesRoute(segments) {
  // Route group không tạo segment: /(storefront)/page.js → '/'
  return ROUTE_PATTERNS.some(
    (pattern) =>
      pattern.length === segments.length &&
      pattern.every((part, index) => part === '*' || part === segments[index]),
  );
}

/* ------------------------------------------------------------------ */

describe('ranh giới module', () => {
  it('mọi import chéo module chỉ đi qua public.client.js hoặc public.server.js', () => {
    const violations = [];
    const pattern = /['"]@\/modules\/(m\d{2}-[a-z-]+)\/([^'"]+)['"]/g;
    // Lớp app (src/app) là nơi ghép module nên được import page/service trực tiếp.
    const moduleFiles = SOURCE_FILES.filter((file) => rel(file).startsWith('src/modules/'));

    for (const file of moduleFiles) {
      const owner = rel(file).split('/')[1];
      const source = read(file);
      for (const match of source.matchAll(pattern)) {
        const [, targetModule, target] = match;
        if (targetModule === owner) continue;

        const allowed = target === 'public.client.js' || target === 'public.server.js';
        const targetFile = path.join(MODULES_DIR, targetModule, target);
        if (!allowed || !existsSync(targetFile)) {
          violations.push(`${rel(file)} → ${match[0].slice(1, -1)}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('các tên export được import từ public.* đều tồn tại', () => {
    const missing = [];
    const importPattern =
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/modules\/(m\d{2}-[a-z-]+)\/public\.(?:client|server)\.js['"]/g;

    for (const file of SOURCE_FILES) {
      const source = read(file);
      for (const match of source.matchAll(importPattern)) {
        const names = match[1]
          .split(',')
          .map((entry) => entry.trim().split(/\s+as\s+/)[0])
          .filter(Boolean);
        const target = path.join(MODULES_DIR, match[2], `public.${match[0].includes('public.client') ? 'client' : 'server'}.js`);
        const targetSource = read(target);

        for (const name of names) {
          const exported =
            new RegExp(`export\\s+(async\\s+)?(function|const|class|let|var)\\s+${name}\\b`).test(
              targetSource,
            ) || new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`).test(targetSource);
          if (!exported) missing.push(`${rel(file)}: ${name} không có trong ${rel(target)}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});

describe('registry ↔ client', () => {
  it('mã endpoint trong client service/hook đều tồn tại trong registry', () => {
    const unknown = [];
    const pattern = /(?:getApiEndpoint|resolveEndpointPath)\(\s*['"](API-M\d{2}-\d{2})['"]/g;

    for (const file of SOURCE_FILES.filter((entry) => rel(entry).includes('/client/'))) {
      for (const match of read(file).matchAll(pattern)) {
        if (!API_ENDPOINT_BY_CODE[match[1]]) unknown.push(`${rel(file)}: ${match[1]}`);
      }
    }

    expect(unknown).toEqual([]);
  });

  it('mỗi module có đủ endpoint chính và không trùng mã', () => {
    const codes = API_ENDPOINTS.map((endpoint) => endpoint.code);
    expect(new Set(codes).size).toBe(codes.length);

    for (const [moduleCode, module] of Object.entries(MODULES)) {
      const endpoints = API_ENDPOINTS.filter((endpoint) => endpoint.module === moduleCode);
      expect(endpoints.length, `${moduleCode} (${module.folder}) chưa có endpoint`).toBeGreaterThan(
        0,
      );
    }
  });
});

describe('route ↔ handler ↔ validation', () => {
  it('endpoint chính có route dùng withApi và handler tương ứng', () => {
    const problems = [];

    for (const endpoint of PRIMARY_API_ENDPOINTS) {
      const segments = endpoint.path.split('/').filter(Boolean);
      const routeFile = path.join(APP, ...segments, 'route.js');
      if (!existsSync(routeFile)) {
        problems.push(`${endpoint.code}: thiếu ${rel(routeFile)}`);
        continue;
      }

      const routeSource = read(routeFile);
      if (!routeSource.includes('withApi')) problems.push(`${endpoint.code}: route thiếu withApi`);
      if (!routeSource.includes(`'${endpoint.code}'`)) {
        problems.push(`${endpoint.code}: route không khai báo mã endpoint`);
        continue;
      }

      const moduleMatch = routeSource.match(/@\/modules\/([^'"]+)\/server\/handlers\.js/);
      if (!moduleMatch) {
        problems.push(`${endpoint.code}: route không import handlers`);
        continue;
      }

      const handlerSource = read(path.join(MODULES_DIR, moduleMatch[1], 'server/handlers.js'));
      if (!handlerSource.includes(`'${endpoint.code}'`)) {
        problems.push(`${endpoint.code}: handler chưa được đăng ký`);
      }

      if (routeSource.includes(`validationSchemas['${endpoint.code}']`)) {
        const validationSource = read(
          path.join(MODULES_DIR, moduleMatch[1], 'server/validation.js'),
        );
        if (!validationSource.includes(`'${endpoint.code}'`)) {
          problems.push(`${endpoint.code}: validation schema chưa được khai báo`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it('trạng thái IMPLEMENTED/NOT_IMPLEMENTED khớp với handler thật', () => {
    const problems = [];

    for (const endpoint of PRIMARY_API_ENDPOINTS) {
      const segments = endpoint.path.split('/').filter(Boolean);
      const routeFile = path.join(APP, ...segments, 'route.js');
      if (!existsSync(routeFile)) continue;

      const moduleMatch = read(routeFile).match(/@\/modules\/([^'"]+)\/server\/handlers\.js/);
      if (!moduleMatch) continue;

      const handlerSource = read(path.join(MODULES_DIR, moduleMatch[1], 'server/handlers.js'));
      const notImplemented = new RegExp(
        `'${endpoint.code}'\\s*:\\s*notImplementedHandler`,
      ).test(handlerSource);

      if (endpoint.status === 'NOT_IMPLEMENTED' && !notImplemented) {
        problems.push(`${endpoint.code}: registry ghi NOT_IMPLEMENTED nhưng đã có handler`);
      }
      if (endpoint.status === 'IMPLEMENTED' && notImplemented) {
        problems.push(`${endpoint.code}: registry ghi IMPLEMENTED nhưng handler còn là stub`);
      }
    }

    expect(problems).toEqual([]);
  });
});

describe('trang và điều hướng', () => {
  it('mọi page wrapper import module page tồn tại', () => {
    const missing = [];
    for (const file of PAGE_FILES) {
      for (const match of read(file).matchAll(/['"]@\/(modules\/[^'"]+)['"]/g)) {
        if (!existsSync(path.join(SRC, match[1]))) missing.push(`${rel(file)}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('mọi href nội bộ dạng chuỗi trỏ tới route thực có', () => {
    const broken = [];
    const pattern = /href\s*=\s*["'](\/[^"'${}]*)["']/g;

    for (const file of SOURCE_FILES.filter((entry) => /\.jsx$/.test(entry))) {
      for (const match of read(file).matchAll(pattern)) {
        const target = match[1].split(/[?#]/)[0];
        const segments = target.split('/').filter(Boolean);
        if (!matchesRoute(segments)) {
          broken.push(`${rel(file)}: ${target}`);
        }
      }
    }

    expect(broken).toEqual([]);
  });

  it('sidebar admin và tài khoản chỉ chứa link tồn tại, ADMIN thấy đủ 9 module', () => {
    const navFiles = [
      path.join(SRC, 'shared/layouts/admin-sidebar.jsx'),
      path.join(SRC, 'shared/layouts/account-sidebar.jsx'),
    ];
    const broken = [];
    for (const file of navFiles) {
      for (const match of read(file).matchAll(/href:\s*['"](\/[^'"]*)['"]/g)) {
        const segments = match[1].split('/').filter(Boolean);
        if (!matchesRoute(segments)) broken.push(`${rel(file)}: ${match[1]}`);
      }
    }

    expect(broken).toEqual([]);
    expect(ADMIN_SIDEBAR_MODULES.ADMIN).toEqual([
      'M01',
      'M02',
      'M03',
      'M05',
      'M06',
      'M07',
      'M08',
      'M09',
      'M10',
    ]);
  });
});
