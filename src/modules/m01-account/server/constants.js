import 'server-only';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { ROLES } from '@/shared/constants/roles.js';

export const MODULE_CODE = 'TOY-M01';

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
  DISABLED: 'DISABLED',
});

export const ACCOUNT_STATUS_VALUES = Object.freeze(Object.values(ACCOUNT_STATUS));

export const AUTH_PROVIDERS = Object.freeze({
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
  FACEBOOK: 'FACEBOOK',
});

export const USER_GENDERS = Object.freeze({
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
});

export const MAX_ADDRESSES_PER_USER = BUSINESS_RULES.AUTH.MAX_ADDRESSES_PER_USER;

export const LOGIN_SECURITY = Object.freeze({
  maxAttempts: BUSINESS_RULES.AUTH.MAX_LOGIN_ATTEMPTS,
  lockoutMinutes: BUSINESS_RULES.AUTH.LOCKOUT_MINUTES,
});

export const PROFILE_ROLES = Object.freeze([
  ROLES.CUSTOMER,
  ROLES.STAFF,
  ROLES.WAREHOUSE_KEEPER,
  ROLES.MARKETING,
  ROLES.ADMIN,
]);
