import 'server-only';

/**
 * [SERVER] Supabase Storage — interface + stub, gồm signed upload URL.
 * SRS: M02-F07 (tối đa 10 ảnh, nén 800x800), BR-M10-05 (5 ảnh hoặc 1 video ≤5MB)
 * Trạng thái: TODO
 * Việc cần làm: tạo signed upload URL để client tải thẳng lên bucket kaido-media,
 * không đẩy file lớn qua Route Handler (giới hạn body của Vercel Functions).
 * Owner: (xem docs/MODULES.md)
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {{ path: string, contentType?: string, upsert?: boolean }} _input
 * @returns {Promise<{ uploadUrl: string, token: string, path: string, publicUrl: string | null }>}
 */
export async function createSignedUploadUrl(_input) {
  // TODO(M02-F07): dùng supabase.storage.from(bucket).createSignedUploadUrl(path).
  throw new NotImplementedError('M02-F07', 'Cấp signed upload URL chưa được triển khai.');
}

/**
 * @param {{ path: string, expiresInSeconds?: number }} _input
 * @returns {Promise<{ signedUrl: string }>}
 */
export async function createSignedReadUrl(_input) {
  // TODO(BR-M10-05): signed URL cho tệp riêng tư của ticket/đổi trả.
  throw new NotImplementedError('BR-M10-05', 'Signed read URL chưa được triển khai.');
}

/**
 * @param {string} _path
 * @returns {Promise<{ deleted: boolean }>}
 */
export async function deleteObject(_path) {
  // TODO(M02-F07): xóa ảnh khi sản phẩm bị xóa/đổi ảnh.
  throw new NotImplementedError('M02-F07', 'Xóa tệp Storage chưa được triển khai.');
}
