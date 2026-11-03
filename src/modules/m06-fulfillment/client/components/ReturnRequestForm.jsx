'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — ReturnRequestForm
 * SRS: M06-F12 | API: API-M06-06 | BR: BR-M06-05, BR-M10-05
 * Route: /account/orders/[orderRef]/return
 * UI: Chọn sản phẩm, lý do, mô tả và ảnh minh chứng (URL) trong cửa sổ 7 ngày.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/utils/cn.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@/shared/constants/order-status.js';
import { useCreateReturnRequest } from '../hooks/use-create-return-request.js';
import { RETURN_REASON_OPTIONS } from '../constants.js';
import { remainingReturnDays } from '../utils/datetime.js';

const RETURN_WINDOW_DAYS = BUSINESS_RULES.SHIPPING.RETURN_WINDOW_DAYS;
const MAX_EVIDENCE_IMAGES = 5;
const MAX_NOTE_LENGTH = 1000;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * @param {{
 *   orderRef: string,
 *   order?: object | null,
 *   items?: object[],
 *   onSuccess?: (result: object) => void,
 *   className?: string,
 * }} props
 */
export default function ReturnRequestForm({ orderRef, order, items = [], onSuccess, className }) {
  const router = useRouter();
  const toast = useToast();
  const mutation = useCreateReturnRequest();

  const [selectedIds, setSelectedIds] = useState([]);
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState(['']);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  const remainingDays = useMemo(
    () => remainingReturnDays(order?.completed_at ?? order?.updated_at, RETURN_WINDOW_DAYS),
    [order?.completed_at, order?.updated_at],
  );

  const isCompleted = order?.status === ORDER_STATUS.COMPLETED;
  const canSubmitReturn = isCompleted && remainingDays > 0;

  function toggleItem(itemId, checked) {
    setSelectedIds((current) =>
      checked ? [...current, itemId] : current.filter((id) => id !== itemId),
    );
    if (errors.items) setErrors((current) => ({ ...current, items: undefined }));
  }

  function updateEvidence(index, value) {
    setEvidence((current) => current.map((item, position) => (position === index ? value : item)));
    if (errors.images) setErrors((current) => ({ ...current, images: undefined }));
  }

  function addEvidence() {
    setEvidence((current) =>
      current.length >= MAX_EVIDENCE_IMAGES ? current : [...current, ''],
    );
  }

  function removeEvidence(index) {
    setEvidence((current) => current.filter((_, position) => position !== index));
  }

  function validate() {
    const nextErrors = {};
    if (selectedIds.length === 0) nextErrors.items = 'Chọn ít nhất một sản phẩm cần đổi trả.';
    if (!reason) nextErrors.reason = 'Chọn lý do đổi trả.';

    const urls = evidence.map((value) => value.trim()).filter(Boolean);
    if (urls.length === 0) {
      nextErrors.images = 'Cần tối thiểu 1 ảnh minh chứng (liên kết URL).';
    } else if (urls.some((value) => !isHttpUrl(value))) {
      nextErrors.images = 'Mỗi liên kết ảnh phải bắt đầu bằng http:// hoặc https://.';
    }

    if (note.trim().length > MAX_NOTE_LENGTH) {
      nextErrors.note = `Mô tả tối đa ${MAX_NOTE_LENGTH} ký tự.`;
    }

    return nextErrors;
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Vui lòng kiểm tra lại thông tin yêu cầu đổi trả.');
      return;
    }

    const images = evidence.map((value) => value.trim()).filter(Boolean);

    try {
      const result = await mutation.mutateAsync({
        orderRef,
        body: {
          item_ids: selectedIds,
          reason,
          images,
          note: note.trim() || undefined,
        },
      });
      toast.success(`Đã gửi yêu cầu đổi trả ${result?.return_code ?? ''}.`.trim());
      onSuccess?.(result);
      router.push(`/account/orders/${encodeURIComponent(orderRef)}`);
    } catch (mutationError) {
      toast.error(mutationError?.message ?? 'Không thể gửi yêu cầu đổi trả.');
    }
  }

  if (!order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Đơn hàng không tồn tại hoặc bạn không có quyền truy cập."
      />
    );
  }

  if (!canSubmitReturn) {
    return (
      <div className={cn('rounded-md border border-fog bg-white p-5', className)}>
        <h2 className="font-heading text-h5 text-ink">Chưa thể yêu cầu đổi trả</h2>
        <p className="mt-2 text-body-s text-slate">
          {!isCompleted
            ? `Chỉ đơn đã hoàn thành mới được đổi trả. Đơn ${order.order_code} đang ở trạng thái "${
                ORDER_STATUS_LABELS[order.status] ?? order.status
              }".`
            : `Đã quá ${RETURN_WINDOW_DAYS} ngày kể từ khi đơn hoàn thành nên không còn trong cửa sổ đổi trả.`}
        </p>
        <p className="mt-3 text-body-s text-slate">
          Nếu cần hỗ trợ thêm, vui lòng{' '}
          <Link href="/account/support" className="kaido-link font-semibold">
            gửi ticket cho CSKH
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn('space-y-5 rounded-md border border-fog bg-white p-5', className)}
      noValidate
    >
      <div className="rounded-sm bg-surface-sky/60 px-4 py-3 text-body-s text-ink">
        Bạn còn <span className="font-semibold text-primary">{remainingDays} ngày</span> để gửi yêu cầu
        đổi trả cho đơn {order.order_code} (BR-M06-05).
      </div>

      <fieldset>
        <legend className="text-body-s font-semibold text-ink">
          Sản phẩm cần đổi trả <span className="text-sale">*</span>
        </legend>
        <div className="mt-2 divide-y divide-fog rounded-sm border border-fog">
          {items.map((item) => (
            <div key={item.order_item_id} className="px-3 py-2">
              <Checkbox
                id={`return-item-${item.order_item_id}`}
                checked={selectedIds.includes(item.order_item_id)}
                onChange={(event) => toggleItem(item.order_item_id, event.target.checked)}
                disabled={mutation.isPending}
                label={
                  <span>
                    <span className="font-semibold text-ink">{item.product_name}</span>
                    <span className="block text-caption text-slate">
                      {[item.variant_name, item.sku].filter(Boolean).join(' · ') || '—'} · SL{' '}
                      {item.quantity} · {formatVND(item.line_total)}
                    </span>
                  </span>
                }
              />
            </div>
          ))}
        </div>
        {errors.items ? <p className="mt-1 text-body-s text-sale">{errors.items}</p> : null}
      </fieldset>

      <Select
        id="return-reason"
        label="Lý do đổi trả"
        required
        placeholder="Chọn lý do"
        options={RETURN_REASON_OPTIONS}
        value={reason}
        onChange={(event) => {
          setReason(event.target.value);
          if (errors.reason) setErrors((current) => ({ ...current, reason: undefined }));
        }}
        error={errors.reason}
        disabled={mutation.isPending}
      />

      <fieldset>
        <legend className="text-body-s font-semibold text-ink">
          Ảnh minh chứng <span className="text-sale">*</span>
        </legend>
        <p className="mt-0.5 text-caption text-slate">
          Dán liên kết ảnh công khai (tối thiểu 1, tối đa {MAX_EVIDENCE_IMAGES}). Hệ thống chưa hỗ trợ
          tải tệp trực tiếp.
        </p>
        <div className="mt-2 space-y-2">
          {evidence.map((value, index) => (
            <div key={index} className="flex items-end gap-2">
              <Input
                id={`return-evidence-${index}`}
                label={`Ảnh minh chứng ${index + 1}`}
                type="url"
                placeholder="https://..."
                value={value}
                onChange={(event) => updateEvidence(index, event.target.value)}
                disabled={mutation.isPending}
                containerClassName="flex-1"
              />
              {evidence.length > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEvidence(index)}
                  disabled={mutation.isPending}
                  aria-label={`Xóa ảnh minh chứng ${index + 1}`}
                >
                  Xóa
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        {errors.images ? <p className="mt-1 text-body-s text-sale">{errors.images}</p> : null}
        {evidence.length < MAX_EVIDENCE_IMAGES ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={addEvidence}
            disabled={mutation.isPending}
          >
            Thêm ảnh
          </Button>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="return-note" className="text-body-s font-semibold text-ink">
          Mô tả thêm (không bắt buộc)
        </label>
        <textarea
          id="return-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          maxLength={MAX_NOTE_LENGTH}
          disabled={mutation.isPending}
          placeholder="Mô tả tình trạng sản phẩm, thời điểm phát hiện lỗi…"
          aria-invalid={errors.note ? 'true' : undefined}
          aria-describedby={errors.note ? 'return-note-error' : undefined}
          className={cn(
            'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40',
            errors.note && 'border-sale focus:border-sale focus:ring-sale/20',
          )}
        />
        {errors.note ? (
          <p id="return-note-error" className="text-body-s text-sale">
            {errors.note}
          </p>
        ) : (
          <p className="text-caption text-slate">
            {note.trim().length}/{MAX_NOTE_LENGTH} ký tự
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/account/orders/${encodeURIComponent(orderRef)}`)}
          disabled={mutation.isPending}
        >
          Quay lại
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Gửi yêu cầu đổi trả
        </Button>
      </div>
    </form>
  );
}
