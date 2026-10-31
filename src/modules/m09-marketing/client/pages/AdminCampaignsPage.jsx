'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminCampaignsPage
 * SRS: M09-F03, M09-F05, M09-F06 | API: API-M09-16..20 | BR: BR-M09-01, BR-M09-05
 * Route: /admin/marketing/campaigns
 * UI: Bảng chiến dịch back-office — khung giờ, banner, số SKU/đã bán, trạng thái;
 * biên tập trong modal và chuyển trạng thái theo đúng luồng nghiệp vụ.
 */
import { useState } from 'react';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import AdminCampaignEditor from '../components/AdminCampaignEditor.jsx';
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  STATUS_TONES,
  campaignActions,
  formatDateTime,
} from '../display.js';
import { useChangeCampaignStatus } from '../hooks/use-change-campaign-status.js';
import { useListAdminCampaigns } from '../hooks/use-list-admin-campaigns.js';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const TYPE_FILTERS = [
  { value: '', label: 'Tất cả loại' },
  ...Object.entries(CAMPAIGN_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const ACTION_SUCCESS = {
  SCHEDULE: 'Đã lên lịch chiến dịch.',
  ACTIVATE: 'Đã kích hoạt chiến dịch.',
  END: 'Đã kết thúc chiến dịch.',
  CANCEL: 'Đã hủy chiến dịch.',
  DRAFT: 'Đã chuyển chiến dịch về bản nháp.',
};

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function AdminCampaignsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState({ keyword: '', status: '', type: '', page: 1 });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [editor, setEditor] = useState({ open: false, campaignId: null });
  const [pendingCancel, setPendingCancel] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const changeStatus = useChangeCampaignStatus();
  const query = useListAdminCampaigns({
    page: filters.page,
    limit: PAGE_SIZE,
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    type: filters.type || undefined,
  });

  const items = query.data?.items ?? [];
  const totalPages = query.data?.total_pages ?? 1;

  function applyFilter(patch) {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  }

  async function runAction(campaign, action) {
    setBusyId(campaign.id);
    try {
      await changeStatus.mutateAsync({ id: campaign.id, action });
      toast.success(ACTION_SUCCESS[action] ?? 'Đã cập nhật trạng thái chiến dịch.');
      setPendingCancel(null);
    } catch (error) {
      const detail = Array.isArray(error?.details?.allowed_from)
        ? ` (cho phép từ: ${error.details.allowed_from.join(', ')})`
        : '';
      toast.error((error?.message ?? 'Không đổi được trạng thái chiến dịch.') + detail);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Chiến dịch quảng bá</h1>
          <p className="mt-1 text-body-s text-slate">
            {query.data ? `${query.data.total} chiến dịch` : 'Đang tải danh sách chiến dịch…'} ·
            Cron tự bật/kết thúc theo khung giờ (M09-F05).
          </p>
        </div>
        <Button onClick={() => setEditor({ open: true, campaignId: null })}>
          Tạo chiến dịch
        </Button>
      </div>

      <form
        className="mt-5 grid gap-3 rounded-md border border-fog bg-white p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilter({ keyword: keywordDraft.trim() });
        }}
      >
        <Input
          label="Tìm theo tên chiến dịch"
          placeholder="Ví dụ: Trung Thu"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        <Select
          label="Loại"
          options={TYPE_FILTERS}
          value={filters.type}
          onChange={(event) => applyFilter({ type: event.target.value })}
        />
        <Select
          label="Trạng thái"
          options={STATUS_FILTERS}
          value={filters.status}
          onChange={(event) => applyFilter({ status: event.target.value })}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full md:w-auto">
            Tìm
          </Button>
        </div>
      </form>

      <div className="mt-4 overflow-hidden rounded-md border border-fog bg-white">
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <div className="p-6 text-center">
            <p className="text-body-s text-slate">Không tải được danh sách chiến dịch.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Chưa có chiến dịch nào"
              description="Tạo chiến dịch flash sale để gom banner, SKU và voucher theo mùa."
              action={
                <Button onClick={() => setEditor({ open: true, campaignId: null })}>
                  Tạo chiến dịch
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-body-s">
              <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Chiến dịch
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Khung giờ
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    SKU / Đã bán
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {items.map((campaign) => (
                  <tr key={campaign.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-ink">{campaign.name}</span>
                      <span className="block text-caption text-slate">
                        {CAMPAIGN_TYPE_LABELS[campaign.campaign_type] ?? campaign.campaign_type}
                        {campaign.banner?.title ? ` · ${campaign.banner.title}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      <span className="block">{formatDateTime(campaign.starts_at)}</span>
                      <span className="block text-caption">
                        đến {formatDateTime(campaign.ends_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate">
                      <span className="block text-ink">{campaign.item_count ?? 0}</span>
                      <span className="block text-caption">{campaign.items_sold ?? 0} đã bán</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONES[campaign.status] ?? 'neutral'}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditor({ open: true, campaignId: campaign.id })}
                        >
                          Sửa
                        </Button>
                        {campaignActions(campaign.status).map((action) => (
                          <Button
                            key={action.action}
                            variant={action.variant}
                            size="sm"
                            loading={busyId === campaign.id && changeStatus.isPending}
                            onClick={() => {
                              if (action.action === 'CANCEL') {
                                setPendingCancel(campaign);
                                return;
                              }
                              runAction(campaign, action.action);
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={query.data?.page ?? filters.page}
        totalPages={totalPages}
        disabled={query.isFetching}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-5"
      />

      <AdminCampaignEditor
        open={editor.open}
        campaignId={editor.campaignId}
        onClose={() => setEditor({ open: false, campaignId: null })}
        onSaved={() => query.refetch()}
      />

      <Modal
        open={Boolean(pendingCancel)}
        onClose={() => setPendingCancel(null)}
        size="sm"
        title="Hủy chiến dịch"
        description="Chiến dịch dừng ngay và gỡ khỏi trang khuyến mãi; có thể đưa về bản nháp sau đó."
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingCancel(null)}>
              Giữ lại
            </Button>
            <Button
              variant="danger"
              loading={changeStatus.isPending && busyId === pendingCancel?.id}
              loadingLabel="Đang hủy…"
              onClick={() => pendingCancel && runAction(pendingCancel, 'CANCEL')}
            >
              Hủy chiến dịch
            </Button>
          </>
        }
      >
        <p className="text-body-s text-ink">
          Bạn có chắc muốn hủy <strong>{pendingCancel?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
