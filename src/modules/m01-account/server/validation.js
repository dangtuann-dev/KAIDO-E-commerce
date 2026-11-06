import 'server-only';
import { z } from 'zod';
import { ROLES } from '@/shared/constants/roles.js';
import {
  emailSchema,
  fullNameSchema,
  isoDateSchema,
  paginationQuerySchema,
  passwordSchema,
  phoneSchema,
  recipientNameSchema,
  streetAddressSchema,
  uuidSchema,
} from '@/shared/validation/index.js';
import { ACCOUNT_STATUS_VALUES } from './constants.js';

/**
 * Zod schema theo API-M01-xx. Không chứa business logic — chỉ kiểm tra hình dạng dữ liệu.
 */

const loginIdentifierSchema = z.union([emailSchema, phoneSchema]);

const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: fullNameSchema,
  phone: phoneSchema.optional(),
});

const updateProfileBodySchema = z.object({
  full_name: fullNameSchema.optional(),
  phone: phoneSchema.optional(),
  child_birthdate: isoDateSchema.nullable().optional(),
  avatar_url: z.string().trim().url('URL ảnh không hợp lệ.').nullable().optional(),
});

const adminUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(Object.values(ROLES)).optional(),
  status: z.enum(ACCOUNT_STATUS_VALUES).optional(),
  search: z.string().trim().max(100, 'Từ khóa tối đa 100 ký tự.').optional(),
});

/** Chấp nhận +84/0… và khoảng trắng như form khách hàng, chuẩn hóa về 0xxxxxxxxx. */
const normalizedPhoneSchema = z
  .string()
  .trim()
  .transform((value) => {
    const digits = value.replace(/[\s.-]/g, '');
    return digits.startsWith('+84') ? `0${digits.slice(3)}` : digits;
  })
  .pipe(phoneSchema);

const addressBodySchema = z.object({
  recipient_name: recipientNameSchema,
  phone: normalizedPhoneSchema,
  province_name: z.string().trim().min(1, 'Vui lòng nhập tỉnh/thành phố.'),
  district_name: z.string().trim().nullable().optional(),
  ward_name: z.string().trim().min(1, 'Vui lòng nhập phường/xã.'),
  street_address: streetAddressSchema,
  is_default: z.boolean().optional(),
});

const addressIdParamsSchema = z.object({ id: uuidSchema });

const changePasswordBodySchema = z.object({
  current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.').max(32),
  new_password: passwordSchema,
});

export const validationSchemas = Object.freeze({
  'API-M01-01': { body: registerBodySchema },
  'API-M01-02': {
    body: z.object({
      email: loginIdentifierSchema,
      password: z.string().min(1, 'Mật khẩu là bắt buộc.').max(32),
    }),
  },
  'API-M01-03': {},
  'API-M01-04': { body: updateProfileBodySchema },
  'API-M01-05': {},
  'API-M01-06': { body: z.object({ email: emailSchema }) },
  'API-M01-07': { query: adminUsersQuerySchema },
  'API-M01-08': { body: addressBodySchema },
  'API-M01-09': { params: addressIdParamsSchema, body: addressBodySchema },
  'API-M01-10': { params: addressIdParamsSchema },
  'API-M01-11': { params: addressIdParamsSchema },
  'API-M01-12': { body: changePasswordBodySchema },
  'API-M01-13': {},
  'API-M01-14': {},
});
