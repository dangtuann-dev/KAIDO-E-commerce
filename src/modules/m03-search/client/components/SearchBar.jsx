'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — SearchBar
 * SRS: M03-F01, M03-F02, API-M03-01, API-M03-02
 * Route: Toàn site — Header; /search
 * UI: Ô tìm kiếm; autocomplete từ 2 ký tự, tối đa 8 gợi ý, debounce 300ms.
 */
import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value.js';
import { cn } from '@/shared/utils/cn.js';
import { useAutocompleteKeyword } from '../hooks/use-autocomplete-keyword.js';

const TYPE_LABELS = {
  product: 'Sản phẩm',
  category: 'Danh mục',
  brand: 'Thương hiệu',
  keyword: 'Từ khóa',
};

function normalizeSuggestions(data) {
  const items = Array.isArray(data?.suggestions)
    ? data.suggestions
    : Array.isArray(data)
      ? data
      : [];

  return items
    .map((item) =>
      typeof item === 'string'
        ? { text: item, type: 'keyword' }
        : { text: item?.text ?? item?.keyword ?? '', type: item?.type ?? 'keyword' },
    )
    .filter((item) => item.text)
    .slice(0, BUSINESS_RULES.CATALOG.AUTOCOMPLETE_MAX_RESULTS);
}

export default function SearchBar({
  id = 'site-search',
  className,
  inputClassName,
  placeholder = 'Tìm đồ chơi cho bé…',
  defaultValue = '',
  onNavigate,
}) {
  const router = useRouter();
  const inputRef = useRef(null);
  const listboxId = useId();
  const [keyword, setKeyword] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedKeyword = useDebouncedValue(
    keyword,
    BUSINESS_RULES.CATALOG.AUTOCOMPLETE_DEBOUNCE_MS,
  );
  const normalizedKeyword = debouncedKeyword.trim();
  const canSuggest = normalizedKeyword.length >= BUSINESS_RULES.CATALOG.AUTOCOMPLETE_MIN_CHARS;

  const { data, isFetching } = useAutocompleteKeyword(
    { query: { keyword: normalizedKeyword } },
    { enabled: canSuggest, retry: false, staleTime: 60_000 },
  );

  const suggestions = normalizeSuggestions(data);
  const showSuggestions = focused && canSuggest && suggestions.length > 0;

  function submitTerm(term) {
    const value = term.trim();
    if (!value) return;
    setKeyword(value);
    setFocused(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    router.push(`/search?keyword=${encodeURIComponent(value)}`);
    onNavigate?.();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      submitTerm(suggestions[activeIndex].text);
      return;
    }
    submitTerm(keyword);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      if (!showSuggestions) return;
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (!showSuggestions) return;
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : (current - 1) % suggestions.length,
      );
      return;
    }

    if (event.key === 'Escape') {
      setFocused(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      submitTerm(suggestions[activeIndex].text);
    }
  }

  function clearKeyword() {
    setKeyword('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div
      className={cn('relative', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
          setActiveIndex(-1);
        }
      }}
    >
      <form action="/search" method="get" role="search" onSubmit={handleSubmit}>
        <label htmlFor={id} className="sr-only">
          Tìm kiếm sản phẩm
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            name="keyword"
            type="search"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              showSuggestions && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            aria-busy={isFetching || undefined}
            className={cn(
              'h-11 w-full rounded-full border border-fog bg-white pl-10 pr-10 text-body-s text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:appearance-none',
              inputClassName,
            )}
          />

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
            fill="none"
          >
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>

          {keyword ? (
            <button
              type="button"
              onClick={clearKeyword}
              aria-label="Xóa từ khóa"
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate transition-colors duration-250 hover:bg-fog/60 hover:text-ink"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </form>

      {showSuggestions ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Gợi ý tìm kiếm"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-fog bg-white py-1 shadow-lift"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.text}-${index}`}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => submitTerm(suggestion.text)}
              className={cn(
                'flex min-h-[40px] cursor-pointer items-center justify-between gap-3 px-4 py-2 text-body-s text-ink',
                index === activeIndex ? 'bg-surface-sky text-primary' : 'hover:bg-fog/50',
              )}
            >
              <span className="truncate">{suggestion.text}</span>
              <span className="shrink-0 text-caption text-mist">
                {TYPE_LABELS[suggestion.type] ?? TYPE_LABELS.keyword}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
