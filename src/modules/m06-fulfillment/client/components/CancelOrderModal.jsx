'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — CancelOrderModal
 * SRS: M06-F02 | API: API-M06-05 | BR: BR-M05-04, BR-M06-02
 * Route: /account/orders/[orderRef]
 * UI: Nút hủy + modal xác nhận kèm lý do; chỉ hiện khi khách còn được hủy đơn.
 */
import { useState } from 'react';
import { cn } from '@/shared/utils/cn.js';
import Button from '@/shared/ui/button.jsx';
import Modal from '@/shared/ui/modal.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { CUSTOMER_CANCELLABLE_STATUSES } from '@/shared/constants/order-status.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { useCancelOrderFromFulfillment } from '../hooks/use-cancel-order-from-fulfillment.js';

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

/**
 * @param {{
 *   orderRef: string,
 *   orderCode?: string,
 *   status?: string,
 *   isPaid?: boolean,
 *   onCancelled?: (result: object) => void,
 *   className?: string,
 * }} props
 */
export default function CancelOrderModal({
  orderRef,
  orderCode,
  status,
  isPaid = false,
  onCancelled,
  className,
}) {
  const toast = useToast();
  const mutation = useCancelOrderFromFulfillment();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!CUSTOMER_CANCELLABLE_STATUSES.includes(status)) return null;

  function close() {
    if (mutation.isPending) return;
    setOpen(false);
    setError('');
  }

  async function submit() {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LENGTH) {
      setError(`Vui lòng nhập lý do hủy ít nhất ${MIN_REASON_LENGTH} ký tự.`);
      return;
    }
    if (trimmed.length > MAX_REASON_LENGTH) {
      setError(`Lý do hủy tối đa ${MAX_REASON_LENGTH} ký tự.`);
      return;
    }

    try {
      const result = await mutation.mutateAsync({ orderRef, body: { reason: trimmed } });
      toast.success(`Đã hủy đơn ${orderCode ?? result?.order_code ?? ''}.`);
      setReason('');
      setError('');
      setOpen(false);
      onCancelled?.(result);
    } catch (mutationError) {
      if (mutationError?.code === ERROR_CODES.CONFLICT) {
        toast.error(mutationError.message ?? 'Đơn hàng không còn có thể hủy.');
        setOpen(false);
        setError('');
        onCancelled?.(null);
        return;
      }
      setError(mutationError?.message ?? 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
        disabled={mutation.isPending}
      >
        Hủy đơn hàng
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={`Hủy đơn ${orderCode ?? ''}`.trim()}
        description={
          isPaid
            ? 'Tồn kho sẽ được giải phóng ngay. Khoản thanh toán online sẽ được hoàn theo quy trình của KAIDO.'
            : 'Tồn kho sẽ được giải phóng ngay khi hủy. Thao tác này không thể hoàn tác.'
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={mutation.isPending}>
              Giữ đơn
            </Button>
            <Button variant="danger" onClick={submit} loading={mutation.isPending}>
              Xác nhận hủy
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cancel-order-reason" className="text-body-s font-semibold text-ink">
            Lý do hủy <span className="text-sale">*</span>
          </label>
          <textarea
            id="cancel-order-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError('');
            }}
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            disabled={mutation.isPending}
            placeholder="VD: Tôi muốn đổi sang sản phẩm khác."
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'cancel-order-reason-error' : undefined}
            className={cn(
              'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40',
              error && 'border-sale focus:border-sale focus:ring-sale/20',
            )}
          />
          {error ? (
            <p id="cancel-order-reason-error" className="text-body-s text-sale">
              {error}
            </p>
          ) : (
            <p className="text-caption text-slate">
              {reason.trim().length}/{MAX_REASON_LENGTH} ký tự
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
