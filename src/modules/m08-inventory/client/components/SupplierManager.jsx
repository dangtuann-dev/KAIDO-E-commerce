'use client';

/**
 * [TOY-M08] SupplierManager — nhà cung cấp (M08-F12), dùng cho phiếu nhập kho.
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
import { useCreateSupplier } from '../hooks/use-create-supplier.js';
import { useListSuppliers } from '../hooks/use-list-suppliers.js';
import { useUpdateSupplier } from '../hooks/use-update-supplier.js';

const CODE_PATTERN = /^[A-Z0-9-]{2,20}$/;
const PHONE_PATTERN = /^[0-9+\s().-]{8,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SupplierForm({ initial, onSubmit, submitting, error: externalError }) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [contactName, setContactName] = useState(initial?.contact_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [taxCode, setTaxCode] = useState(initial?.tax_code ?? '');
  const [isActive, setIsActive] = useState(initial ? initial.is_active !== false : true);
  const [localError, setLocalError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    const normalizedCode = code.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalizedCode)) {
      setLocalError('Mã nhà cung cấp gồm 2–20 ký tự A–Z, 0–9 hoặc dấu gạch ngang.');
      return;
    }
    if (name.trim().length < 2) {
      setLocalError('Tên nhà cung cấp tối thiểu 2 ký tự.');
      return;
    }
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      setLocalError('Số điện thoại không hợp lệ.');
      return;
    }
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) {
      setLocalError('Email không đúng định dạng.');
      return;
    }

    await onSubmit({
      code: normalizedCode,
      name: name.trim(),
      contact_name: contactName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim().toLowerCase(),
      address: address.trim() || undefined,
      tax_code: taxCode.trim() || undefined,
      is_active: isActive,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Mã nhà cung cấp"
          required
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="NCC-001"
          maxLength={20}
        />
        <Input
          label="Tên nhà cung cấp"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={150}
        />
        <Input
          label="Người liên hệ"
          value={contactName}
          onChange={(event) => setContactName(event.target.value)}
          maxLength={100}
        />
        <Input
          label="Số điện thoại"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={20}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={150}
        />
        <Input
          label="Mã số thuế"
          value={taxCode}
          onChange={(event) => setTaxCode(event.target.value)}
          maxLength={30}
        />
      </div>
      <Input
        label="Địa chỉ"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        maxLength={255}
      />
      <Checkbox
        label="Đang hợp tác"
        checked={isActive}
        onChange={(event) => setIsActive(event.target.checked)}
      />

      {localError || externalError ? (
        <p role="alert" className="text-body-s text-sale">
          {localError || externalError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={submitting} loadingLabel="Đang lưu…">
          {initial ? 'Lưu thay đổi' : 'Tạo nhà cung cấp'}
        </Button>
      </div>
    </form>
  );
}

export default function SupplierManager({ canEdit = false }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keyword, setKeyword] = useState('');

  const { data, isPending, isError, error, refetch, isFetching } = useListSuppliers({
    query: { keyword: keyword || undefined, include_inactive: true },
  });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [serverError, setServerError] = useState('');

  const suppliers = data ?? [];

  function openCreate() {
    setEditing(null);
    setServerError('');
    setOpen(true);
  }

  function openEdit(supplier) {
    setEditing(supplier);
    setServerError('');
    setOpen(true);
  }

  async function handleSave(body) {
    setServerError('');
    try {
      if (editing?.id) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        toast.success(`Đã cập nhật ${body.name}.`);
      } else {
        await createMutation.mutateAsync({ body });
        toast.success(`Đã tạo nhà cung cấp ${body.name}.`);
      }
      setOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-12').code] });
    } catch (saveError) {
      setServerError(saveError?.message || 'Không lưu được nhà cung cấp.');
    }
  }

  return (
    <section aria-labelledby="supplier-manager-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="supplier-manager-title" className="font-heading text-h4 text-ink">
            Nhà cung cấp
          </h2>
          <p className="mt-1 text-body-s text-slate">
            Danh mục đối tác dùng khi lập phiếu nhập kho.
          </p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={openCreate}>
            Thêm nhà cung cấp
          </Button>
        ) : null}
      </div>

      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setKeyword(keywordDraft.trim());
        }}
      >
        <Input
          label="Tìm theo tên hoặc mã"
          type="search"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
          placeholder="Ví dụ: KAIDO"
          containerClassName="min-w-[240px] flex-1"
        />
        <Button type="submit" variant="outline" size="sm">
          Tìm
        </Button>
        {keyword ? (
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setKeywordDraft('');
            }}
            className="min-h-[44px] px-3 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
          >
            Xóa lọc
          </button>
        ) : null}
      </form>

      <div
        className={`mt-4 rounded-md border border-fog bg-white ${isFetching ? 'opacity-70' : ''}`}
      >
        {isPending ? (
          <div className="space-y-2 p-4" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p role="alert" className="text-body-s text-sale">
              {error?.message || 'Không tải được nhà cung cấp.'}
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
        ) : suppliers.length === 0 ? (
          <EmptyState
            className="border-0"
            title={keyword ? 'Không tìm thấy nhà cung cấp' : 'Chưa có nhà cung cấp'}
            description={
              keyword
                ? 'Thử từ khóa khác hoặc xóa bộ lọc.'
                : 'Thêm nhà cung cấp để lập phiếu nhập kho.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-body-s">
              <caption className="sr-only">Danh sách nhà cung cấp</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Mã
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Nhà cung cấp
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
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-fog last:border-b-0">
                    <td className="px-4 py-3 font-mono text-caption text-ink">{supplier.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{supplier.name}</p>
                      <p className="text-caption text-slate">{supplier.address || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      <p>{supplier.contact_name || '—'}</p>
                      <p className="text-caption">
                        {[supplier.phone, supplier.email].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={supplier.is_active ? 'success' : 'neutral'}>
                        {supplier.is_active ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                      </Badge>
                    </td>
                    {canEdit ? (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(supplier)}
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
        title={editing ? `Sửa ${editing.code}` : 'Thêm nhà cung cấp'}
        description="Mã và tên nhà cung cấp là bắt buộc."
        size="lg"
      >
        {open ? (
          <SupplierForm
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
