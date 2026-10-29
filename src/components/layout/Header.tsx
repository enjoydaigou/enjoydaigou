import React from 'react';
import { NavTab } from './Sidebar';
import {
  Plus,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  ShoppingBag,
  Menu,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { StaffUser } from '../../types';
import { exportBackupJSON, restoreFromJSON, resetAllDataToDefault } from '../../utils/storage';
import { exportComprehensiveWorkbookToExcel } from '../../utils/excelExport';

interface HeaderProps {
  activeTab: NavTab;
  onNavigateToQuoting: () => void;
  onDataMutated: () => void;
  onSwitchToStorefront: () => void;
  onToggleMobileMenu?: () => void;
  currentAdmin?: StaffUser | null;
  onLogoutAdmin?: () => void;
  shopName?: string;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  overview: { title: '營運總覽', subtitle: '全盤掌握代購營業額、二階段帳款、即時預警與匯率狀態' },
  catalog: { title: '商品上架庫', subtitle: '建立連線與常態代購商品庫，支援一鍵帶入快速開單與複製推文文案' },
  quoting: { title: '開單管理', subtitle: '原幣換算、服務費計算與一鍵生成 LINE/IG 顧客報價單' },
  orders: { title: '訂單管理', subtitle: '全生命週期管道追蹤：訂金、海外採購、抵台秤重與出貨' },
  procurement: { title: '採購彙總', subtitle: '跨訂單商品自動聚合，買手現場或官網下單專用清單' },
  reconciliation: { title: '收款對帳', subtitle: '第一階段訂金與第二階段尾款末五碼核銷工作台' },
  wishes: { title: '許願/詢價單', subtitle: '查看顧客傳圖許願詢價需求，快速填寫估價單或一鍵轉上架與開單' },
  customers: { title: '客戶管理', subtitle: '顧客資料庫、超商取件門市、委託紀錄與 VIP 級別' },
  settings: { title: '系統設定', subtitle: '多國代購匯率、國際運費、服務費率與收款帳戶維護' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigateToQuoting,
  onDataMutated,
  onSwitchToStorefront,
  onToggleMobileMenu,
  currentAdmin,
  onLogoutAdmin,
  shopName = 'GlobalProxy 連線代購',
}) => {
  const current = TAB_TITLES[activeTab] || { title: '代購後台', subtitle: '' };

  const handleExportExcel = () => {
    exportComprehensiveWorkbookToExcel();
  };

  const handleExportJson = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `globalproxy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = restoreFromJSON(content);
          if (success) {
            onDataMutated();
            alert('資料還原成功！');
          } else {
            alert('檔案格式錯誤，無法還原');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('確定要重設為預設代購示範資料嗎？現有自訂修改將會被覆蓋。')) {
      resetAllDataToDefault();
      onDataMutated();
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return '主管 / 主理人';
      case 'purchaser':
        return '採購專員';
      case 'finance':
        return '財務會計';
      case 'customer_service':
        return '客服專員';
      default:
        return '管理人員';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-10">
      {/* Left: Mobile Hamburger & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="打開選單"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center text-xs text-slate-500 font-medium truncate">
          <span className="hidden sm:inline font-semibold text-slate-700">{shopName}</span>
          <span className="hidden sm:inline mx-1.5 text-slate-300">/</span>
          <span className="text-slate-900 font-bold text-sm sm:text-xs truncate">{current.title}</span>
        </div>
      </div>

      {/* Right Action Zone */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Current Admin User Tag */}
        {currentAdmin && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="font-bold text-slate-800">{currentAdmin.name}</span>
              <span className="text-[9px] text-slate-400">{getRoleLabel(currentAdmin.role)}</span>
            </div>
          </div>
        )}

        {/* Quick Quote Button */}
        {activeTab !== 'quoting' && (
          <button
            onClick={onNavigateToQuoting}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">開單報價</span>
            <span className="sm:hidden">開單</span>
          </button>
        )}

        {/* Storefront preview button */}
        <button
          onClick={onSwitchToStorefront}
          title="切換至顧客網站下單前台（檢視買家公開下單商城）"
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">商城前台</span>
        </button>

        {/* Export Excel Button */}
        <button
          onClick={handleExportExcel}
          title="匯出完整 Excel 報表檔 (.xlsx)"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Excel</span>
        </button>

        {/* Backup Buttons (Desktop only) */}
        <button
          onClick={handleExportJson}
          title="匯出 JSON 備份檔"
          className="hidden xl:inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>備份</span>
        </button>

        <button
          onClick={handleImport}
          title="匯入 JSON 備份檔"
          className="hidden xl:inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>還原</span>
        </button>

        {/* Admin Logout */}
        {onLogoutAdmin && (
          <button
            type="button"
            onClick={onLogoutAdmin}
            title="登出管理工作台"
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-rose-50/80 border border-rose-200/80 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">登出</span>
          </button>
        )}
      </div>
    </header>
  );
};

