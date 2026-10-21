'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, selectAuthStatus, selectAuthUser } from '@/shared/auth/auth-store.js';
import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import { getProfile, updateProfile } from '../services/account.api.js';

const PHONE_PATTERN = /^0[35789]\d{8}$/;

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự.').max(50, 'Họ tên tối đa 50 ký tự.'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, 'Số điện thoại không hợp lệ (ví dụ 0901234567).'),
  child_birthdate: z.string().optional().or(z.literal('')),
});

function ProfileContent() {
  const status = useAuthStore(selectAuthStatus);

  const { data: profile, isPending, error } = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: () => getProfile(),
    enabled: status === 'authenticated',
  });

  if (isPending) {
    return <p className="py-10 text-center text-slate">Đang tải hồ sơ...</p>;
  }

  if (error) {
    return (
      <p role="alert" className="py-10 text-center text-sale">
        {error.message || 'Không tải được hồ sơ. Vui lòng thử lại.'}
      </p>
    );
  }

  return <ProfileForm key={profile?.id} profile={profile} />;
}

function ProfileForm({ profile }) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const currentUser = useAuthStore(selectAuthUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      child_birthdate: profile?.child_birthdate ?? '',
    },
  });

    async function onSubmit(values) {
    const updated = await updateProfile({
      body: {
        full_name: values.full_name,
        phone: values.phone,
        child_birthdate: values.child_birthdate || null,
      },
    });

    // Đồng bộ auth store: header, tên chào, và mọi nơi đọc user từ store đều đổi theo
    setUser({ ...currentUser, ...updated });

    // Làm mới cache: hồ sơ và các dữ liệu liên quan tải lại từ server
    await queryClient.invalidateQueries({ queryKey: ['account'] });
  }


  return (
    <div className="kaido-container py-10">
      <h1 className="mb-6 text-2xl font-bold">Hồ sơ cá nhân</h1>

      <p className="mb-6 text-body-s text-slate">
        Email: <span className="font-semibold text-ink">{profile?.email}</span>
      </p>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
        <Input
          label="Họ và tên"
          error={errors.full_name?.message}
          required
          {...register('full_name')}
        />
        <Input
          label="Số điện thoại"
          type="tel"
          error={errors.phone?.message}
          required
          {...register('phone')}
        />
        <Input
          label="Ngày sinh của bé"
          type="date"
          error={errors.child_birthdate?.message}
          {...register('child_birthdate')}
        />

        <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="w-full">
          Lưu thay đổi
        </Button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}