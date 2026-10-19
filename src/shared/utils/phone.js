const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export function isValidVietnamesePhone(value) {
  return typeof value === 'string' && VN_PHONE_REGEX.test(value.trim());
}

export { VN_PHONE_REGEX };
