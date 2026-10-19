'use client';

import { useEffect, useState } from 'react';

/**
 * [SHARED] Trả về giá trị sau khi người dùng ngừng thay đổi `delay` ms.
 * Dùng cho autocomplete M03-F02 (debounce 300ms) và các ô lọc.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
