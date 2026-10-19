'use client';

/**
 * [TOY-M01] Tài khoản và người dùng — AuthModal
 * SRS: M01-F01, M01-F02, API-M01-01, API-M01-02, BR-M01-02
 * Route: Toàn site — Header; /?auth=login&next=...
 * UI: Modal đăng nhập, đăng ký, quên mật khẩu; không lưu access token trong localStorage.
 */
import { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { useAuthStore } from '@/shared/auth/auth-store.js';
import Modal from '@/shared/ui/modal.jsx';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useLogin } from '../hooks/use-login.js';
import { useRegisterAccount } from '../hooks/use-register-account.js';
import { useForgotPassword } from '../hooks/use-forgot-password.js';

const MODE_PARAM = 'auth';
const NEXT_PARAM = 'next';

const MODES = {
  login: {
    label: 'Đăng nhập',
    title: 'Đăng nhập KAIDO',
    description: 'Theo dõi đơn hàng, tích điểm và nhận ưu đãi dành riêng cho gia đình bạn.',
  },
  register: {
    label: 'Đăng ký',
    title: 'Tạo tài khoản KAIDO',
    description: 'Một tài khoản cho cả nhà mua sắm đồ chơi an toàn và tiện lợi.',
  },
  forgot: {
    label: 'Quên mật khẩu',
    title: 'Khôi phục mật khẩu',
    description: 'Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.',
  },
};

const PHONE_PATTERN = /^(?:\+84|0)\d{9,10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeMode(value) {
  return value === 'register' || value === 'forgot' || value === 'login' ? value : null;
}

function FormError({ error }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-sm border border-sale/30 bg-sale/5 px-3 py-2 text-body-s text-sale"
    >
      {error.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.'}
    </p>
  );
}

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại.')
    .refine(
      (value) => EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value.replace(/[\s.-]/g, '')),
      'Email hoặc số điện thoại không hợp lệ.',
    ),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự.'),
});

const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Vui lòng nhập họ tên.').max(100, 'Họ tên quá dài.'),
    email: z.string().trim().regex(EMAIL_PATTERN, 'Email không hợp lệ.'),
    phone: z.string().trim().regex(PHONE_PATTERN, 'Số điện thoại không hợp lệ (ví dụ 0901234567).'),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự.')
      .regex(/[A-Z]/, 'Mật khẩu cần ít nhất một chữ hoa.')
      .regex(/[a-z]/, 'Mật khẩu cần ít nhất một chữ thường.')
      .regex(/[0-9]/, 'Mật khẩu cần ít nhất một chữ số.'),
    confirm_password: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirm_password'],
  });

const forgotSchema = z.object({
  email: z.string().trim().regex(EMAIL_PATTERN, 'Email không hợp lệ.'),
});

function LoginForm({ onDone, onSwitchMode }) {
  const { setSession } = useAuthStore();
  const toast = useToast();
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values) {
    try {
      const payload = await loginMutation.mutateAsync({ body: values });
      setSession({
        user: payload?.user_info ?? payload?.user ?? null,
        accessToken: payload?.access_token ?? null,
      });
      toast.success('Đăng nhập thành công. Chào mừng bạn trở lại!');
      onDone();
    } catch {
      // Lỗi hiển thị qua loginMutation.error.
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormError error={loginMutation.error} />

      <Input
        label="Email hoặc số điện thoại"
        type="text"
        autoComplete="username"
        placeholder="ban@kaido.vn hoặc 0901234567"
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <Input
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        placeholder="Nhập mật khẩu"
        error={errors.password?.message}
        required
        {...register('password')}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-mist">
          Tài khoản tạm khóa {BUSINESS_RULES.AUTH.LOCKOUT_MINUTES} phút sau{' '}
          {BUSINESS_RULES.AUTH.MAX_LOGIN_ATTEMPTS} lần nhập sai.
        </p>
        <button
          type="button"
          onClick={() => onSwitchMode('forgot')}
          className="shrink-0 text-body-s font-semibold text-primary hover:text-primary-hover"
        >
          Quên mật khẩu?
        </button>
      </div>

      <Button type="submit" loading={isSubmitting || loginMutation.isPending} className="w-full">
        Đăng nhập
      </Button>

      <p className="text-center text-body-s text-slate">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('register')}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Đăng ký ngay
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onDone, onSwitchMode }) {
  const { setSession } = useAuthStore();
  const toast = useToast();
  const registerMutation = useRegisterAccount();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
  });

  async function onSubmit(values) {
    const body = {
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    };

    try {
      const payload = await registerMutation.mutateAsync({ body });
      if (payload?.access_token) {
        setSession({
          user: payload?.user ?? {
            id: payload?.user_id ?? '',
            email: payload?.email ?? values.email,
            full_name: values.full_name,
            phone: values.phone,
            role: 'CUSTOMER',
          },
          accessToken: payload.access_token,
        });
        toast.success('Tạo tài khoản thành công. Chào mừng bạn đến với KAIDO!');
        onDone();
        return;
      }
      toast.success('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.');
      onSwitchMode('login');
    } catch {
      // Lỗi hiển thị qua registerMutation.error.
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormError error={registerMutation.error} />

      <Input
        label="Họ và tên"
        autoComplete="name"
        placeholder="Nguyễn Minh An"
        error={errors.full_name?.message}
        required
        {...register('full_name')}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="ban@kaido.vn"
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <Input
        label="Số điện thoại"
        type="tel"
        autoComplete="tel"
        placeholder="0901234567"
        error={errors.phone?.message}
        required
        {...register('phone')}
      />
      <Input
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        placeholder="Tối thiểu 8 ký tự"
        hint="Cần có chữ hoa, chữ thường và chữ số."
        error={errors.password?.message}
        required
        {...register('password')}
      />
      <Input
        label="Nhập lại mật khẩu"
        type="password"
        autoComplete="new-password"
        placeholder="Nhập lại mật khẩu"
        error={errors.confirm_password?.message}
        required
        {...register('confirm_password')}
      />

      <Button type="submit" loading={isSubmitting || registerMutation.isPending} className="w-full">
        Tạo tài khoản
      </Button>

      <p className="text-center text-body-s text-slate">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Đăng nhập
        </button>
      </p>
    </form>
  );
}

