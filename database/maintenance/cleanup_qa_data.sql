-- =====================================================================
-- DỌN DỮ LIỆU KIỂM THỬ (QA) KHỎI DATABASE
-- Chạy trong Supabase SQL Editor. Xóa MỀM (deleted_at) để không phá
-- tham chiếu của đơn hàng/log bất biến.
--
-- Nhận diện dữ liệu QA theo quy ước bộ test đã dùng:
--   * danh mục:  "Danh muc ... QA <id>", "Probe cat ..."
--   * sản phẩm:  "Probe ...", slug/name chứa qa|probe, SKU bắt đầu QA-
--   * brand:     "QA Probe Brand" (slug qa-probe-brand)
-- Chạy trong 1 transaction: kiểm tra số dòng NOTICE trước khi COMMIT.
-- =====================================================================
BEGIN;

-- 1) Sản phẩm QA (kèm biến thể) -------------------------------
WITH junk_products AS (
  SELECT p.id
  FROM public.products p
  WHERE p.deleted_at IS NULL
    AND (
      p.name ~* '(^| )(qa|probe)( |$)'
      OR p.slug ~ '(^|-)(qa|probe)(-|$)'
      OR EXISTS (
        SELECT 1 FROM public.product_variants v
        WHERE v.product_id = p.id AND v.sku LIKE 'QA-%'
      )
    )
),
updated_variants AS (
  UPDATE public.product_variants v
  SET deleted_at = now(), is_active = false
  FROM junk_products j
  WHERE v.product_id = j.id AND v.deleted_at IS NULL
  RETURNING 1
),
updated_products AS (
  UPDATE public.products p
  SET deleted_at = now(), status = 'INACTIVE', updated_at = now()
  FROM junk_products j
  WHERE p.id = j.id
  RETURNING 1
)
SELECT (SELECT count(*) FROM updated_products) AS qa_products_deleted,
       (SELECT count(*) FROM updated_variants) AS qa_variants_deleted;

-- 2) Danh mục QA ----------------------------------------------
UPDATE public.categories
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE deleted_at IS NULL
  AND (
    name ~* '(^| )(qa|probe)( |$)'
    OR slug ~ '(^|-)(qa|probe)(-|$)'
  );

-- 3) Brand QA -------------------------------------------------
UPDATE public.brands
SET deleted_at = now(), is_active = false, updated_at = now()
WHERE deleted_at IS NULL
  AND (
    name ~* '(^| )(qa|probe)( |$)'
    OR slug ~ '(^|-)(qa|probe)(-|$)'
  );

-- 4) Kiểm tra còn sót trên storefront (kỳ vọng 0 dòng) --------
SELECT 'categories' AS entity, count(*) AS remaining
FROM public.categories
WHERE deleted_at IS NULL AND is_active
  AND (name ~* '(^| )(qa|probe)( |$)' OR slug ~ '(^|-)(qa|probe)(-|$)')
UNION ALL
SELECT 'products', count(*)
FROM public.products
WHERE deleted_at IS NULL
  AND (name ~* '(^| )(qa|probe)( |$)' OR slug ~ '(^|-)(qa|probe)(-|$)')
UNION ALL
SELECT 'brands', count(*)
FROM public.brands
WHERE deleted_at IS NULL AND is_active
  AND (name ~* '(^| )(qa|probe)( |$)' OR slug ~ '(^|-)(qa|probe)(-|$)');

COMMIT;
