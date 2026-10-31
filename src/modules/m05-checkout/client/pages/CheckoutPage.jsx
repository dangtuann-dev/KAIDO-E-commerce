'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — CheckoutPage
 * SRS: M05 | API/FR: M05-F01, M05-F03, M05-F04, M05-F05, M05-F06, API-M05-01, API-M05-02
 * BR: BR-M05-01 (phí ship theo tỉnh), BR-M05-02 (timeout 20 phút), BR-M05-03 (COD ngưỡng lớn)
 * Route: /checkout?items=<cartItemId,...> — do M04 chuyển sang sau khi giữ dòng.
 * Render: Client Component (tương tác). Chỉ COD/VNPAY/MoMo/ZaloPay, không có form thẻ.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/shared/ui/toast.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useAuthStore, selectAuthUser } from '@/shared/auth/auth-store.js';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value.js';
import {
  fullNameSchema,
  optionalEmailSchema,
  phoneSchema,
  streetAddressSchema,
} from '@/shared/validation/index.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { PAYMENT_METHODS } from '@/shared/constants/payment.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import CheckoutShippingForm from '../components/CheckoutShippingForm.jsx';
import OrderSummarySidebar from '../components/OrderSummarySidebar.jsx';
import PaymentMethodSelector from '../components/PaymentMethodSelector.jsx';
import { getProvinceByCode } from '../constants/vn-provinces.js';
import { useGetCheckoutSummary } from '../hooks/use-get-checkout-summary.js';
import { usePlaceOrder } from '../hooks/use-place-order.js';

const MAX_ITEM_IDS = 50;
const VOUCHER_PATTERN = /^[A-Z0-9]{4,20}$/;
const DEFAULT_PAYMENT_TIMEOUT_MINUTES = 20;
const DEFAULT_SHIPPING_METHOD = 'STANDARD';

const EMPTY_ADDRESS = Object.freeze({
  recipient_name: '',
  recipient_phone: '',
  recipient_email: '',
  province_code: '',
  district: '',
  ward: '',
  address_line: '',
  note: '',
});

/** Đủ điều kiện gọi API-M05-01 (server yêu cầu địa chỉ hợp lệ để tính phí ship). */
function isDeliverable(value) {
  return (
    fullNameSchema.safeParse(value.recipient_name).success &&
    phoneSchema.safeParse(value.recipient_phone).success &&
    optionalEmailSchema.safeParse(value.recipient_email).success &&
    Boolean(value.province_code) &&
    Boolean(value.ward.trim()) &&
    streetAddressSchema.safeParse(value.address_line).success
  );
}

/** Lỗi hiển thị ngay dưới từng ô nhập của form giao hàng. */
function validateAddress(value) {
  const errors = {};
  const checks = [
    ['recipient_name', fullNameSchema],
    ['recipient_phone', phoneSchema],
    ['recipient_email', optionalEmailSchema],
    ['address_line', streetAddressSchema],
  ];

  for (const [field, schema] of checks) {
    const result = schema.safeParse(value[field]);
    if (!result.success) errors[field] = result.error.issues[0]?.message ?? 'Giá trị không hợp lệ.';
  }

  if (!value.province_code) errors.province_code = 'Vui lòng chọn Tỉnh/Thành phố.';
  if (!value.ward.trim()) errors.ward = 'Vui lòng nhập Phường/Xã.';

  return errors;
}

function SummarySkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-fog bg-white p-5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-16 w-full" rounded="sm" />
      <Skeleton className="h-16 w-full" rounded="sm" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-12 w-full" rounded="sm" />
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const user = useAuthStore(selectAuthUser);
  const prefilledRef = useRef(false);

  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);
  const [shippingMethod, setShippingMethod] = useState(DEFAULT_SHIPPING_METHOD);
  const [couponCode, setCouponCode] = useState('');
  const [pointsUsed, setPointsUsed] = useState(0);
  const [placeError, setPlaceError] = useState(null);

  const rawItems = searchParams.get('items') ?? '';
  const itemIds = useMemo(
    () =>
      rawItems
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, MAX_ITEM_IDS),
    [rawItems],
  );

  // Điền sẵn thông tin người nhận từ phiên đăng nhập (chỉ một lần, không ghi đè dữ liệu đã nhập).
  useEffect(() => {
    if (prefilledRef.current || !user) return;
    prefilledRef.current = true;
    setAddress((current) => ({
      ...current,
      recipient_name: current.recipient_name || user.full_name || '',
      recipient_phone: current.recipient_phone || user.phone || '',
      recipient_email: current.recipient_email || user.email || '',
    }));
  }, [user]);

  const debouncedAddress = useDebouncedValue(address, 450);
  const summaryReady = itemIds.length > 0 && isDeliverable(debouncedAddress);

  const summaryBody = useMemo(() => {
    const province = getProvinceByCode(debouncedAddress.province_code);

    return {
      item_ids: itemIds,
      shipping_address: {
        recipient_name: debouncedAddress.recipient_name.trim(),
        recipient_phone: debouncedAddress.recipient_phone.trim(),
        recipient_email: debouncedAddress.recipient_email.trim(),
        province: province?.name ?? '',
        province_code: debouncedAddress.province_code || undefined,
        district: debouncedAddress.district.trim() || undefined,
        ward: debouncedAddress.ward.trim(),
        address_line: debouncedAddress.address_line.trim(),
      },
      shipping_method: shippingMethod,
      coupon_code: couponCode || undefined,
      points_redeemed: pointsUsed,
    };
  }, [itemIds, debouncedAddress, shippingMethod, couponCode, pointsUsed]);

  const summaryQuery = useGetCheckoutSummary(summaryBody, { enabled: summaryReady });
  const summary = summaryQuery.data ?? null;
  const placeMutation = usePlaceOrder();

  const paymentMethods = useMemo(() => summary?.payment_methods ?? [], [summary]);
  const effectivePaymentMethod = useMemo(() => {
    const available = paymentMethods.filter((method) => method.available);
    if (available.some((method) => method.method === paymentMethod)) return paymentMethod;
    return available[0]?.method ?? PAYMENT_METHODS.COD;
  }, [paymentMethods, paymentMethod]);

  // Server trả về phương thức vận chuyển đã áp dụng (fallback khi tỉnh không hỗ trợ lựa chọn).
  const effectiveShippingMethod = summary?.shipping_method ?? shippingMethod;
  const paymentTimeoutMinutes =
    summary?.payment_timeout_minutes ?? DEFAULT_PAYMENT_TIMEOUT_MINUTES;
  const pointsMultiple = BUSINESS_RULES.LOYALTY.REDEEM_POINT_MULTIPLE;

  function handleAddressChange(field, value) {
    setAddress((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setPlaceError(null);
  }

  function handleShippingMethodChange(method) {
    setShippingMethod(method);
    setPlaceError(null);
  }

  function handleApplyCoupon(code) {
    setPlaceError(null);
    if (!code) {
      setCouponCode('');
      return;
    }
    if (!VOUCHER_PATTERN.test(code)) {
      toast.error('Mã giảm giá gồm 4–20 ký tự chữ và số.');
      return;
    }
    setCouponCode(code);
  }

  function handleApplyPoints(points) {
    setPlaceError(null);
    const normalized = Number.isFinite(Number(points)) ? Math.max(0, Math.trunc(Number(points))) : 0;
    if (normalized > 0 && normalized % pointsMultiple !== 0) {
      toast.error(`Điểm tiêu phải là bội số của ${pointsMultiple}.`);
      return;
    }
    setPointsUsed(normalized);
  }

  async function handlePlaceOrder() {
    const nextErrors = validateAddress(address);
    setErrors(nextErrors);
    setPlaceError(null);

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Vui lòng kiểm tra lại thông tin giao hàng.');
      return;
    }

    const province = getProvinceByCode(address.province_code);
    if (!province) {
      setErrors((current) => ({ ...current, province_code: 'Vui lòng chọn Tỉnh/Thành phố.' }));
      return;
    }

    const lines = summary?.items ?? [];
    if (lines.length === 0) {
      setPlaceError('Không tìm thấy sản phẩm nào để đặt. Vui lòng quay lại giỏ hàng.');
      return;
    }

    try {
      const result = await placeMutation.mutateAsync({
        body: {
          shipping_address: {
            recipient_name: address.recipient_name.trim(),
            recipient_phone: address.recipient_phone.trim(),
            recipient_email: address.recipient_email.trim(),
            province: province.name,
            province_code: province.code,
            district: address.district.trim() || undefined,
            ward: address.ward.trim(),
            address_line: address.address_line.trim(),
          },
          address_id: undefined,
          payment_method: effectivePaymentMethod,
          shipping_method: effectiveShippingMethod,
          note: address.note.trim() || undefined,
          items: lines.map((line) => ({
            product_id: line.product_id,
            variant_id: line.variant_id ?? null,
            quantity: line.quantity,
          })),
          coupon_code: couponCode || undefined,
          points_redeemed: pointsUsed,
        },
      });

      if (result?.requires_approval) {
        toast.info('Đơn COD giá trị lớn cần nhân viên xác nhận trước khi giao.');
      }

      if (result?.payment_url) {
        if (result.payment_mode === 'sandbox') {
          router.push(`/checkout/payment-sandbox/${encodeURIComponent(result.order_code)}`);
          return;
        }
        window.location.assign(result.payment_url);
        return;
      }

      if (effectivePaymentMethod !== PAYMENT_METHODS.COD) {
        toast.warning('Chưa tạo được liên kết thanh toán. Bạn có thể thanh toán lại trong trang đơn hàng.');
      }

      router.replace(result?.redirect_path ?? `/order-success/${encodeURIComponent(result.order_code)}`);
    } catch (error) {
      if (error?.code === ERROR_CODES.INSUFFICIENT_STOCK) {
        toast.error(error.message ?? 'Một số sản phẩm vừa hết hàng. Vui lòng kiểm tra lại giỏ hàng.');
        summaryQuery.refetch();
        return;
      }
      setPlaceError(error?.message ?? 'Không thể đặt hàng. Vui lòng thử lại sau ít phút.');
    }
  }

  if (itemIds.length === 0) {
    return (
      <div className="kaido-container py-8 md:py-10">
        <EmptyState
          title="Chưa có sản phẩm để thanh toán"
          description="Vui lòng chọn sản phẩm trong giỏ hàng rồi bấm “Thanh toán” để tiếp tục."
          action={
            <Link
              href="/cart"
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
            >
              Quay lại giỏ hàng
            </Link>
          }
        />
      </div>
    );
  }

  const summaryBlocked = summaryQuery.isError;

  return (
    <div className="kaido-container py-8 md:py-10">
      <header className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="text-caption text-slate">
          <Link href="/cart" className="hover:text-primary hover:underline">
            Giỏ hàng
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span className="font-semibold text-ink">Thanh toán</span>
        </nav>
        <h1 className="font-heading text-h2 text-ink">Thanh toán đơn hàng</h1>
        <p className="max-w-2xl text-body-s text-slate">
          Kiểm tra thông tin người nhận, chọn cách giao và phương thức thanh toán. Đơn online giữ tồn
          kho trong {paymentTimeoutMinutes} phút.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-lg border border-fog bg-white p-5">
            <CheckoutShippingForm
              value={address}
              errors={errors}
              onChange={handleAddressChange}
              shippingOptions={summary?.shipping_options ?? []}
              shippingMethod={effectiveShippingMethod}
              onShippingMethodChange={handleShippingMethodChange}
              shippingPending={summaryQuery.isFetching}
              shippingError={
                summaryQuery.isError && summaryQuery.error?.code !== ERROR_CODES.VALIDATION_ERROR
                  ? summaryQuery.error.message
                  : null
              }
              disabled={placeMutation.isPending}
            />
          </div>

          <div className="rounded-lg border border-fog bg-white p-5">
            <PaymentMethodSelector
              methods={paymentMethods}
              value={effectivePaymentMethod}
              onChange={setPaymentMethod}
              total={summary?.total_amount ?? 0}
              codThreshold={summary?.cod_confirmation_threshold ?? 0}
              disabled={placeMutation.isPending}
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-6">
          {summaryBlocked ? (
            <div
              role="alert"
              className="space-y-3 rounded-lg border border-sale/40 bg-sale/5 p-5 text-body-s text-ink"
            >
              <p className="font-semibold">Không thể tính tạm tính đơn hàng</p>
              <p className="text-slate">
                {summaryQuery.error?.message ??
                  'Vui lòng kiểm tra lại địa chỉ giao hàng và sản phẩm đã chọn.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => summaryQuery.refetch()}>
                  Thử lại
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/cart')}>
                  Về giỏ hàng
                </Button>
              </div>
            </div>
          ) : !summaryReady || (summaryQuery.isLoading && !summary) ? (
            <SummarySkeleton />
          ) : (
            <OrderSummarySidebar
              items={summary?.items ?? []}
              subtotal={summary?.subtotal ?? 0}
              shippingFee={summary?.shipping_fee ?? 0}
              discountAmount={summary?.discount_amount ?? 0}
              pointsDiscountAmount={summary?.points_discount_amount ?? 0}
              totalAmount={summary?.total_amount ?? 0}
              freeShippingThreshold={summary?.free_shipping_threshold ?? 0}
              freeShippingRemaining={summary?.free_shipping_remaining ?? 0}
              coupon={summary?.coupon ?? null}
              onApplyCoupon={handleApplyCoupon}
              pointsUsed={summary?.points_used ?? pointsUsed}
              onApplyPoints={handleApplyPoints}
              pointsPending={summaryQuery.isFetching}
              warnings={summary?.warnings ?? []}
              canPlaceOrder={Boolean(summary) && !summaryQuery.isError}
              placing={placeMutation.isPending}
              placeError={placeError}
              onPlaceOrder={handlePlaceOrder}
              paymentTimeoutMinutes={paymentTimeoutMinutes}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="kaido-container py-8 md:py-10">
          <Skeleton className="h-8 w-64" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Skeleton className="h-96 w-full" rounded="md" />
            <SummarySkeleton />
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
