'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminArticleForm
 * SRS: M09-F02, M09-F05 | API: API-M09-13, API-M09-14, API-M09-24 | NFR: NFR-M09-01
 * Route: /admin/marketing/articles
 * UI: Modal soạn bài viết — tiêu đề, slug SEO, danh mục, nội dung, ảnh bìa,
 * trạng thái và hẹn giờ xuất bản; meta title/description cho OpenGraph.
 * Nội dung nạp lại từ API-M09-24 vì danh sách admin chỉ trả tóm tắt.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { ARTICLE_STATUS_LABELS, fromDateTimeInput, toDateTimeInput } from '../display.js';
import { useCreateArticle } from '../hooks/use-create-article.js';
import { useGetAdminArticle } from '../hooks/use-get-admin-article.js';
import { useUpdateArticle } from '../hooks/use-update-article.js';
import {
  ARTICLE_STATUS_VALUES,
  EMPTY_ARTICLE_FORM,
  articleFormSchema,
} from '../validation/article-form.schema.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const STATUS_OPTIONS = ARTICLE_STATUS_VALUES.map((value) => ({
  value,
  label: ARTICLE_STATUS_LABELS[value] ?? value,
}));

function categoryOptions(categories) {
  return [
    { value: '', label: 'Không gắn danh mục' },
    ...(categories ?? []).map((category) => ({
      value: category.id,
      label: category.is_active ? category.name : `${category.name} (đã ẩn)`,
    })),
  ];
}

function toFormValues(article) {
  if (!article?.id) return { ...EMPTY_ARTICLE_FORM };
  return {
    title: article.title ?? '',
    slug: article.slug ?? '',
    category_id: article.category_id ?? '',
    excerpt: article.excerpt ?? '',
    content: article.content ?? '',
    cover_image_url: article.cover_image_url ?? '',
    status: article.status ?? 'DRAFT',
    published_at: toDateTimeInput(article.published_at),
    meta_title: article.meta_title ?? '',
    meta_description: article.meta_description ?? '',
  };
}

function ArticleFormBody({ article, categories, onClose, onSaved }) {
  const toast = useToast();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const saving = createArticle.isPending || updateArticle.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(articleFormSchema),
    defaultValues: toFormValues(article),
  });

  async function onSubmit(values) {
    const publishedAt = fromDateTimeInput(values.published_at);
    const payload = {
      title: values.title.trim(),
      excerpt: values.excerpt?.trim() || null,
      content: values.content.trim(),
      cover_image_url: values.cover_image_url?.trim() || null,
      category_id: values.category_id || null,
      status: values.status,
      meta_title: values.meta_title?.trim() || null,
      meta_description: values.meta_description?.trim() || null,
    };

    const slug = values.slug?.trim();
    if (slug && slug !== article?.slug) payload.slug = slug;

    // M09-F05 — DRAFT + mốc thời gian tương lai là hẹn giờ; bỏ trống thì xóa lịch.
    if (publishedAt) {
      payload.published_at = publishedAt;
    } else if (values.status === 'DRAFT') {
      payload.published_at = null;
    }

    try {
      if (article?.id) {
        await updateArticle.mutateAsync({ id: article.id, body: payload });
        toast.success('Đã cập nhật bài viết.');
      } else {
        await createArticle.mutateAsync({ body: payload });
        toast.success('Đã tạo bài viết mới.');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không lưu được bài viết.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Tiêu đề bài viết"
        required
        error={errors.title?.message}
        placeholder="Ví dụ: 5 món đồ chơi giúp bé phát triển tư duy"
        {...register('title')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Slug SEO"
          error={errors.slug?.message}
          hint="Để trống để hệ thống tự sinh từ tiêu đề."
          placeholder="do-choi-phat-trien-tu-duy"
          {...register('slug')}
        />
        <Select
          label="Danh mục bài viết"
          options={categoryOptions(categories)}
          error={errors.category_id?.message}
          {...register('category_id')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="article-excerpt" className="text-body-s font-semibold text-ink">
          Mô tả ngắn
        </label>
        <textarea
          id="article-excerpt"
          rows={3}
          placeholder="Tóm tắt 1–2 câu hiển thị trên thẻ bài viết và thẻ chia sẻ mạng xã hội."
          aria-invalid={errors.excerpt ? 'true' : undefined}
          className={TEXTAREA_CLASS}
          {...register('excerpt')}
        />
        {errors.excerpt?.message ? (
          <p className="text-body-s text-sale">{errors.excerpt.message}</p>
        ) : (
          <p className="text-body-s text-slate">Tối đa 500 ký tự.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="article-content" className="text-body-s font-semibold text-ink">
          Nội dung <span className="text-sale">*</span>
        </label>
        <textarea
          id="article-content"
          rows={14}
          placeholder="Nội dung bài viết. Xuống dòng hai lần để tách đoạn."
          aria-invalid={errors.content ? 'true' : undefined}
          className={TEXTAREA_CLASS}
          {...register('content')}
        />
        {errors.content?.message ? (
          <p className="text-body-s text-sale">{errors.content.message}</p>
        ) : (
          <p className="text-body-s text-slate">
            Tối thiểu 20, tối đa 50.000 ký tự. Bài viết hiển thị dạng văn bản thuần, giữ nguyên
            xuống dòng.
          </p>
        )}
      </div>

      <Input
        label="URL ảnh bìa"
        error={errors.cover_image_url?.message}
        hint="Ảnh JPG/PNG/WebP đã tải lên Storage của KAIDO."
        placeholder="https://mjkiigjzuaebruqhovlj.supabase.co/storage/v1/object/public/kaido-media/blog.webp"
        {...register('cover_image_url')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Trạng thái"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register('status')}
        />
        <Input
          label="Hẹn giờ xuất bản"
          type="datetime-local"
          error={errors.published_at?.message}
          hint="Để trống để xuất bản ngay; cron tự đăng khi tới giờ (M09-F05)."
          {...register('published_at')}
        />
      </div>

      <fieldset className="grid gap-4 rounded-md border border-fog p-4 sm:grid-cols-2">
        <legend className="px-1 text-body-s font-semibold text-ink">SEO &amp; OpenGraph</legend>
        <Input
          label="Meta title"
          error={errors.meta_title?.message}
          hint="Tối đa 70 ký tự; mặc định lấy tiêu đề bài viết."
          {...register('meta_title')}
        />
        <Input
          label="Meta description"
          error={errors.meta_description?.message}
          hint="Tối đa 160 ký tự; mặc định lấy mô tả ngắn."
          {...register('meta_description')}
        />
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
          {article?.id ? 'Lưu thay đổi' : 'Tạo bài viết'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminArticleForm({
  open = false,
  article = null,
  categories = [],
  onClose,
  onSaved,
}) {
  const detail = useGetAdminArticle(open && article?.id ? article.id : null);
  const editing = Boolean(article?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editing ? 'Sửa bài viết' : 'Tạo bài viết mới'}
      description="Bài viết công khai trên /blog khi trạng thái PUBLISHED (M09-F02)."
    >
      {!open ? null : editing && detail.isPending ? (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : editing && detail.isError ? (
        <div className="py-6 text-center">
          <p className="text-body-s text-slate">
            {detail.error?.message ?? 'Không tải được nội dung bài viết.'}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => detail.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <ArticleFormBody
          key={article?.id ?? 'new'}
          article={editing ? detail.data : null}
          categories={categories}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}
