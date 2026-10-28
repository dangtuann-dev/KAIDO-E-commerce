'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — AdminProductForm
 * SRS: M02-F04, M02-F05, M02-F07, M02-F08, M02-F13 | API: API-M02-04, API-M02-05, API-M02-09
 * BR: BR-M02-01 (SKU duy nhất), BR-M02-03 (price_sale <= price_regular)
 * Route: /admin/products/create, /admin/products/[id]/edit
 * UI: Thông tin, giá, danh mục, thương hiệu, độ tuổi, ảnh URL (tối đa 10), biến thể.
 * Ảnh nhập bằng URL vì nền tảng chưa có endpoint upload Storage.
 */
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import {
  AGE_GROUP_LABELS,
  GENDER_TARGET_LABELS,
  PRODUCT_STATUS_LABELS,
} from '@/shared/constants/product.js';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import Input from '@/shared/ui/input.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import {
  EMPTY_PRODUCT_FORM,
  productFormSchema,
} from '../validation/product-form.schema.js';
import { useCreateProduct } from '../hooks/use-create-product.js';
import { useUpdateProduct } from '../hooks/use-update-product.js';
import { useListAdminCategories } from '../hooks/use-list-admin-categories.js';
import { useListAdminBrands } from '../hooks/use-list-admin-brands.js';

