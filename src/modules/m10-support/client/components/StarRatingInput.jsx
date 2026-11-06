/**
 * [TOY-M10] Hỗ trợ và đánh giá — StarRatingInput
 * SRS: M10-F01, M10-F02 | API: API-M10-02, API-M10-08
 * UI: Chọn 1–5 sao bằng radio (bàn phím + trình đọc màn hình), dùng trong form đánh giá.
 */
const STARS = [1, 2, 3, 4, 5];

/**
 * @param {{
 *   value?: number,
 *   onChange?: (value: number) => void,
 *   name?: string,
 *   error?: string,
 *   disabled?: boolean,
 * }} props
 */
export default function StarRatingInput({
  value = 5,
  onChange,
  name = 'rating',
  error,
  disabled = false,
}) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-1.5">
      <legend className="text-body-s font-semibold text-ink">
        Chấm điểm<span className="ml-1 text-sale" aria-hidden="true">*</span>
      </legend>
      <div className="flex items-center gap-1.5">
        {STARS.map((star) => {
          const checked = Number(value) === star;
          return (
            <label
              key={star}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-sm focus-within:ring-2 focus-within:ring-primary/40"
            >
              <input
                type="radio"
                name={name}
                value={star}
                checked={checked}
                onChange={() => onChange?.(star)}
                className="sr-only"
                aria-label={`${star} sao`}
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className={checked ? 'h-7 w-7 text-accent-active' : 'h-7 w-7 text-mist'}
                fill={checked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              >
                <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85Z" />
              </svg>
            </label>
          );
        })}
        <span className="ml-1 text-body-s text-slate">{Number(value) || 0}/5</span>
      </div>
      {error ? <p className="text-body-s text-sale">{error}</p> : null}
    </fieldset>
  );
}
