-- =====================================================================
-- KAIDO E-COMMERCE — MIGRATION 003: M05 — Thanh toán chuyển khoản ngân hàng
-- Chạy SAU database/schema.sql trong Supabase SQL Editor.
-- Script idempotent: có thể chạy lặp lại.
--
-- Thêm giá trị BANK_TRANSFER vào enum dùng chung cho:
--   * orders.payment_method
--   * payment_transactions.provider
--
-- PAYMENT_TRANSACTIONS giữ nguyên khóa idempotency `${order_code}:BANK_TRANSFER`
-- và unique index (provider, provider_transaction_id) — webhook/nhân viên gửi lặp
-- không tạo thêm giao dịch.
-- =====================================================================

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';
