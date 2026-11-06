'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — AdminTicketDetailModal
 * SRS: M10-F08 | API: API-M10-15, API-M10-16 | BR: BR-M10-04
 * Route: /admin/support
 * UI: CSKH xem hội thoại, nhận xử lý, đổi ưu tiên, phản hồi, giải quyết/đóng/mở lại ticket.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import TicketChatBox from './TicketChatBox.jsx';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_TONES,
  TICKET_SLA_HOURS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONES,
  formatDateTime,
  ticketActions,
} from '../display.js';
import { useGetAdminSupportTicket } from '../hooks/use-get-admin-support-ticket.js';
import { useProcessSupportTicket } from '../hooks/use-process-support-ticket.js';
import {
  EMPTY_STAFF_REPLY_FORM,
  staffReplyFormSchema,
} from '../validation/support-form.schema.js';
import { TICKET_PRIORITY_VALUES } from '@/shared/constants/support.js';
import { useToast } from '@/shared/ui/toast.jsx';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const ACTION_LABELS = Object.freeze({
  ASSIGN: 'Nhận xử lý',
  REPLY: 'Gửi phản hồi',
  RESOLVE: 'Đánh dấu đã giải quyết',
  CLOSE: 'Đóng yêu cầu',
  REOPEN: 'Mở lại yêu cầu',
});

const ACTION_VARIANTS = Object.freeze({
  ASSIGN: 'outline',
  REPLY: 'primary',
  RESOLVE: 'secondary',
  CLOSE: 'ghost',
  REOPEN: 'outline',
});

const PRIORITY_OPTIONS = TICKET_PRIORITY_VALUES.map((value) => ({
  value,
  label: TICKET_PRIORITY_LABELS[value] ?? value,
}));

function Meta({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption font-semibold uppercase tracking-wide text-slate">{label}</dt>
      <dd className="text-body-s text-ink">{children}</dd>
    </div>
  );
}

