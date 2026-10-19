#!/usr/bin/env node
/**
 * Kiểm tra khung module và hợp đồng route ↔ registry.
 *
 * 1. Đủ 10 module trong MODULES, đúng thư mục.
 * 2. Mỗi module có README + skeleton server/client bắt buộc.
 * 3. README chứa mã SRS (TOY-Mxx).
 * 4. Mọi endpoint chính trong registry có route.js và export đúng method.
 * 5. Mọi endpoint alias trỏ tới endpoint tồn tại.
 *
 * Chạy: npm run check:modules — thoát mã 1 nếu thiếu.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  API_ENDPOINT_BY_CODE,
  API_ENDPOINT_COUNT,
  API_ENDPOINTS,
  PRIMARY_API_ENDPOINTS,
} from '../src/shared/api-endpoints.js';
import { MODULES } from '../src/shared/constants/modules.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const REQUIRED_FILES = [
  'README.md',
  'public.client.js',
  'public.server.js',
  'server/constants.js',
  'server/handlers.js',
  'server/repository.js',
  'server/service.js',
  'server/validation.js',
  'server/__tests__/module.test.js',
];

const REQUIRED_NON_EMPTY_DIRS = [
  'client/components',
  'client/hooks',
  'client/pages',
  'client/services',
];

function display(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function listFiles(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

function routeFileFor(apiPath) {
  const segments = apiPath.split('/').filter(Boolean);
  return path.join(ROOT, 'src', 'app', ...segments, 'route.js');
}

function checkAliases() {
  for (const endpoint of API_ENDPOINTS) {
    if (!endpoint.aliasOf) continue;
    const target = API_ENDPOINT_BY_CODE[endpoint.aliasOf];
    if (!target) {
      errors.push(`${endpoint.code}: aliasOf "${endpoint.aliasOf}" không tồn tại trong registry.`);
    }
  }
}

async function checkModules() {
  const moduleCodes = Object.keys(MODULES);
  if (moduleCodes.length !== 10) {
    errors.push(`MODULES phải có đúng 10 module, hiện có ${moduleCodes.length}.`);
  }

  for (const [code, module] of Object.entries(MODULES)) {
    const moduleDir = path.join(ROOT, 'src', 'modules', module.folder);
    if (!(await isFile(path.join(moduleDir, 'README.md')))) {
      errors.push(`[${code}] thiếu README.md trong ${display(moduleDir)}.`);
      continue;
    }

    const readme = await readFile(path.join(moduleDir, 'README.md'), 'utf8');
    if (!readme.includes(`TOY-${code}`)) {
      errors.push(`[${code}] README không chứa mã SRS "TOY-${code}".`);
    }

    for (const relative of REQUIRED_FILES) {
      const filePath = path.join(moduleDir, relative);
      if (!(await isFile(filePath))) {
        errors.push(`[${code}] thiếu ${display(filePath)}.`);
      }
    }

    for (const relative of REQUIRED_NON_EMPTY_DIRS) {
      const files = await listFiles(path.join(moduleDir, relative));
      if (files.length === 0) {
        errors.push(`[${code}] thư mục ${module.folder}/${relative} rỗng hoặc không tồn tại.`);
      }
    }
  }
}

async function checkRoutes() {
  const groups = new Map();
  for (const endpoint of PRIMARY_API_ENDPOINTS) {
    if (endpoint.aliasOf) continue;
    if (!groups.has(endpoint.path)) groups.set(endpoint.path, []);
    groups.get(endpoint.path).push(endpoint);
  }

  for (const [apiPath, endpoints] of groups) {
    const filePath = routeFileFor(apiPath);
    if (!(await isFile(filePath))) {
      errors.push(
        `Thiếu route cho ${apiPath}: ${display(filePath)} (${endpoints
          .map((endpoint) => endpoint.code)
          .join(', ')}).`,
      );
      continue;
    }

    const content = await readFile(filePath, 'utf8');
    if (!content.includes('withApi')) {
      errors.push(`${display(filePath)} không dùng withApi.`);
    }
    for (const endpoint of endpoints) {
      if (!content.includes(`'${endpoint.code}'`)) {
        errors.push(`${display(filePath)} thiếu endpoint ${endpoint.code}.`);
      }
      if (!content.includes(`export const ${endpoint.method} `)) {
        errors.push(
          `${display(filePath)} thiếu export method ${endpoint.method} cho ${endpoint.code}.`,
        );
      }
    }
  }

  return groups.size;
}

async function main() {
  await checkModules();
  checkAliases();
  const routeCount = await checkRoutes();

  const aliasCount = API_ENDPOINT_COUNT - PRIMARY_API_ENDPOINTS.length;
  const summary =
    `${Object.keys(MODULES).length} module · ${routeCount} file route · ` +
    `${PRIMARY_API_ENDPOINTS.length} endpoint chính · ${aliasCount} alias · ` +
    `${API_ENDPOINT_COUNT} endpoint registry`;

  if (errors.length > 0) {
    console.error(`check:modules — ${errors.length} lỗi (${summary})`);
    for (const error of errors) console.error(`  ✖ ${error}`);
    process.exitCode = 1;
    return;
  }

  console.info(`check:modules — OK (${summary})`);
}

main().catch((error) => {
  console.error('check:modules thất bại:', error);
  process.exitCode = 1;
});
