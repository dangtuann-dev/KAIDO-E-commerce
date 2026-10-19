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
} from '@/shared/validation/index.js';
import { ACCOUNT_STATUS_VALUES } from './constants.js';

/**
 * Zod schema theo API-M01-xx. Không chứa business logic — chỉ kiểm tra hình dạng dữ liệu.
 * TODO(M01-F04): bổ sung schema địa chỉ khi registry có API CRUD địa chỉ.
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
});