function TicketDetailBody({ id, onClose, onSaved }) {
  const toast = useToast();
  const user = useAuthStore(selectAuthUser);
  const query = useGetAdminSupportTicket({ id }, { enabled: Boolean(id) });
  const processTicket = useProcessSupportTicket();
  const [priority, setPriority] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffReplyFormSchema),
    defaultValues: { ...EMPTY_STAFF_REPLY_FORM },
  });

  const detail = query.data ?? null;
  const ticket = detail?.ticket ?? null;

  if (query.isPending) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-24 w-full" rounded="md" />
        <Skeleton className="h-56 w-full" rounded="md" />
      </div>
    );
  }

  if (query.isError || !ticket) {
    return (
      <div className="text-center">
        <p className="text-body-s text-slate">
          {query.error?.message ?? 'Không tải được chi tiết yêu cầu hỗ trợ.'}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const actions = ticketActions(ticket.status);
  const actionNames = actions.map((item) => item.action);
  const canReply = actionNames.includes('REPLY');
  const effectivePriority = priority || ticket.priority;

  async function runAction(action, extra = {}) {
    setPendingAction(action);
    try {
      await processTicket.mutateAsync({
        id: ticket.ticket_id,
        body: { action, priority: effectivePriority, ...extra },
      });
      toast.success(`${ACTION_LABELS[action] ?? action}: xong.`);
      onSaved?.();
      if (action === 'CLOSE') onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không xử lý được yêu cầu.');
    } finally {
      setPendingAction(null);
    }
  }

  async function submitReply(values) {
    setPendingAction('REPLY');
    try {
      await processTicket.mutateAsync({
        id: ticket.ticket_id,
        body: {
          action: 'REPLY',
          message: values.message.trim(),
          files: values.files,
          priority: values.priority || effectivePriority,
        },
      });
      toast.success('Đã gửi phản hồi tới khách.');
      reset({ ...EMPTY_STAFF_REPLY_FORM });
      onSaved?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không gửi được phản hồi.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-mono text-body-s font-semibold text-primary">{ticket.ticket_code}</p>
            <h3 className="mt-0.5 font-heading text-h4 text-ink">{ticket.subject}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={TICKET_STATUS_TONES[ticket.status] ?? 'neutral'}>
              {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
            </Badge>
            <Badge tone={TICKET_PRIORITY_TONES[ticket.priority] ?? 'neutral'}>
              {TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
            </Badge>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 rounded-md border border-fog bg-white p-4 sm:grid-cols-2">
          <Meta label="Khách hàng">{ticket.customer_name ?? 'Khách vãng lai'}</Meta>
          <Meta label="Người xử lý">{ticket.assignee_name ?? 'Chưa phân công'}</Meta>
          <Meta label="Chủ đề">
            {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
          </Meta>
          <Meta label="Gửi lúc">{formatDateTime(ticket.created_at)}</Meta>
          <Meta label="Đơn hàng">{ticket.order_id ?? 'Không đính kèm'}</Meta>
          <Meta label="SLA phản hồi">{TICKET_SLA_HOURS} giờ làm việc</Meta>
        </dl>
      </div>

      <section aria-labelledby="admin-ticket-conversation">
        <h4 id="admin-ticket-conversation" className="font-heading text-h5 text-ink">
          Hội thoại
        </h4>
        <div className="mt-2 rounded-md border border-fog bg-white p-4">
          <TicketChatBox messages={detail?.conversation_messages ?? []} />
        </div>
      </section>

      {canReply ? (
        <section aria-labelledby="admin-ticket-reply" className="rounded-md border border-fog bg-white p-4">
          <h4 id="admin-ticket-reply" className="font-heading text-h5 text-ink">
            Phản hồi khách
          </h4>
          <form onSubmit={handleSubmit(submitReply)} className="mt-3 flex flex-col gap-3" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="staff-reply-message" className="text-body-s font-semibold text-ink">
                Nội dung<span className="ml-1 text-sale" aria-hidden="true">*</span>
              </label>
              <textarea
                id="staff-reply-message"
                rows={3}
                placeholder="Hướng dẫn khách hoặc thông báo kết quả kiểm tra…"
                className={TEXTAREA_CLASS}
                {...register('message')}
              />
              {errors.message?.message ? (
                <p className="text-body-s text-sale">{errors.message.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="staff-reply-files" className="text-body-s font-semibold text-ink">
                Tệp đính kèm (URL, không bắt buộc)
              </label>
              <textarea
                id="staff-reply-files"
                rows={2}
                placeholder="Mỗi dòng một URL ảnh hoặc video"
                className={TEXTAREA_CLASS}
                {...register('files')}
              />
              {errors.files?.message ? (
                <p className="text-body-s text-sale">{errors.files.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-[200px_auto] sm:items-end">
              <Select
                label="Ưu tiên"
                options={PRIORITY_OPTIONS}
                {...register('priority')}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={pendingAction === 'REPLY' && processTicket.isPending}
                  loadingLabel="Đang gửi…"
                >
                  Gửi phản hồi
                </Button>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      <section aria-labelledby="admin-ticket-actions" className="rounded-md border border-fog bg-white p-4">
        <h4 id="admin-ticket-actions" className="font-heading text-h5 text-ink">
          Xử lý yêu cầu
        </h4>
        <div className="mt-3 flex flex-col gap-3">
          <Select
            label="Mức ưu tiên"
            options={PRIORITY_OPTIONS}
            value={effectivePriority}
            onChange={(event) => setPriority(event.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {actions
              .filter((item) => item.action !== 'REPLY')
              .map((item) => {
                const isAssign = item.action === 'ASSIGN';
                const disabled = isAssign && !user?.id;
                return (
                  <Button
                    key={item.action}
                    variant={ACTION_VARIANTS[item.action] ?? 'outline'}
                    size="sm"
                    disabled={disabled}
                    loading={pendingAction === item.action && processTicket.isPending}
                    loadingLabel="Đang xử lý…"
                    onClick={() =>
                      runAction(item.action, isAssign ? { assigned_to: user?.id } : undefined)
                    }
                  >
                    {ACTION_LABELS[item.action] ?? item.label}
                  </Button>
                );
              })}
            {actions.length === 0 ? (
              <p className="text-body-s text-slate">
                Yêu cầu đã đóng — không còn hành động khả dụng (BR-M10-04).
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * @param {{ open?: boolean, ticketId?: string | null, onClose?: () => void, onSaved?: () => void }} props
 */
export default function AdminTicketDetailModal({ open = false, ticketId = null, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Chi tiết yêu cầu hỗ trợ"
      description="Tiếp nhận, phản hồi và cập nhật trạng thái ticket (M10-F08)."
    >
      {open && ticketId ? (
        <TicketDetailBody key={ticketId} id={ticketId} onClose={onClose} onSaved={onSaved} />
      ) : null}
    </Modal>
  );
}
