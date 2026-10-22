'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { changePassword } from '../services/account.api.js';

const schema = z
  .object({
    current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
    new_password: z
      .string()
      .min(8, 'Mật khẩu mới tối thiểu 8 ký tự.')
      .regex(/[A-Z]/, 'Cần ít nhất một chữ hoa.')
      .regex(/[a-z]/, 'Cần ít nhất một chữ thường.')
      .regex(/[0-9]/, 'Cần ít nhất một chữ số.'),
    confirm_password: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới.'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirm_password'],
  })
  .refine((v) => v.new_password !== v.current_password, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
    path: ['new_password'],
  });

function PasswordContent() {
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: ({ current_password, new_password }) =>
      changePassword({ body: { current_password, new_password } }),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  async function onSubmit(values) {
    try {
      await mutation.mutateAsync(values);
      toast.success('Đã đổi mật khẩu thành công.');
      reset();
    } catch (err) {
      if (err.code === 'WRONG_PASSWORD') {
        setError('current_password', { message: err.message });
      } else if (err.code === 'SAME_PASSWORD') {
        setError('new_password', { message: err.message });
      }
    }
  }

  const serverMessage =
    mutation.error && !['WRONG_PASSWORD', 'SAME_PASSWORD'].includes(mutation.error.code)
      ? mutation.error.message
      : null;

  return (
    <div className="kaido-container py-10">
      <h1 className="mb-2 text-2xl font-bold">Bảo mật tài khoản</h1>
      <p className="mb-6 text-body-s text-slate">Đổi mật khẩu đăng nhập của bạn.</p>

      {serverMessage && (
        <p role="alert" className="mb-4 text-body-s text-sale">
          {serverMessage}
        </p>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
        <Input
          label="Mật khẩu hiện tại"
          type="password"
          autoComplete="current-password"
          required
          error={errors.current_password?.message}
          {...register('current_password')}
        />
        <Input
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          hint="Tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số."
          required
          error={errors.new_password?.message}
          {...register('new_password')}
        />
        <Input
          label="Nhập lại mật khẩu mới"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" loading={isSubmitting || mutation.isPending} className="w-full">
          Đổi mật khẩu
        </Button>
      </form>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <PasswordContent />
    </ProtectedRoute>
  );
}