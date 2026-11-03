'use client';

/**
 * [TOY-M06] Yêu cầu đổi trả (Admin) — bảng duyệt và cập nhật trạng thái RMA.
 * SRS: M06-F11, M06-F12 | API: API-M06-07, API-M06-08, API-M06-10
 * Route: /admin/shipping
 */
import { useState } from 'react';
import { cn } from '@/shared/utils/cn.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { RETURN_STATUS, RETURN_STATUS_LABELS } from '@/shared/constants/support.js';
import { useApproveReturnRequest } from '../hooks/use-approve-return-request.js';
import { useListReturnRequests } from '../hooks/use-list-return-requests.js';
import { useUpdateReturnStatus } from '../hooks/use-update-return-status.js';
import { RETURN_STATUS_OPTIONS, RETURN_STATUS_TONES } from '../constants.js';
import { formatDateTime } from '../utils/datetime.js';

const APPROVER_ROLES = ['ADMIN', 'STAFF'];
const STATUS_UPDATE_ROLES = ['ADMIN', 'STAFF', 'WAREHOUSE_KEEPER'];
const DEFAULT_LIMIT = 10;

const ACTION_META = {
  APPROVE: {
    title: 'Duyệt yêu cầu đổi trả',
    description: 'Đơn hàng sẽ chuyển sang "Đang hoàn hàng". Khách được thông báo qua email.',
    submitLabel: 'Duyệt yêu cầu',
    requireNote: false,
  },
  REJECT: {
    title: 'Từ chối yêu cầu đổi trả',
    description: 'Khách sẽ nhận thông báo từ chối kèm lý do bên dưới.',
    submitLabel: 'Từ chối',
    requireNote: true,
  },
  RECEIVED: {
    title: 'Ghi nhận đã nhận hàng hoàn',
    description: 'Hàng hoàn sẽ được nhập lại kho mặc định qua M08.',
    submitLabel: 'Đã nhận hàng',
    requireNote: false,
  },
  REFUNDED: {
    title: 'Xác nhận đã hoàn tiền',
    description: 'Hệ thống ghi nhận hoàn tiền nội bộ và chuyển đơn sang "Đã hoàn hàng".',
    submitLabel: 'Xác nhận hoàn tiền',
    requireNote: false,
  },
  CANCELLED: {
    title: 'Hủy yêu cầu đổi trả',
    description: 'Yêu cầu bị hủy, đơn hàng giữ nguyên trạng thái hiện tại.',
    submitLabel: 'Hủy yêu cầu',
    requireNote: false,
  },
};

/**
 * @param {{ className?: string }} props
 */