function ForgotForm({ onSwitchMode }) {
  const [sent, setSent] = useState(false);
  const forgotMutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values) {
    try {
      await forgotMutation.mutateAsync({ body: values });
      setSent(true);
    } catch {
      // Lỗi hiển thị qua forgotMutation.error.
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="rounded-sm border border-success/30 bg-success/5 px-3 py-3 text-body-s text-success-strong"
        >
          Nếu email tồn tại trong hệ thống, mã OTP đã được gửi. Mã có hiệu lực{' '}
          {Math.round(BUSINESS_RULES.AUTH.OTP_TTL_SECONDS / 60)} phút.
        </p>
        <Button type="button" className="w-full" onClick={() => onSwitchMode('login')}>
          Quay lại đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormError error={forgotMutation.error} />

      <Input
        label="Email đã đăng ký"
        type="email"
        autoComplete="email"
        placeholder="ban@kaido.vn"
        error={errors.email?.message}
        required
        {...register('email')}
      />

      <Button type="submit" loading={isSubmitting || forgotMutation.isPending} className="w-full">
        Gửi mã OTP
      </Button>

      <p className="text-center text-body-s text-slate">
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Quay lại đăng nhập
        </button>
      </p>
    </form>
  );
}

function AuthModalDialog({ open, onClose, initialMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlMode = normalizeMode(searchParams.get(MODE_PARAM));
  const [localMode, setLocalMode] = useState(normalizeMode(initialMode) ?? 'login');

  const mode = urlMode ?? localMode;
  const visible = Boolean(open) || urlMode !== null;

  function clearUrlMode() {
    if (urlMode === null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(MODE_PARAM);
    params.delete(NEXT_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function close() {
    onClose?.();
    clearUrlMode();
  }

  function switchMode(nextMode) {
    setLocalMode(nextMode);
    if (urlMode === null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(MODE_PARAM, nextMode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const content = MODES[mode] ?? MODES.login;

  return (
    <Modal open={visible} onClose={close} title={content.title} description={content.description}>
      <div
        role="tablist"
        aria-label="Chế độ xác thực"
        className="mb-5 grid grid-cols-2 gap-1 rounded-sm bg-fog/60 p-1"
      >
        {['login', 'register'].map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={`min-h-[40px] rounded-sm px-3 text-body-s font-semibold transition-colors duration-250 ${
              mode === value ? 'bg-white text-primary shadow-sm' : 'text-slate hover:text-ink'
            }`}
          >
            {MODES[value].label}
          </button>
        ))}
      </div>

      {mode === 'login' ? (
        <LoginForm onDone={close} onSwitchMode={switchMode} />
      ) : mode === 'register' ? (
        <RegisterForm onDone={close} onSwitchMode={switchMode} />
      ) : (
        <ForgotForm onSwitchMode={switchMode} />
      )}
    </Modal>
  );
}

export default function AuthModal(props) {
  return (
    <Suspense fallback={null}>
      <AuthModalDialog {...props} />
    </Suspense>
  );
}
