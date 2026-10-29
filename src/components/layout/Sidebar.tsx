import React from 'react';
import {
  LayoutDashboard,
  Tags,
  FilePlus2,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Settings,
  Globe2,
  TrendingUp,
  ShoppingBag,
  X,
  Sparkles,
} from 'lucide-react';

import { StaffUser } from '../../types';

export type NavTab =
  | 'overview'
  | 'catalog'
  | 'quoting'
  | 'orders'
  | 'procurement'
  | 'reconciliation'
  | 'wishes'
  | 'customers'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingReconcileCount: number;
  pendingPurchaseCount: number;
  arrivedPendingBalanceCount: number;
  pendingWishCount?: number;
  onSwitchToStorefront?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  shopName?: string;
  currentAdmin?: StaffUser | null;
  onLogoutAdmin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingReconcileCount,
  pendingPurchaseCount,
  arrivedPendingBalanceCount,
  pendingWishCount = 0,
  onSwitchToStorefront,
  isMobileOpen = false,
  onCloseMobile,
  shopName = 'GlobalProxy 連線代購',
  currentAdmin,
  onLogoutAdmin,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: '營運總覽',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      id: 'catalog' as NavTab,
      label: '商品上架庫',
      icon: Tags,
      badge: 0,
    },
    {
      id: 'quoting' as NavTab,
      label: '開單報價',
      icon: FilePlus2,
      badge: 0,
    },
    {
      id: 'orders' as NavTab,
      label: '訂單管理',
      icon: Package,
      badge: arrivedPendingBalanceCount > 0 ? arrivedPendingBalanceCount : 0,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'procurement' as NavTab,
      label: '採購彙總',
      icon: ShoppingCart,
      badge: pendingPurchaseCount > 0 ? pendingPurchaseCount : 0,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'reconciliation' as NavTab,
      label: '收款對帳',
      icon: Receipt,
      badge: pendingReconcileCount > 0 ? pendingReconcileCount : 0,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'wishes' as NavTab,
      label: '許願/詢價單',
      icon: Sparkles,
      badge: pendingWishCount > 0 ? pendingWishCount : 0,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'customers' as NavTab,
      label: '客戶管理',
      icon: Users,
      badge: 0,
    },
    {
      id: 'settings' as NavTab,
      label: '系統設定',
      icon: Settings,
      badge: 0,
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed slide-over on mobile, static column on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0 font-black text-sm">
              <Globe2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-wide text-white truncate">{shopName}</span>
              <span className="text-[10px] text-slate-400">跨國代購營運工作台</span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="關閉選單"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {onSwitchToStorefront && (
            <div className="pb-3 mb-2 border-b border-slate-800">
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onSwitchToStorefront();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  <span>開啟顧客下單前台</span>
                </div>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">
                  商城
                </span>
              </button>
            </div>
          )}

          <div className="px-3 pb-1.5 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            作業選單
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                      isActive ? 'bg-white text-blue-700' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mini Rate Indicator */}
        <div className="p-3 mx-3 mb-4 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-medium text-slate-300 flex items-center gap-1.5 text-[11px]">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> 代購報價匯率
            </span>
            <button
              onClick={() => handleSelectTab('settings')}
              className="text-[10px] text-blue-400 hover:underline cursor-pointer"
            >
              調整
            </button>
          </div>
          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] font-mono tabular-nums text-slate-300">
            <div>JPY: <span className="text-white font-medium">0.228</span></div>
            <div>KRW: <span className="text-white font-medium">0.0265</span></div>
            <div>USD: <span className="text-white font-medium">33.20</span></div>
            <div>EUR: <span className="text-white font-medium">35.80</span></div>
          </div>
        </div>
      </aside>
    </>
  );
};

