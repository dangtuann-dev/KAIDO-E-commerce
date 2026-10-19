/**
 * [SHARED] Spinner — trạng thái đang tải, dùng chung Button/Skeleton/list.
 */
export default function Spinner({ size = 'md', label = 'Đang tải…', className }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-9 w-9 border-[3px]',
  };

  return (
    <span role="status" className={`inline-flex items-center justify-center ${className ?? ''}`}>
      <span
        aria-hidden="true"
        className={`animate-spin rounded-full border-current border-r-transparent ${sizes[size] ?? sizes.md}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
