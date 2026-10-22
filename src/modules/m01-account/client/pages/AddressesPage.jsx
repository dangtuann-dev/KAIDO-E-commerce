'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import * as addressApi from '../services/addresses.api.js';

const MAX_ADDRESSES = 10;
const PHONE_PATTERN = /^(\+84|0)[35789]\d{8}$/;
const QUERY_KEY = ['account', 'addresses'];

const addressSchema = z.object({
  recipient_name: z
    .string()
    .trim()
    .min(2, 'Tên người nhận tối thiểu 2 ký tự.')
    .max(50, 'Tối đa 50 ký tự.'),
  phone: z
    .string()
    .trim()
    .refine((v) => PHONE_PATTERN.test(v.replace(/[\s.-]/g, '')), 'Số điện thoại không hợp lệ.'),
  province_name: z.string().trim().min(1, 'Vui lòng nhập tỉnh/thành phố.'),
  district_name: z.string().trim().optional(),
  ward_name: z.string().trim().min(1, 'Vui lòng nhập phường/xã.'),
  street_address: z
    .string()
    .trim()
    .min(5, 'Địa chỉ tối thiểu 5 ký tự.')
    .max(255, 'Tối đa 255 ký tự.'),
  is_default: z.boolean(),
});

function AddressForm({ initial, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipient_name: initial?.recipient_name ?? '',
      phone: initial?.phone ?? '',
      province_name: initial?.province_name ?? '',
      district_name: initial?.district_name ?? '',
      ward_name: initial?.ward_name ?? '',
      street_address: initial?.street_address ?? '',
      is_default: initial?.is_default ?? false,
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="mb-6 flex flex-col gap-4 rounded-md border border-fog p-5"
    >
      <Input label="Họ tên người nhận" required error={errors.recipient_name?.message} {...register('recipient_name')} />
      <Input label="Số điện thoại" type="tel" required error={errors.phone?.message} {...register('phone')} />
      <Input label="Tỉnh / Thành phố" required error={errors.province_name?.message} {...register('province_name')} />
      <Input label="Quận / Huyện" error={errors.district_name?.message} {...register('district_name')} />
      <Input label="Phường / Xã" required error={errors.ward_name?.message} {...register('ward_name')} />
      <Input label="Số nhà, tên đường" required error={errors.street_address?.message} {...register('street_address')} />

      <label className="flex items-center gap-2 text-body-s">
        <input type="checkbox" className="h-4 w-4 accent-primary" {...register('is_default')} />
        Đặt làm địa chỉ mặc định
      </label>

      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting}>
          Lưu địa chỉ
        </Button>
        <button type="button" onClick={onCancel} className="min-h-[44px] px-4 text-body-s font-semibold text-slate">
          Hủy
        </button>
      </div>
    </form>
  );
}

function AddressesContent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | địa chỉ đang sửa
  const [actionError, setActionError] = useState('');

  const { data: addresses = [], isPending, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => addressApi.listAddresses(),
  });

  async function run(action, successMessage) {
    setActionError('');
    try {
      await action();
      toast.success(successMessage);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      setActionError(err.message || 'Không thực hiện được. Vui lòng thử lại.');
    }
  }

  function saveAddress(values) {
    const id = editing && editing !== 'new' ? editing.id : null;
    return run(
      () =>
        id
          ? addressApi.updateAddress({ id, body: values })
          : addressApi.createAddress({ body: values }),
      id ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.',
    );
  }

  function removeAddress(address) {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    return run(() => addressApi.deleteAddress({ id: address.id }), 'Đã xóa địa chỉ.');
  }

  function makeDefault(address) {
    return run(() => addressApi.setDefaultAddress({ id: address.id }), 'Đã đặt làm mặc định.');
  }

  if (isPending) return <p className="py-10 text-center text-slate">Đang tải địa chỉ...</p>;
  if (error) return <p role="alert" className="py-10 text-center text-sale">{error.message}</p>;

  const canAdd = addresses.length < MAX_ADDRESSES && editing === null;

  return (
    <div className="kaido-container py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sổ địa chỉ</h1>
          <p className="text-body-s text-slate">
            {addresses.length}/{MAX_ADDRESSES} địa chỉ
          </p>
        </div>
        <Button type="button" disabled={!canAdd} onClick={() => setEditing('new')}>
          Thêm địa chỉ
        </Button>
      </div>

      {actionError && (
        <p role="alert" className="mb-4 text-body-s text-sale">
          {actionError}
        </p>
      )}

      {editing && (
        <AddressForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onSubmit={saveAddress}
          onCancel={() => setEditing(null)}
        />
      )}

      <ul className="flex flex-col gap-4">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-md border border-fog p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-semibold">{a.recipient_name}</span>
              <span className="text-body-s text-slate">{a.phone}</span>
              {a.is_default && (
                <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-caption font-semibold text-primary">
                  Mặc định
                </span>
              )}
            </div>
            <p className="text-body-s text-slate">
              {[a.street_address, a.ward_name, a.district_name, a.province_name]
                .filter(Boolean)
                .join(', ')}
            </p>
            <div className="mt-3 flex flex-wrap gap-5 text-body-s font-semibold">
              <button type="button" onClick={() => setEditing(a)} className="text-primary">
                Sửa
              </button>
              {!a.is_default && (
                <button type="button" onClick={() => makeDefault(a)} className="text-primary">
                  Đặt mặc định
                </button>
              )}
              <button type="button" onClick={() => removeAddress(a)} className="text-sale">
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>

      {addresses.length === 0 && editing === null && (
        <p className="py-10 text-center text-slate">Bạn chưa có địa chỉ nào.</p>
      )}
    </div>
  );
}

export default function AddressesPage() {
  return (
    <ProtectedRoute>
      <AddressesContent />
    </ProtectedRoute>
  );
}