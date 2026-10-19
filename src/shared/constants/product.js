/**
 * [SHARED] Sản phẩm, danh mục, tìm kiếm — SRS M02, M03
 */
export const PRODUCT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISCONTINUED: 'DISCONTINUED',
});

export const PRODUCT_STATUS_VALUES = Object.freeze(Object.values(PRODUCT_STATUS));

export const PRODUCT_STATUS_LABELS = Object.freeze({
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang bán',
  INACTIVE: 'Ngừng bán',
  DISCONTINUED: 'Ngừng kinh doanh',
});

export const AGE_GROUPS = Object.freeze({
  '0-12M': '0-12M',
  '1-3Y': '1-3Y',
  '3-6Y': '3-6Y',
  '6-12Y': '6-12Y',
  '12Y_PLUS': '12Y_PLUS',
});

export const AGE_GROUP_VALUES = Object.freeze(Object.values(AGE_GROUPS));

export const AGE_GROUP_LABELS = Object.freeze({
  '0-12M': '0 – 12 tháng',
  '1-3Y': '1 – 3 tuổi',
  '3-6Y': '3 – 6 tuổi',
  '6-12Y': '6 – 12 tuổi',
  '12Y_PLUS': '12 tuổi trở lên',
});

export const GENDER_TARGETS = Object.freeze({
  BOY: 'BOY',
  GIRL: 'GIRL',
  UNISEX: 'UNISEX',
});

export const GENDER_TARGET_VALUES = Object.freeze(Object.values(GENDER_TARGETS));

export const GENDER_TARGET_LABELS = Object.freeze({
  BOY: 'Bé trai',
  GIRL: 'Bé gái',
  UNISEX: 'Unisex',
});

export const SORT_OPTIONS = Object.freeze({
  relevance: 'relevance',
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  newest: 'newest',
  bestselling: 'bestselling',
  name_asc: 'name_asc',
});

export const SORT_OPTION_VALUES = Object.freeze(Object.values(SORT_OPTIONS));

export const SORT_OPTION_LABELS = Object.freeze({
  relevance: 'Phù hợp nhất',
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
  newest: 'Mới nhất',
  bestselling: 'Bán chạy',
  name_asc: 'Tên A – Z',
});