const AGE_OPTIONS = Object.entries(AGE_GROUP_LABELS).map(([value, label]) => ({ value, label }));
const GENDER_OPTIONS = Object.entries(GENDER_TARGET_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const STATUS_OPTIONS = Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function flattenCategories(nodes, depth = 0, result = []) {
  for (const node of nodes ?? []) {
    result.push({
      value: node.id,
      label: `${'— '.repeat(depth)}${node.name}${node.is_active === false ? ' (đang ẩn)' : ''}`,
    });
    flattenCategories(node.children, depth + 1, result);
  }
  return result;
}

function toFormValues(initialData) {
  if (!initialData) return { ...EMPTY_PRODUCT_FORM };

  const product = initialData.product_details ?? {};
  const variants = initialData.variants ?? [];
  const defaultVariant = variants.find((variant) => variant.is_default) ?? variants[0];
  const primaryCategory =
    product.primary_category?.id ??
    product.categories?.find((category) => category.is_primary)?.id ??
    product.categories?.[0]?.id ??
    '';

  return {
    name: product.name ?? '',
    sku: defaultVariant?.sku ?? '',
    category_id: primaryCategory,
    brand_id: product.brand?.id ?? initialData.brand?.id ?? '',
    age_group: product.age_group ?? '3-6Y',
    gender_target: product.gender_target ?? 'UNISEX',
    status: product.status ?? 'DRAFT',
    price_regular: product.price_regular,
    price_sale: product.price_sale ?? null,
    low_stock_threshold: product.low_stock_threshold ?? 5,
    is_featured: Boolean(product.is_featured),
    short_description: product.short_description ?? '',
    description: product.description ?? '',
    material: product.material ?? '',
    origin_country: product.origin_country ?? '',
    safety_info: product.safety_info ?? '',
    meta_title: product.meta_title ?? '',
    meta_description: product.meta_description ?? '',
    images: (initialData.images ?? []).map((image) => ({
      url: image.url,
      alt_text: image.alt_text ?? '',
      is_primary: Boolean(image.is_thumbnail),
    })),
    variants: variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      is_default: Boolean(variant.is_default),
      is_active: variant.is_active !== false,
    })),
  };
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-md border border-fog bg-white p-4 md:p-5">
      <h2 className="font-heading text-h5 text-ink">{title}</h2>
      {description ? <p className="mt-1 text-body-s text-slate">{description}</p> : null}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function AdminProductForm({ mode = 'create', productId, initialData }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const { data: categoryTree = [] } = useListAdminCategories();
  const { data: brands = [] } = useListAdminBrands();
  const categoryOptions = flattenCategories(categoryTree);
  const brandOptions = (brands ?? []).map((brand) => ({ value: brand.id, label: brand.name }));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(initialData),
  });

  const imagesArray = useFieldArray({ control, name: 'images' });
  const variantsArray = useFieldArray({ control, name: 'variants' });
  const imageValues = useWatch({ control, name: 'images' }) ?? [];
  const variantValues = useWatch({ control, name: 'variants' }) ?? [];

  function setPrimaryImage(index) {
    setValue(
      'images',
      imageValues.map((image, current) => ({ ...image, is_primary: current === index })),
      { shouldDirty: true },
    );
  }

  function setDefaultVariant(index) {
    setValue(
      'variants',
      variantValues.map((variant, current) => ({ ...variant, is_default: current === index })),
      { shouldDirty: true },
    );
  }

  async function onSubmit(values) {
    const isEdit = mode === 'edit' && productId;
    const sku = values.sku.trim().toUpperCase();

    const images = (values.images ?? [])
      .filter((image) => image.url?.trim())
      .map((image) => ({
        url: image.url.trim(),
        alt_text: image.alt_text?.trim() || undefined,
        is_primary: Boolean(image.is_primary),
      }));
    if (images.length > 0 && !images.some((image) => image.is_primary)) images[0].is_primary = true;

    const variantRows = (values.variants ?? []).filter(
      (variant) => variant.sku?.trim() || variant.name?.trim(),
    );
    let variants;
    if (variantRows.length > 0) {
      const defaultIndex = Math.max(
        0,
        variantRows.findIndex((variant) => variant.is_default),
      );
      variants = variantRows.map((variant, index) => ({
        ...(variant.id ? { id: variant.id } : {}),
        sku: (index === defaultIndex ? sku : variant.sku.trim()).toUpperCase(),
        name: variant.name.trim(),
        is_default: index === defaultIndex,
        is_active: variant.is_active !== false,
      }));
    }

    const priceSale =
      values.price_sale === '' || values.price_sale == null ? null : values.price_sale;

    const body = {
      name: values.name.trim(),
      sku,
      category_id: values.category_id,
      brand_id: values.brand_id || null,
      age_group: values.age_group,
      gender_target: values.gender_target,
      status: values.status,
      price_regular: values.price_regular,
      price_sale: priceSale,
      low_stock_threshold: values.low_stock_threshold,
      is_featured: Boolean(values.is_featured),
      short_description: values.short_description?.trim() ?? '',
      description: values.description?.trim() ?? '',
      material: values.material?.trim() ?? '',
      origin_country: values.origin_country?.trim() ?? '',
      safety_info: values.safety_info?.trim() ?? '',
      meta_title: values.meta_title?.trim() ?? '',
      meta_description: values.meta_description?.trim() ?? '',
      images,
      ...(variants ? { variants } : {}),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: productId, body });
        toast.success('Đã cập nhật sản phẩm.');
      } else {
        await createMutation.mutateAsync({ body });
        toast.success('Đã tạo sản phẩm mới.');
      }

      await queryClient.invalidateQueries({
        queryKey: [getApiEndpoint('API-M02-08').code],
      });
      if (isEdit) {
        await queryClient.invalidateQueries({
          queryKey: [getApiEndpoint('API-M02-09').code],
        });
      }
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      const field = error?.details?.field;
      if (field && field !== 'variants' && field in values) {
        setError(field, { message: error.message });
      }
      setError('root', { message: error?.message || 'Không lưu được sản phẩm.' });
    }
  }

  const submitting = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {errors.root?.message ? (
        <p role="alert" className="rounded-sm border border-sale/40 bg-sale/5 px-4 py-3 text-body-s text-sale">
          {errors.root.message}
        </p>
      ) : null}

      <Section title="Thông tin cơ bản">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Tên sản phẩm"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="SKU sản phẩm"
            required
            hint="3–30 ký tự chữ, số hoặc gạch ngang. Hệ thống tự chuyển chữ hoa (BR-M02-01)."
            error={errors.sku?.message}
            {...register('sku')}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Danh mục chính"
            required
            placeholder="Chọn danh mục"
            options={categoryOptions}
            error={errors.category_id?.message}
            {...register('category_id')}
          />
          <Select
            label="Thương hiệu"
            placeholder="Không chọn"
            options={brandOptions}
            error={errors.brand_id?.message}
            {...register('brand_id')}
          />
          <Select
            label="Trạng thái"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Độ tuổi"
            required
            options={AGE_OPTIONS}
            error={errors.age_group?.message}
            {...register('age_group')}
          />
          <Select
            label="Giới tính"
            options={GENDER_OPTIONS}
            error={errors.gender_target?.message}
            {...register('gender_target')}
          />
        </div>

        <Input
          label="Mô tả ngắn"
          hint="Tối đa 500 ký tự, hiển thị dưới tên sản phẩm."
          error={errors.short_description?.message}
          {...register('short_description')}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-description" className="text-body-s font-semibold text-ink">
            Mô tả chi tiết
          </label>
          <textarea
            id="product-description"
            rows={6}
            aria-invalid={errors.description ? 'true' : undefined}
            className="block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            {...register('description')}
          />
          {errors.description?.message ? (
            <p className="text-body-s text-sale">{errors.description.message}</p>
          ) : (
            <p className="text-body-s text-slate">Tối đa 5.000 ký tự. Xuống dòng để tách đoạn.</p>
          )}
        </div>
      </Section>

      <Section title="Giá và tồn kho" description="Giá niêm yết bắt buộc; giá sale không lớn hơn giá niêm yết (BR-M02-03).">
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Giá niêm yết (VND)"
            required
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            error={errors.price_regular?.message}
            {...register('price_regular', {
              setValueAs: (value) => (value === '' || value == null ? undefined : Number(value)),
            })}
          />
          <Input
            label="Giá sale (VND)"
            type="number"
            inputMode="numeric"
            min="0"
            step="1000"
            hint="Để trống nếu không giảm giá."
            error={errors.price_sale?.message}
            {...register('price_sale', {
              setValueAs: (value) => (value === '' || value == null ? null : Number(value)),
            })}
          />
          <Input
            label="Ngưỡng cảnh báo tồn kho"
            type="number"
            inputMode="numeric"
            min="0"
            max="1000"
            hint="Mặc định 5 sản phẩm (M02-F13)."
            error={errors.low_stock_threshold?.message}
            {...register('low_stock_threshold', {
              setValueAs: (value) => (value === '' || value == null ? undefined : Number(value)),
            })}
          />
        </div>
        <Checkbox
          label="Đưa sản phẩm vào nhóm nổi bật"
          error={errors.is_featured?.message}
          {...register('is_featured')}
        />
      </Section>

      <Section title="Thuộc tính đồ chơi">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Chất liệu" error={errors.material?.message} {...register('material')} />
          <Input
            label="Xuất xứ"
            error={errors.origin_country?.message}
            {...register('origin_country')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-safety" className="text-body-s font-semibold text-ink">
            Lưu ý an toàn
          </label>
          <textarea
            id="product-safety"
            rows={3}
            className="block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            {...register('safety_info')}
          />
          {errors.safety_info?.message ? (
            <p className="text-body-s text-sale">{errors.safety_info.message}</p>
          ) : null}
        </div>
      </Section>

      <Section
        title="Ảnh sản phẩm"
        description="Tối đa 10 ảnh (M02-F07). Nhập URL ảnh công khai; chọn một ảnh làm đại diện."
      >
        {imagesArray.fields.length === 0 ? (
          <p className="text-body-s text-slate">Chưa có ảnh nào.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {imagesArray.fields.map((field, index) => (
              <li key={field.id} className="rounded-sm border border-fog p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    label={`URL ảnh ${index + 1}`}
                    placeholder="https://…"
                    error={errors.images?.[index]?.url?.message}
                    {...register(`images.${index}.url`)}
                  />
                  <Input
                    label="Alt text"
                    error={errors.images?.[index]?.alt_text?.message}
                    {...register(`images.${index}.alt_text`)}
                  />
                  <div className="flex items-end gap-3 pb-1">
                    <label className="flex min-h-[44px] items-center gap-2 text-body-s text-ink">
                      <input
                        type="radio"
                        name="primary-image"
                        checked={Boolean(imageValues[index]?.is_primary)}
                        onChange={() => setPrimaryImage(index)}
                        className="h-4 w-4 accent-primary"
                      />
                      Đại diện
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => imagesArray.remove(index)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={imagesArray.fields.length >= 10}
            onClick={() =>
              imagesArray.append({
                url: '',
                alt_text: '',
                is_primary: imagesArray.fields.length === 0,
              })
            }
          >
            Thêm ảnh
          </Button>
        </div>
      </Section>

      <Section
        title="Biến thể"
        description="Mỗi biến thể có SKU riêng và duy nhất toàn hệ thống (BR-M02-01). Để trống nếu chỉ có một phiên bản."
      >
        {variantsArray.fields.length === 0 ? (
          <p className="text-body-s text-slate">
            Sản phẩm dùng SKU chính ở trên làm biến thể mặc định.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {variantsArray.fields.map((field, index) => (
              <li key={field.id} className="rounded-sm border border-fog p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    label={`SKU biến thể ${index + 1}`}
                    error={errors.variants?.[index]?.sku?.message}
                    hint={index === 0 ? 'Biến thể mặc định dùng SKU sản phẩm.' : undefined}
                    {...register(`variants.${index}.sku`)}
                  />
                  <Input
                    label="Tên biến thể"
                    error={errors.variants?.[index]?.name?.message}
                    {...register(`variants.${index}.name`)}
                  />
                  <div className="flex flex-wrap items-end gap-3 pb-1">
                    <label className="flex min-h-[44px] items-center gap-2 text-body-s text-ink">
                      <input
                        type="radio"
                        name="default-variant"
                        checked={Boolean(variantValues[index]?.is_default)}
                        onChange={() => setDefaultVariant(index)}
                        className="h-4 w-4 accent-primary"
                      />
                      Mặc định
                    </label>
                    <Checkbox
                      label="Đang bán"
                      containerClassName="min-w-[110px]"
                      {...register(`variants.${index}.is_active`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => variantsArray.remove(index)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={variantsArray.fields.length >= 50}
            onClick={() =>
              variantsArray.append({
                sku: '',
                name: '',
                is_default: variantsArray.fields.length === 0,
                is_active: true,
              })
            }
          >
            Thêm biến thể
          </Button>
        </div>
      </Section>

      <Section title="SEO" description="Tiêu đề và mô tả hiển thị trên công cụ tìm kiếm.">
        <Input label="Meta title" error={errors.meta_title?.message} {...register('meta_title')} />
        <Input
          label="Meta description"
          error={errors.meta_description?.message}
          {...register('meta_description')}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={submitting} loadingLabel="Đang lưu…">
          {mode === 'edit' ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
        </Button>
        <Link
          href="/admin/products"
          className="inline-flex min-h-[44px] items-center px-4 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
        >
          Hủy
        </Link>
      </div>
    </form>
  );
}
