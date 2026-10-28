'use client';

/**
 * [TOY-M08] AdminInventorySettingsPage — cấu hình kho và nhà cung cấp (M08-F01/F12).
 * Gồm kho, nhà cung cấp, chuyển kho nội bộ và nhập hàng hoàn.
 */
import { useState } from 'react';
import Link from 'next/link';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { ROLES } from '@/shared/constants/roles.js';
import { cn } from '@/shared/utils/cn.js';
import ReturnedGoodsForm from '../components/ReturnedGoodsForm.jsx';
import SupplierManager from '../components/SupplierManager.jsx';
import TransferManager from '../components/TransferManager.jsx';
import WarehouseManager from '../components/WarehouseManager.jsx';

const TABS = [
  { id: 'warehouses', label: 'Kho hàng' },
  { id: 'suppliers', label: 'Nhà cung cấp' },
  { id: 'transfers', label: 'Chuyển kho' },
  { id: 'returns', label: 'Hàng hoàn' },
];

export default function AdminInventorySettingsPage() {
  const user = useAuthStore(selectAuthUser);
  const [activeTab, setActiveTab] = useState('warehouses');

  const isAdmin = user?.role === ROLES.ADMIN;
  const canManageInventory = user?.role === ROLES.ADMIN || user?.role === ROLES.WAREHOUSE_KEEPER;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Cấu hình kho &amp; NCC</h1>
          <p className="mt-1 text-body-s text-slate">
            Quản lý kho vật lý, nhà cung cấp, chuyển kho nội bộ và nhập hàng hoàn.
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="inline-flex min-h-[44px] items-center rounded-sm px-3 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
        >
          ← Về tồn kho
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Nhóm cấu hình kho"
        className="mt-5 flex flex-wrap gap-2 border-b border-fog"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              '-mb-px min-h-[44px] border-b-2 px-4 text-body-s font-semibold transition-colors duration-250',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="mt-6"
      >
        {activeTab === 'warehouses' ? <WarehouseManager canEdit={isAdmin} /> : null}
        {activeTab === 'suppliers' ? <SupplierManager canEdit={canManageInventory} /> : null}
        {activeTab === 'transfers' ? <TransferManager canEdit={canManageInventory} /> : null}
        {activeTab === 'returns' ? <ReturnedGoodsForm canEdit={canManageInventory} /> : null}
      </div>
    </div>
  );
}
