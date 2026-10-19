import 'server-only';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import {
  AGE_GROUP_VALUES,
  GENDER_TARGET_VALUES,
  SORT_OPTION_VALUES,
} from '@/shared/constants/product.js';

export const MODULE_CODE = 'TOY-M03';

export const SEARCH_FACETS = Object.freeze([
  'category',
  'brand',
  'price',
  'age_group',
  'gender',
  'in_stock',
  'on_sale',
]);

export const SEARCH_AGE_GROUPS = Object.freeze(AGE_GROUP_VALUES);
export const SEARCH_GENDERS = Object.freeze(GENDER_TARGET_VALUES);
export const SEARCH_SORTS = Object.freeze(SORT_OPTION_VALUES);

export const AUTOCOMPLETE_CONFIG = Object.freeze({
  minChars: BUSINESS_RULES.CATALOG.AUTOCOMPLETE_MIN_CHARS,
  maxResults: BUSINESS_RULES.CATALOG.AUTOCOMPLETE_MAX_RESULTS,
  debounceMs: BUSINESS_RULES.CATALOG.AUTOCOMPLETE_DEBOUNCE_MS,
});

export const MAX_SEARCH_KEYWORD_LENGTH = BUSINESS_RULES.CATALOG.MAX_SEARCH_KEYWORD_LENGTH;
