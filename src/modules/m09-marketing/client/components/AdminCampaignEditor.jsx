'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminCampaignEditor
 * SRS: M09-F03, M09-F05 | API: API-M09-16..20 | BR: BR-M09-01, BR-M09-05
 * Route: /admin/marketing/campaigns
 * UI: Modal biên tập chiến dịch — thông tin, khung giờ, banner và danh sách SKU flash sale.
 * SKU được chọn qua PLP công khai của M02 (API-M02-02); server M09 kiểm tra lại giá/trạng thái.
 * Form nằm trong component con chỉ mount khi mở modal để mỗi lần mở là một phiên nhập mới.
 */
import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import Spinner from '@/shared/ui/spinner.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { formatVND } from '@/shared/utils/formatVND.js';
import {
  BANNER_POSITION_LABELS,
  CAMPAIGN_TYPE_LABELS,
  fromDateTimeInput,
  toDateTimeInput,
} from '../display.js';
import { useCreateCampaign } from '../hooks/use-create-campaign.js';
import { useGetAdminCampaign } from '../hooks/use-get-admin-campaign.js';
import { useListAdminBanners } from '../hooks/use-list-admin-banners.js';
import { useSearchCatalogProducts } from '../hooks/use-search-catalog-products.js';
import { useUpdateCampaign } from '../hooks/use-update-campaign.js';
import {
  EMPTY_CAMPAIGN_FORM,
  MAX_CAMPAIGN_ITEMS,
  campaignFormSchema,
} from '../validation/campaign-form.schema.js';

const TYPE_OPTIONS = Object.entries(CAMPAIGN_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function toFormValues(campaign) {
  if (!campaign?.id) {
    return { ...EMPTY_CAMPAIGN_FORM, items: [] };
  }
  return {
    name: campaign.name ?? '',
    campaign_type: campaign.campaign_type ?? 'FLASH_SALE',
    description: campaign.description ?? '',
    starts_at: toDateTimeInput(campaign.starts_at ?? campaign.start_date),
    ends_at: toDateTimeInput(campaign.ends_at ?? campaign.end_date),
    banner_id: campaign.banner_id ?? '',
    items: (campaign.items ?? []).map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      product_name: item.product?.name ?? 'Sản phẩm',
      price_regular: Number(item.product?.price_regular ?? 0),
      sale_price: item.sale_price,
      quantity_limit: item.quantity_limit == null ? '' : String(item.quantity_limit),
    })),
  };
}

/** Giá flash sale gợi ý: 85% giá đang bán, làm tròn 1.000đ. */
function suggestSalePrice(product) {
  const base = Number(product.price_sale ?? product.price ?? product.price_regular) || 0;
  if (base <= 0) return '';
  return Math.max(1000, Math.round((base * 0.85) / 1000) * 1000);
}

