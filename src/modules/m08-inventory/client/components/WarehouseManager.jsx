'use client';

/**
 * [TOY-M08] WarehouseManager — danh mục kho (M08-F01).
 * Chỉ ADMIN được tạo/sửa kho; nhân viên kho chỉ xem.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useCreateWarehouse } from '../hooks/use-create-warehouse.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';
import { useUpdateWarehouse } from '../hooks/use-update-warehouse.js';

const CODE_PATTERN = /^[A-Z0-9-]{2,20}$/;
const PHONE_PATTERN = /^[0-9+\s().-]{8,20}$/;

function WarehouseForm({ initial, onSubmit, submitting, error: externalError }) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [isDefault, setIsDefault] = useState(Boolean(initial?.is_default));
  const [isActive, setIsActive] = useState(initial ? initial.is_active !== false : true);
  const [localError, setLocalError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    const normalizedCode = code.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalizedCode)) {
      setLocalError('Mã kho gồm 2–20 ký tự A–Z, 0–9 hoặc dấu gạch ngang.');
      return;
    }
    if (name.trim().length < 2) {
      setLocalError('Tên kho tối thiểu 2 ký tự.');
      return;
    }
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      setLocalError('Số điện thoại không hợp lệ.');
      return;
    }

    await onSubmit({
      code: normalizedCode,
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      is_default: isDefault,
      is_active: isActive,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Mã kho"
          required
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="KHO-HN"
          maxLength={20}
        />
        <Input
          label="Tên kho"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Kho Hà Nội"
          maxLength={100}
        />
      </div>
      <Input
        label="Địa chỉ"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        maxLength={255}
      />
      <Input
        label="Số điện thoại"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        maxLength={20}
      />
      <Checkbox
        label="Đặt làm kho mặc định"
        checked={isDefault}
        onChange={(event) => setIsDefault(event.target.checked)}
      />
      <Checkbox
        label="Đang hoạt động"
        checked={isActive}
        onChange={(event) => setIsActive(event.target.checked)}
        hint="Kho mặc định không thể bị vô hiệu hóa."
      />

      {localError || externalError ? (
        <p role="alert" className="text-body-s text-sale">
          {localError || externalError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={submitting} loadingLabel="Đang lưu…">
          {initial ? 'Lưu thay đổi' : 'Tạo kho'}
        </Button>
      </div>
    </form>
  );
}

export default function WarehouseManager({ canEdit = false }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch } = useListWarehouses({
    query: { include_inactive: true },
  });
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [serverError, setServerError] = useState('');

  const warehouses = data ?? [];

  function openCreate() {
    setEditing(null);
    setServerError('');
    setOpen(true);
  }

  function openEdit(warehouse) {
    setEditing(warehouse);
    setServerError('');
    setOpen(true);
  }

  async function handleSave(body) {
    setServerError('');
    try {
      if (editing?.id) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        toast.success(`Đã cập nhật kho ${body.code}.`);
      } else {
        await createMutation.mutateAsync({ body });
        toast.success(`Đã tạo kho ${body.code}.`);
      }
      setOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-09').code] });
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-23').code] });
    } catch (saveError) {
      setServerError(saveError?.message || 'Không lưu được kho.');
    }
  }

  return (
    <section aria-labelledby="warehouse-manager-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="warehouse-manager-title" className="font-heading text-h4 text-ink">
            Kho hàng
          </h2>
          <p className="mt-1 text-body-s text-slate">
            Quản lý kho vật lý, kho mặc định dùng để điều phối giữ tồn.
          </p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={openCreate}>
            Thêm kho
          </Button>
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-fog bg-white">
        {isPending ? (
          <div className="space-y-2 p-4" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p role="alert" className="text-body-s text-sale">
              {error?.message || 'Không tải được danh sách kho.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : warehouses.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Chưa có kho"
            description="Tạo kho đầu tiên để bắt đầu nhập hàng và giữ tồn."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-body-s">
              <caption className="sr-only">Danh sách kho</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Mã
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tên kho
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Liên hệ
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Trạng thái
                  </th>
                  {canEdit ? (
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Thao tác
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="border-b border-fog last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-caption text-ink">{warehouse.code}</span>
                        {warehouse.is_default ? <Badge tone="primary">Mặc định</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{warehouse.name}</p>
                      <p className="text-caption text-slate">{warehouse.address || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate">{warehouse.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={warehouse.is_active ? 'success' : 'neutral'}>
                        {warehouse.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </Badge>
                    </td>
                    {canEdit ? (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(warehouse)}
                          className="font-semibold text-primary"
                        >
                          Sửa
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Sửa kho ${editing.code}` : 'Thêm kho'}
        description="Mã kho và tên kho là bắt buộc."
        size="md"
      >
        {open ? (
          <WarehouseForm
            initial={editing}
            onSubmit={handleSave}
            submitting={createMutation.isPending || updateMutation.isPending}
            error={serverError}
          />
        ) : null}
      </Modal>
    </section>
  );
}