export default function ReturnRequestTable({ className }) {
  const toast = useToast();
  const user = useAuthStore(selectAuthUser);
  const [filters, setFilters] = useState({ page: 1, status: '' });
  const [actionState, setActionState] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');

  const canApprove = APPROVER_ROLES.includes(user?.role);
  const canUpdate = STATUS_UPDATE_ROLES.includes(user?.role);

  const queryVariables = { page: filters.page, limit: DEFAULT_LIMIT };
  if (filters.status) queryVariables.status = filters.status;

  const query = useListReturnRequests(queryVariables);
  const approveMutation = useApproveReturnRequest();
  const updateMutation = useUpdateReturnStatus();

  const data = query.data ?? null;
  const requests = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, total_pages: 1, total: 0 };
  const submitting = approveMutation.isPending || updateMutation.isPending;

  function openAction(request, action) {
    setActionState({ request, action });
    setNote('');
    setNoteError('');
  }

  function closeAction() {
    if (submitting) return;
    setActionState(null);
    setNote('');
    setNoteError('');
  }

  async function submitAction() {
    if (!actionState) return;
    const { request, action } = actionState;
    const trimmed = note.trim();
    const meta = ACTION_META[action];

    if (meta.requireNote && trimmed.length < 5) {
      setNoteError('Vui lòng nhập lý do ít nhất 5 ký tự.');
      return;
    }

    try {
      let result;
      if (action === 'APPROVE' || action === 'REJECT') {
        result = await approveMutation.mutateAsync({
          id: request.return_request_id,
          body: { action, note: trimmed || undefined },
        });
      } else {
        result = await updateMutation.mutateAsync({
          id: request.return_request_id,
          body: { status: action, note: trimmed || undefined },
        });
      }

      toast.success(
        `Đã cập nhật ${request.return_code}: ${
          result?.status_label ?? RETURN_STATUS_LABELS[action] ?? action
        }.`,
      );
      setActionState(null);
      setNote('');
      setNoteError('');
      await query.refetch();
    } catch (error) {
      toast.error(error?.message ?? 'Không thể cập nhật yêu cầu đổi trả.');
    }
  }

  function renderActions(request) {
    const busy = submitting;
    const buttons = [];

    if (request.status === RETURN_STATUS.PENDING_APPROVAL && canApprove) {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          onClick={() => openAction(request, 'APPROVE')}
          disabled={busy}
        >
          Duyệt
        </Button>,
        <Button
          key="reject"
          size="sm"
          variant="outline"
          onClick={() => openAction(request, 'REJECT')}
          disabled={busy}
        >
          Từ chối
        </Button>,
      );
    }

    if (request.status === RETURN_STATUS.APPROVED && canUpdate) {
      buttons.push(
        <Button
          key="received"
          size="sm"
          onClick={() => openAction(request, 'RECEIVED')}
          disabled={busy}
        >
          Đã nhận hàng
        </Button>,
      );
    }

    if (request.status === RETURN_STATUS.RECEIVED && canUpdate) {
      buttons.push(
        <Button
          key="refunded"
          size="sm"
          onClick={() => openAction(request, 'REFUNDED')}
          disabled={busy}
        >
          Hoàn tiền
        </Button>,
      );
    }

    if (request.status === RETURN_STATUS.PENDING_APPROVAL && canUpdate) {
      buttons.push(
        <Button
          key="cancel"
          size="sm"
          variant="ghost"
          onClick={() => openAction(request, 'CANCELLED')}
          disabled={busy}
        >
          Hủy
        </Button>,
      );
    }

    if (buttons.length === 0) {
      return <span className="text-caption text-slate">—</span>;
    }

    return <div className="flex flex-wrap justify-end gap-2">{buttons}</div>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-h4 text-ink">Yêu cầu đổi trả</h2>
          <p className="mt-1 text-body-s text-slate">
            {pagination.total ?? 0} yêu cầu · duyệt trong 7 ngày theo BR-M06-05.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            id="return-status-filter"
            label="Lọc trạng thái"
            placeholder="Tất cả trạng thái"
            options={RETURN_STATUS_OPTIONS}
            value={filters.status}
            onChange={(event) =>
              setFilters({ page: 1, status: event.target.value })
            }
            disabled={query.isFetching}
          />
        </div>
      </div>

      {query.isError ? (
        <div className="rounded-md border border-sale/30 bg-sale/5 px-4 py-4">
          <p className="text-body-s font-semibold text-sale">Không tải được yêu cầu đổi trả</p>
          <p className="mt-1 text-body-s text-slate">
            {query.error?.message ?? 'Vui lòng thử lại sau.'}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : query.isLoading ? (
        <div className="space-y-2" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-14 w-full" rounded="sm" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="Chưa có yêu cầu đổi trả"
          description="Yêu cầu từ khách hàng sẽ xuất hiện tại đây để duyệt và nhập lại kho."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-fog bg-white">
          <table className="w-full min-w-[920px] border-collapse text-left text-body-s">
            <caption className="sr-only">Danh sách yêu cầu đổi trả</caption>
            <thead>
              <tr className="border-b border-fog bg-surface-sky/40 text-caption uppercase tracking-wide text-slate">
                <th scope="col" className="px-4 py-3">
                  Mã yêu cầu
                </th>
                <th scope="col" className="px-4 py-3">
                  Đơn hàng
                </th>
                <th scope="col" className="px-4 py-3">
                  Khách hàng
                </th>
                <th scope="col" className="px-4 py-3">
                  Lý do
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Hoàn tiền
                </th>
                <th scope="col" className="px-4 py-3">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3">
                  Gửi lúc
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.return_request_id}
                  className="border-b border-fog/70 align-top last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{request.return_code}</p>
                    <p className="text-caption text-slate">
                      {request.total_quantity ?? request.item_count} sản phẩm
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate">{request.order_code ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{request.customer?.name ?? '—'}</p>
                    <p className="text-caption text-slate">{request.customer?.phone ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate">{request.reason_label ?? request.reason}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {formatVND(request.refund_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={RETURN_STATUS_TONES[request.status] ?? 'neutral'}>
                      {request.status_label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-caption text-slate">
                    {formatDateTime(request.requested_at)}
                  </td>
                  <td className="px-4 py-3">{renderActions(request)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={pagination.page ?? 1}
        totalPages={pagination.total_pages ?? 1}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        disabled={query.isFetching}
      />

      <Modal
        open={Boolean(actionState)}
        onClose={closeAction}
        title={
          actionState
            ? `${ACTION_META[actionState.action].title} ${actionState.request.return_code}`
            : ''
        }
        description={actionState ? ACTION_META[actionState.action].description : undefined}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeAction} disabled={submitting}>
              Đóng
            </Button>
            <Button
              variant={actionState?.action === 'REJECT' ? 'danger' : 'primary'}
              onClick={submitAction}
              loading={submitting}
            >
              {actionState ? ACTION_META[actionState.action].submitLabel : 'Xác nhận'}
            </Button>
          </>
        }
      >
        {actionState ? (
          <div className="space-y-4">
            <dl className="space-y-1.5 text-body-s">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Đơn hàng</dt>
                <dd className="font-semibold text-ink">{actionState.request.order_code}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Lý do</dt>
                <dd className="text-ink">{actionState.request.reason_label}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Số tiền hoàn</dt>
                <dd className="font-semibold text-ink">
                  {formatVND(actionState.request.refund_amount)}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="return-action-note" className="text-body-s font-semibold text-ink">
                Ghi chú {ACTION_META[actionState.action].requireNote ? '(bắt buộc)' : '(không bắt buộc)'}
              </label>
              <textarea
                id="return-action-note"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  if (noteError) setNoteError('');
                }}
                rows={3}
                maxLength={500}
                disabled={submitting}
                aria-invalid={noteError ? 'true' : undefined}
                aria-describedby={noteError ? 'return-action-note-error' : undefined}
                className={cn(
                  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40',
                  noteError && 'border-sale focus:border-sale focus:ring-sale/20',
                )}
                placeholder="VD: Hàng hoàn đủ điều kiện, đã kiểm tra."
              />
              {noteError ? (
                <p id="return-action-note-error" className="text-body-s text-sale">
                  {noteError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