function CampaignFormBody({ campaign, onClose, onSaved }) {
  const toast = useToast();
  const [term, setTerm] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: toFormValues(campaign),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' });
  const selectedIds = new Set((watchedItems ?? []).map((item) => item.product_id));

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const saving = createCampaign.isPending || updateCampaign.isPending;

  const { data: bannerData } = useListAdminBanners({ limit: 100 });
  const { data: searchData, isFetching: searching } = useSearchCatalogProducts(term);

  const bannerOptions = useMemo(
    () =>
      (bannerData?.items ?? []).map((banner) => ({
        value: banner.id,
        label: `${banner.title} · ${BANNER_POSITION_LABELS[banner.position] ?? banner.position}`,
      })),
    [bannerData],
  );

  const searchResults = searchData?.items ?? [];

  function handleAddProduct(product) {
    if (selectedIds.has(product.id) || fields.length >= MAX_CAMPAIGN_ITEMS) return;
    append({
      product_id: product.id,
      variant_id: null,
      product_name: product.name,
      price_regular: Number(product.price_regular ?? 0),
      sale_price: suggestSalePrice(product),
      quantity_limit: '',
    });
    setTerm('');
  }

  async function onSubmit(values) {
    const payload = {
      name: values.name.trim(),
      campaign_type: values.campaign_type,
      description: values.description?.trim() ? values.description.trim() : null,
      starts_at: fromDateTimeInput(values.starts_at),
      ends_at: fromDateTimeInput(values.ends_at),
      banner_id: values.banner_id || null,
      items: (values.items ?? []).map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        sale_price: Number(item.sale_price),
        quantity_limit: item.quantity_limit ? Number(item.quantity_limit) : null,
      })),
    };

    try {
      if (campaign?.id) {
        await updateCampaign.mutateAsync({ id: campaign.id, body: payload });
        toast.success('Đã cập nhật chiến dịch.');
      } else {
        await createCampaign.mutateAsync({ body: payload });
        toast.success('Đã tạo chiến dịch mới.');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      const detail = Array.isArray(error?.details) ? error.details[0]?.message : null;
      toast.error(detail ?? error?.message ?? 'Không lưu được chiến dịch.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Tên chiến dịch"
        required
        error={errors.name?.message}
        placeholder="Ví dụ: Flash sale Trung Thu 2026"
        {...register('name')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Loại chiến dịch"
          options={TYPE_OPTIONS}
          error={errors.campaign_type?.message}
          {...register('campaign_type')}
        />
        <Select
          label="Banner hiển thị"
          placeholder="Không gắn banner"
          options={bannerOptions}
          error={errors.banner_id?.message}
          {...register('banner_id')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="m09-campaign-description" className="text-body-s font-semibold text-ink">
          Mô tả
        </label>
        <textarea
          id="m09-campaign-description"
          rows={3}
          placeholder="Thông điệp chiến dịch hiển thị trên trang khuyến mãi."
          className={TEXTAREA_CLASS}
          {...register('description')}
        />
        {errors.description?.message ? (
          <p className="text-body-s text-sale">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Bắt đầu"
          type="datetime-local"
          required
          error={errors.starts_at?.message}
          {...register('starts_at')}
        />
        <Input
          label="Kết thúc"
          type="datetime-local"
          required
          error={errors.ends_at?.message}
          {...register('ends_at')}
        />
      </div>

      <fieldset className="rounded-md border border-fog p-4">
        <legend className="px-1 text-body-s font-semibold text-ink">
          Sản phẩm flash sale ({fields.length}/{MAX_CAMPAIGN_ITEMS})
        </legend>

        <Input
          label="Tìm sản phẩm"
          placeholder="Nhập tên sản phẩm (tối thiểu 2 ký tự)"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          hint="Danh sách lấy từ danh mục đang bán của KAIDO."
          autoComplete="off"
        />

        {term.trim().length >= 2 ? (
          <div className="mt-2 rounded-sm border border-fog">
            {searching ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" label="Đang tìm sản phẩm…" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="px-3 py-3 text-body-s text-slate">Không tìm thấy sản phẩm phù hợp.</p>
            ) : (
              <ul className="divide-y divide-fog">
                {searchResults.map((product) => {
                  const added = selectedIds.has(product.id);
                  return (
                    <li key={product.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-body-s font-semibold text-ink">{product.name}</p>
                        <p className="text-caption text-slate">
                          Niêm yết {formatVND(product.price_regular)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={added ? 'outline' : 'primary'}
                        disabled={added || fields.length >= MAX_CAMPAIGN_ITEMS}
                        onClick={() => handleAddProduct(product)}
                        aria-label={`Thêm ${product.name} vào chiến dịch`}
                      >
                        {added ? 'Đã thêm' : 'Thêm'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {fields.length === 0 ? (
          <p className="mt-3 rounded-sm border border-dashed border-fog px-3 py-4 text-center text-body-s text-slate">
            Chiến dịch chưa có SKU nào. Bạn có thể lưu trước và bổ sung sản phẩm sau.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {fields.map((field, index) => (
              <li key={field.id} className="rounded-sm border border-fog p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-body-s font-semibold text-ink">
                      {field.product_name || 'Sản phẩm'}
                    </p>
                    <p className="text-caption text-slate">
                      Giá niêm yết {formatVND(field.price_regular)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    aria-label={`Xóa ${field.product_name || 'sản phẩm'} khỏi chiến dịch`}
                  >
                    Xóa
                  </Button>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input
                    label="Giá flash sale (đ)"
                    type="number"
                    min="1"
                    step="1000"
                    required
                    error={errors.items?.[index]?.sale_price?.message}
                    {...register(`items.${index}.sale_price`)}
                  />
                  <Input
                    label="Giới hạn số lượng"
                    type="number"
                    min="1"
                    hint="Để trống nếu không giới hạn"
                    error={errors.items?.[index]?.quantity_limit?.message}
                    {...register(`items.${index}.quantity_limit`)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {errors.items?.message ? (
          <p className="mt-2 text-body-s text-sale">{errors.items.message}</p>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
          {campaign?.id ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminCampaignEditor({
  open = false,
  campaignId = null,
  onClose,
  onSaved,
}) {
  const detail = useGetAdminCampaign(open ? campaignId : null);
  const editing = Boolean(campaignId);
  const campaign = editing ? detail.data : null;

  let body = null;
  if (open) {
    if (editing && detail.isPending) {
      body = (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    } else if (editing && detail.isError) {
      body = (
        <div className="py-6 text-center">
          <p className="text-body-s text-slate">
            {detail.error?.message ?? 'Không tải được chiến dịch.'}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => detail.refetch()}>
            Thử lại
          </Button>
        </div>
      );
    } else {
      body = (
        <CampaignFormBody
          key={campaignId ?? 'new'}
          campaign={campaign}
          onClose={onClose}
          onSaved={onSaved}
        />
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Biên tập chiến dịch' : 'Tạo chiến dịch mới'}
      description="Chiến dịch tự bật/tắt theo khung giờ; tối đa 50 SKU mỗi chiến dịch."
    >
      {body}
    </Modal>
  );
}
