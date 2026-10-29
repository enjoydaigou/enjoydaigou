import React, { useState } from 'react';
import { Currency, ExchangeRateConfig, SystemSettings, StaffUser, StaffRole } from '../../types';
import {
  Settings,
  DollarSign,
  Building2,
  FileText,
  Save,
  Download,
  Upload,
  RefreshCw,
  Check,
  FileSpreadsheet,
  Store,
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Edit3,
  Key,
  Eye,
  EyeOff,
  Lock,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  CreditCard,
  Globe2,
  Plus,
  Cloud,
  Database,
  CheckCircle2,
} from 'lucide-react';
import {
  exportBackupJSON,
  restoreFromJSON,
  resetAllDataToDefault,
  clearAllDemoData,
  getStoredStaffUsers,
  saveStoredStaffUsers,
  getStoredCatalog,
  getStoredOrders,
  getStoredPayments,
  getStoredCustomers,
  getStoredWishRequests,
  getLocalStorageUsage,
} from '../../utils/storage';
import { exportComprehensiveWorkbookToExcel } from '../../utils/excelExport';
import { executeSafeCloudMigration } from '../../services/dbService';
import { testFirestoreConnection } from '../../services/firebase';

interface SettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  onDataMutated: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onDataMutated,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [savedToast, setSavedToast] = useState(false);

  // Staff Users State
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => getStoredStaffUsers());
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Staff Form Fields
  const [staffUsername, setStaffUsername] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('purchaser');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffStatus, setStaffStatus] = useState<'active' | 'disabled'>('active');
  const [staffError, setStaffError] = useState('');
  const [staffToast, setStaffToast] = useState('');

  // Country Management State
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [editingCountryCurrency, setEditingCountryCurrency] = useState<string | null>(null);
  const [countryFormName, setCountryFormName] = useState('');
  const [countryFormCode, setCountryFormCode] = useState('');
  const [countryFormSymbol, setCountryFormSymbol] = useState('');
  const [countryFormFlag, setCountryFormFlag] = useState('');
  const [countryFormQuoteRate, setCountryFormQuoteRate] = useState<number>(1);
  const [countryFormBaseRate, setCountryFormBaseRate] = useState<number>(1);
  const [countryFormAirFreight, setCountryFormAirFreight] = useState<number>(120);
  const [countryFormMinFee, setCountryFormMinFee] = useState<number>(100);
  const [countryFormActive, setCountryFormActive] = useState<boolean>(true);
  const [countryToast, setCountryToast] = useState('');

  const currentCountries: ExchangeRateConfig[] = formData.customCountries && formData.customCountries.length > 0
    ? formData.customCountries
    : [
        { currency: 'JPY', name: '日本連線', symbol: '¥', flag: '🇯🇵', baseRate: 0.212, quoteRate: 0.228, airFreightPerKg: 240, serviceFeePercent: 8, minServiceFeeTwd: 100, isActive: true },
        { currency: 'KRW', name: '韓國東大門', symbol: '₩', flag: '🇰🇷', baseRate: 0.024, quoteRate: 0.0265, airFreightPerKg: 200, serviceFeePercent: 10, minServiceFeeTwd: 120, isActive: true },
        { currency: 'CNY', name: '中國專櫃/旗艦店', symbol: '¥', flag: '🇨🇳', baseRate: 4.45, quoteRate: 4.85, airFreightPerKg: 120, serviceFeePercent: 8, minServiceFeeTwd: 100, isActive: true },
        { currency: 'USD', name: '美國官網/Outlet', symbol: '$', flag: '🇺🇸', baseRate: 31.8, quoteRate: 33.2, airFreightPerKg: 280, serviceFeePercent: 8, minServiceFeeTwd: 150, isActive: false },
        { currency: 'EUR', name: '歐洲專櫃精品', symbol: '€', flag: '🇪🇺', baseRate: 34.2, quoteRate: 35.8, airFreightPerKg: 350, serviceFeePercent: 7, minServiceFeeTwd: 200, isActive: false },
      ];

  const handleOpenAddCountry = () => {
    setEditingCountryCurrency(null);
    setCountryFormName('');
    setCountryFormCode('');
    setCountryFormSymbol('¥');
    setCountryFormFlag('🇨🇳');
    setCountryFormQuoteRate(4.85);
    setCountryFormBaseRate(4.45);
    setCountryFormAirFreight(120);
    setCountryFormMinFee(100);
    setCountryFormActive(true);
    setIsCountryModalOpen(true);
  };

  const handleOpenEditCountry = (c: ExchangeRateConfig) => {
    setEditingCountryCurrency(c.currency);
    setCountryFormName(c.name);
    setCountryFormCode(c.currency);
    setCountryFormSymbol(c.symbol || '¥');
    setCountryFormFlag(c.flag || '🌍');
    setCountryFormQuoteRate(c.quoteRate);
    setCountryFormBaseRate(c.baseRate);
    setCountryFormAirFreight(c.airFreightPerKg);
    setCountryFormMinFee(c.minServiceFeeTwd);
    setCountryFormActive(c.isActive ?? true);
    setIsCountryModalOpen(true);
  };

  const handleSaveCountry = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = countryFormCode.trim().toUpperCase();
    if (!cleanCode || !countryFormName.trim()) {
      alert('請填寫幣別代碼與國家名稱');
      return;
    }

    const newConfig: ExchangeRateConfig = {
      currency: cleanCode,
      name: countryFormName.trim(),
      symbol: countryFormSymbol.trim() || cleanCode,
      flag: countryFormFlag.trim() || '🌍',
      baseRate: Number(countryFormBaseRate) || 1,
      quoteRate: Number(countryFormQuoteRate) || 1,
      airFreightPerKg: Number(countryFormAirFreight) || 0,
      serviceFeePercent: 8,
      minServiceFeeTwd: Number(countryFormMinFee) || 100,
      isActive: countryFormActive,
    };

    setFormData((prev) => {
      const existingList = prev.customCountries && prev.customCountries.length > 0 ? prev.customCountries : currentCountries;
      let updatedList: ExchangeRateConfig[];
      if (editingCountryCurrency) {
        updatedList = existingList.map((item) =>
          item.currency === editingCountryCurrency ? newConfig : item
        );
      } else {
        const found = existingList.find((item) => item.currency === cleanCode);
        if (found) {
          updatedList = existingList.map((item) =>
            item.currency === cleanCode ? newConfig : item
          );
        } else {
          updatedList = [...existingList, newConfig];
        }
      }

      const updatedExchangeRates = {
        ...prev.exchangeRates,
        [cleanCode]: newConfig,
      };

      return {
        ...prev,
        customCountries: updatedList,
        exchangeRates: updatedExchangeRates,
      };
    });

    setIsCountryModalOpen(false);
    setCountryToast(editingCountryCurrency ? `已更新國家「${countryFormName.trim()}」` : `已新增國家「${countryFormName.trim()}」`);
    setTimeout(() => setCountryToast(''), 3000);
  };

  const handleToggleCountryActive = (cur: string) => {
    setFormData((prev) => {
      const existingList = prev.customCountries && prev.customCountries.length > 0 ? prev.customCountries : currentCountries;
      const updatedList = existingList.map((c) =>
        c.currency === cur ? { ...c, isActive: !(c.isActive ?? true) } : c
      );
      const updatedExchangeRates = { ...prev.exchangeRates };
      if (updatedExchangeRates[cur]) {
        updatedExchangeRates[cur] = {
          ...updatedExchangeRates[cur],
          isActive: !updatedExchangeRates[cur].isActive,
        };
      }
      return {
        ...prev,
        customCountries: updatedList,
        exchangeRates: updatedExchangeRates,
      };
    });
  };

  const handleDeleteCountry = (cur: string) => {
    if (confirm(`確定要刪除「${cur}」代購國家分類嗎？若為暫不連線，建議直接關閉【啟用】開關即可。`)) {
      setFormData((prev) => {
        const existingList = prev.customCountries && prev.customCountries.length > 0 ? prev.customCountries : currentCountries;
        const updatedList = existingList.filter((c) => c.currency !== cur);
        return {
          ...prev,
          customCountries: updatedList,
        };
      });
      setCountryToast(`已移除國家分類「${cur}」`);
      setTimeout(() => setCountryToast(''), 3000);
    }
  };

  const handleRateChange = (
    cur: Currency,
    field: keyof ExchangeRateConfig,
    val: number | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      exchangeRates: {
        ...prev.exchangeRates,
        [cur]: {
          ...prev.exchangeRates[cur],
          [field]: val,
        },
      },
    }));
  };

  const handleBankChange = (field: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      receivingBank: {
        ...prev.receivingBank,
        [field]: val,
      },
    }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleExport = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(formData.shopName || 'globalproxy').replace(/\s+/g, '_')}_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
            setStaffUsers(getStoredStaffUsers());
            alert('系統設定、使用人員與全站資料已成功還原！');
          } else {
            alert('檔案解析錯誤，無法還原');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('確定要還原成預設示範設定與資料嗎？這將覆蓋現有更動。')) {
      resetAllDataToDefault();
      onDataMutated();
      setStaffUsers(getStoredStaffUsers());
      alert('已恢復預設資料');
    }
  };

  const handleClearDemoData = () => {
    if (confirm('⚠️ 警告：確定要清空全站所有示範商品、委託訂單、對帳紀錄與客戶資料嗎？\n\n（清空後系統設定與後台人員帳號將保留，方便您歸零進行真實營運與下單測試）')) {
      if (confirm('再次確認：是否立即清空全站所有示範資料並開始營運測試？')) {
        clearAllDemoData();
        onDataMutated();
        alert('已成功清空所有示範資料！目前資料庫為空白歸零狀態，您可以開始進行真實營運與下單測試。');
      }
    }
  };


  // Cloud Database Migration States
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    counts?: {
      settingsCount: number;
      catalogCount: number;
      ordersCount: number;
      paymentsCount: number;
      customersCount: number;
      wishesCount: number;
      staffUsersCount: number;
    };
    error?: string;
  } | null>(null);
  const [cloudConnStatus, setCloudConnStatus] = useState<'unknown' | 'testing' | 'online' | 'offline'>('unknown');

  const handleTestCloudConnection = async () => {
    setCloudConnStatus('testing');
    const ok = await testFirestoreConnection();
    setCloudConnStatus(ok ? 'online' : 'offline');
  };

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    const catalog = getStoredCatalog();
    const orders = getStoredOrders();
    const payments = getStoredPayments();
    const customers = getStoredCustomers();
    const wishes = getStoredWishRequests();
    const staff = getStoredStaffUsers();

    const res = await executeSafeCloudMigration({
      settings: formData,
      catalog,
      orders,
      payments,
      customers,
      wishes,
      staffUsers: staff,
    });

    setIsMigrating(false);
    if (res.success) {
      setMigrationResult({ success: true, counts: res.migrated });
      onDataMutated();
    } else {
      setMigrationResult({ success: false, error: res.error });
    }
  };

  // Staff Management Actions
  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setStaffUsername('');
    setStaffName('');
    setStaffRole('purchaser');
    setStaffPassword('password123');
    setStaffPhone('');
    setStaffEmail('');
    setStaffStatus('active');
    setStaffError('');
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffUser) => {
    setEditingStaffId(staff.id);
    setStaffUsername(staff.username);
    setStaffName(staff.name);
    setStaffRole(staff.role);
    setStaffPassword(staff.password);
    setStaffPhone(staff.phone || '');
    setStaffEmail(staff.email || '');
    setStaffStatus(staff.status);
    setStaffError('');
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    const cleanUsername = staffUsername.trim().toLowerCase();
    const cleanName = staffName.trim();
    const cleanPassword = staffPassword.trim();

    if (!cleanUsername || !cleanName) {
      setStaffError('請填寫使用人員姓名與登入帳號');
      return;
    }

    if (cleanPassword.length < 4) {
      setStaffError('登入密碼長度至少需 4 碼以上');
      return;
    }

    // Check duplicate username
    const exists = staffUsers.find(
      (s) => s.username.toLowerCase() === cleanUsername && s.id !== editingStaffId
    );
    if (exists) {
      setStaffError('此登入帳號已被使用，請更換其他帳號！');
      return;
    }

    let updatedList: StaffUser[];
    if (editingStaffId) {
      updatedList = staffUsers.map((s) =>
        s.id === editingStaffId
          ? {
              ...s,
              username: cleanUsername,
              name: cleanName,
              role: staffRole,
              password: cleanPassword,
              phone: staffPhone.trim() || undefined,
              email: staffEmail.trim() || undefined,
              status: staffStatus,
            }
          : s
      );
      setStaffToast(`已成功更新人員「${cleanName}」帳號設定`);
    } else {
      const newStaff: StaffUser = {
        id: `staff-${Date.now()}`,
        username: cleanUsername,
        name: cleanName,
        role: staffRole,
        password: cleanPassword,
        phone: staffPhone.trim() || undefined,
        email: staffEmail.trim() || undefined,
        status: staffStatus,
        createdAt: new Date().toISOString(),
      };
      updatedList = [...staffUsers, newStaff];
      setStaffToast(`已成功新增後台人員「${cleanName}」！`);
    }

    setStaffUsers(updatedList);
    saveStoredStaffUsers(updatedList);
    setIsStaffModalOpen(false);
    setTimeout(() => setStaffToast(''), 3000);
  };

  const handleDeleteStaff = (staff: StaffUser) => {
    if (staff.role === 'super_admin') {
      const superAdmins = staffUsers.filter((s) => s.role === 'super_admin');
      if (superAdmins.length <= 1) {
        alert('系統必須保留至少一位超級管理員，不可刪除！');
        return;
      }
    }
    if (confirm(`確定要刪除使用人員「${staff.name} (${staff.username})」嗎？刪除後該人員將無法登入後台。`)) {
      const updatedList = staffUsers.filter((s) => s.id !== staff.id);
      setStaffUsers(updatedList);
      saveStoredStaffUsers(updatedList);
      setStaffToast(`已刪除使用人員「${staff.name}」`);
      setTimeout(() => setStaffToast(''), 3000);
    }
  };

  const handleToggleStaffStatus = (staff: StaffUser) => {
    if (staff.role === 'super_admin' && staff.status === 'active') {
      const activeSupers = staffUsers.filter((s) => s.role === 'super_admin' && s.status === 'active');
      if (activeSupers.length <= 1) {
        alert('不可停用最後一位啟用的超級管理員！');
        return;
      }
    }
    const newStatus = staff.status === 'active' ? 'disabled' : 'active';
    const updatedList = staffUsers.map((s) =>
      s.id === staff.id ? { ...s, status: newStatus as 'active' | 'disabled' } : s
    );
    setStaffUsers(updatedList);
    saveStoredStaffUsers(updatedList);
    setStaffToast(`已將「${staff.name}」狀態設為【${newStatus === 'active' ? '已啟用' : '已停用'}】`);
    setTimeout(() => setStaffToast(''), 3000);
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">👑 主管 / 主理人</span>;
      case 'purchaser':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🛍️ 採購專員</span>;
      case 'finance':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">💰 財務會計</span>;
      case 'customer_service':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">💬 客服專員</span>;
    }
  };

  const currencies: Currency[] = ['JPY', 'KRW', 'USD', 'EUR'];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner with Save Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            代購營運系統全域設定
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            設定賣場品牌名稱、管理人員登入帳號、換算匯率、每公斤國際空運費與收款帳戶
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          {savedToast ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedToast ? '設定已成功儲存！' : '儲存系統設定'}</span>
        </button>
      </div>

      {/* 1. 賣場品牌名稱與抬頭設定 (Requirement 1: 讓我可以修改賣場名稱) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            賣場名稱與品牌設定 (修改前台與報價顯示抬頭)
          </h3>
          <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
            即時同步至官網、後台與 LINE 文案
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              賣場品牌名稱 *
            </label>
            <input
              type="text"
              required
              value={formData.shopName || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, shopName: e.target.value }))}
              placeholder="例：GlobalProxy 連線代購 或 巴黎香榭日本連線"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              將顯示於後台側邊欄、前台頂部 Logo、LINE 報價單抬頭與訂單查詢頁面。
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              賣場副標題 / 品牌 Slogan (選填)
            </label>
            <input
              type="text"
              value={formData.shopSubtitle || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, shopSubtitle: e.target.value }))}
              placeholder="例：日本・韓國・歐美 專櫃直購 正品保證"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              顯示於前台首頁頂端橫幅與頁尾簡介。
            </p>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500">前台視覺效果即時預覽：</div>
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {(formData.shopName || 'GP').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">
                {formData.shopName || 'GlobalProxy 連線代購'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {formData.shopSubtitle || '專櫃直購 · 正品保證'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 客戶前台公告與特色標語設定 (可自行編輯前台主視覺橫幅文案) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              客戶前台公告與特色標語設定 (自訂前台橫幅文案)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              可隨時自訂修改前台大橫幅中的連線主題、價格透明化說明與三大特色保障標語
            </p>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-medium">
            前台即時更新生效
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                橫幅狀態標籤文字
              </label>
              <input
                type="text"
                value={formData.heroBadgeText ?? '本期現場連線中'}
                onChange={(e) => setFormData((prev) => ({ ...prev, heroBadgeText: e.target.value }))}
                placeholder="例：本期現場連線中 或 快閃開團中"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                前台主視覺大標題 *
              </label>
              <input
                type="text"
                value={formData.heroTitle ?? '日本吉卜力、Chiikawa、韓國東大門服飾現場連線中！'}
                onChange={(e) => setFormData((prev) => ({ ...prev, heroTitle: e.target.value }))}
                placeholder="例：日本吉卜力、Chiikawa、韓國東大門服飾現場連線中！"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              前台價格說明與公告內文 (客戶前台看到的文字) *
            </label>
            <textarea
              rows={3}
              value={formData.heroDescription ?? '✨ 價格透明化：商品皆標示「一口價（已含國際空運，免二補）」，直接確認台幣售價！ 下單後專人於海外專櫃/官網採購，抵台直接超商取貨或宅配到府。'}
              onChange={(e) => setFormData((prev) => ({ ...prev, heroDescription: e.target.value }))}
              placeholder="例：✨ 價格透明化：商品皆標示「一口價（已含國際空運，免二補）」..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              此欄位即為客人打開前台首頁時看到的說明文字，您可以自由更改優惠、運費規範或代購須知。
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              三大特色保障項目標籤 (勾選圖示旁文字)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">特色 1</span>
                <input
                  type="text"
                  value={formData.heroFeature1 ?? '一口價免二次催補款'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, heroFeature1: e.target.value }))}
                  placeholder="例：一口價免二次催補款"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">特色 2</span>
                <input
                  type="text"
                  value={formData.heroFeature2 ?? '支援 7-11 / 全家超取'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, heroFeature2: e.target.value }))}
                  placeholder="例：支援 7-11 / 全家超取"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">特色 3</span>
                <input
                  type="text"
                  value={formData.heroFeature3 ?? '全程訂單進度即時追蹤'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, heroFeature3: e.target.value }))}
                  placeholder="例：全程訂單進度即時追蹤"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Real-time Hero Card Live Preview */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-600">前台橫幅即時排版預覽：</span>
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-300">
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded text-blue-200">
                  {formData.heroBadgeText || '本期現場連線中'}
                </span>
                <span>· 專櫃直購 · 保證真品正貨</span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white">
                {formData.heroTitle || '日本吉卜力、Chiikawa、韓國東大門服飾現場連線中！'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {formData.heroDescription || '✨ 價格透明化：商品皆標示「一口價（已含國際空運，免二補）」，直接確認台幣售價！ 下單後專人於海外專櫃/官網採購，抵台直接超商取貨或宅配到府。'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{formData.heroFeature1 || '一口價免二次催補款'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{formData.heroFeature2 || '支援 7-11 / 全家超取'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{formData.heroFeature3 || '全程訂單進度即時追蹤'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 後台登入帳號密碼與使用人員管理 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              後台使用人員與登入帳號權限管理
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              新增小幫手、會計或客服人員登入帳號與密碼，掌控管理工作台存取權限
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddStaff}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>新增後台人員</span>
          </button>
        </div>

        {staffToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{staffToast}</span>
          </div>
        )}

        {/* Staff Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-bold">使用人員姓名</th>
                <th className="py-2.5 px-3.5 font-bold">登入帳號</th>
                <th className="py-2.5 px-3.5 font-bold">權限角色</th>
                <th className="py-2.5 px-3.5 font-bold">聯絡方式</th>
                <th className="py-2.5 px-3.5 font-bold text-center">狀態</th>
                <th className="py-2.5 px-3.5 font-bold">建立 / 登入時間</th>
                <th className="py-2.5 px-3.5 font-bold text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffUsers.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{staff.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">
                    {staff.username}
                  </td>
                  <td className="py-2.5 px-3.5">
                    {getRoleBadge(staff.role)}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                    <div>{staff.phone || '-'}</div>
                    <div className="text-[10px] text-slate-400">{staff.email || ''}</div>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStaffStatus(staff)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        staff.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {staff.status === 'active' ? '啟用中' : '已停用'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3.5 text-[10px] text-slate-400">
                    <div>建立: {staff.createdAt.slice(0, 10)}</div>
                    {staff.lastLoginAt && (
                      <div className="text-slate-500">登入: {staff.lastLoginAt.slice(0, 16).replace('T', ' ')}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStaff(staff)}
                        title="編輯帳號與密碼"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff)}
                        title="刪除人員"
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Currency Exchange Rates & Customizable Country Manager */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-600" />
              <span>代購國家分類與幣別匯率管理 (可自行新增、修改與停用)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              可依實際經營市場自由增減國家（例如新增中國連線，或停用沒在使用的美歐），啟用的國家將即時同步於前台與快速開單。
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddCountry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增代購國家 / 幣別</span>
          </button>
        </div>

        {countryToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{countryToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentCountries.map((conf) => {
            const isActive = conf.isActive ?? true;

            return (
              <div
                key={conf.currency}
                className={`p-4 rounded-xl border transition-all space-y-3 text-xs ${
                  isActive
                    ? 'border-slate-200 bg-slate-50/70'
                    : 'border-slate-200/60 bg-stone-100/60 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{conf.flag || '🌍'}</span>
                    <span className="truncate">{conf.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                      {conf.currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCountryActive(conf.currency)}
                      title={isActive ? '點擊停用（前台將隱藏）' : '點擊啟用'}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-200 text-stone-600 border border-stone-300'
                      }`}
                    >
                      {isActive ? '● 啟用中' : '○ 已停用'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCountry(conf)}
                      title="編輯國家與費率"
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCountry(conf.currency)}
                      title="刪除此國家"
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      市場參考基準匯率
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={conf.baseRate}
                      onChange={(e) =>
                        handleRateChange(conf.currency, 'baseRate', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-900 font-semibold mb-1">
                      代購報價換算匯率 *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={conf.quoteRate}
                      onChange={(e) =>
                        handleRateChange(conf.currency, 'quoteRate', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-mono font-bold text-blue-700 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate">
                      空運費 (NT$/kg)
                    </label>
                    <input
                      type="number"
                      value={conf.airFreightPerKg}
                      onChange={(e) =>
                        handleRateChange(conf.currency, 'airFreightPerKg', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate">
                      貨幣符號
                    </label>
                    <input
                      type="text"
                      value={conf.symbol || '¥'}
                      onChange={(e) =>
                        handleRateChange(conf.currency, 'symbol', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate">
                      低消代購費 (NT$)
                    </label>
                    <input
                      type="number"
                      value={conf.minServiceFeeTwd}
                      onChange={(e) =>
                        handleRateChange(conf.currency, 'minServiceFeeTwd', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deposit & Payment Policy Settings (統一由後台設定，免除客人自行選擇) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>前台顧客結帳付款規範與訂金成數（統一由後台管理）</span>
          </h3>
          <span className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">
            客人下單時依此規範直接結算
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          您可以統一設定顧客在前台下單時的付款政策。客人提交委託單時將自動套用此規則，不再讓客人自行選成數。
        </p>

        {/* Radio Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              (formData.depositPaymentPolicy || 'deposit_50') === 'deposit_50'
                ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/30'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="depositPolicy"
                value="deposit_50"
                checked={(formData.depositPaymentPolicy || 'deposit_50') === 'deposit_50'}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    depositPaymentPolicy: 'deposit_50',
                    customDepositRatio: 0.5,
                  }))
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="font-bold text-xs text-slate-900">收取 50% 訂金 (推薦)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              下單先收 50% 商品訂金安排採購，抵台後開賣貨便收取尾款放行出貨。
            </p>
          </label>

          <label
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              formData.depositPaymentPolicy === 'full'
                ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="depositPolicy"
                value="full"
                checked={formData.depositPaymentPolicy === 'full'}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    depositPaymentPolicy: 'full',
                    customDepositRatio: 1.0,
                  }))
                }
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-xs text-slate-900">100% 全額結清</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              下單時即收齊 100% 商品款項，一口價免二補商品免二次收款。
            </p>
          </label>

          <label
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              formData.depositPaymentPolicy === 'deposit_custom'
                ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600/30'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="depositPolicy"
                value="deposit_custom"
                checked={formData.depositPaymentPolicy === 'deposit_custom'}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    depositPaymentPolicy: 'deposit_custom',
                  }))
                }
                className="text-purple-600 focus:ring-purple-500"
              />
              <span className="font-bold text-xs text-slate-900">自訂訂金比例</span>
            </div>
            {formData.depositPaymentPolicy === 'deposit_custom' ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={90}
                  step={5}
                  value={Math.round((formData.customDepositRatio || 0.5) * 100)}
                  onChange={(e) => {
                    const pct = Math.max(5, Math.min(95, parseFloat(e.target.value) || 50));
                    setFormData((prev) => ({
                      ...prev,
                      customDepositRatio: pct / 100,
                    }));
                  }}
                  className="w-16 px-2 py-1 bg-white border border-purple-300 rounded text-xs font-mono font-bold text-purple-900"
                />
                <span className="text-xs font-bold text-purple-900">%</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                自行指定收取比例 (例: 30%, 70%)。
              </p>
            )}
          </label>
        </div>

        {/* Policy Explanatory Note & 賣貨便 Notice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              訂金說明文案（顯示於前台結帳頁）
            </label>
            <input
              type="text"
              value={formData.depositPolicyNote || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, depositPolicyNote: e.target.value }))}
              placeholder="例：全館採兩階段付款，下單收取 50% 訂金，抵台後開立賣貨便收取尾款。"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              7-11 賣貨便出貨提醒說明（前台免填門市之說明）
            </label>
            <input
              type="text"
              value={formData.deliveryNotice || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, deliveryNotice: e.target.value }))}
              placeholder="例：商品抵台後，店主將直接透過 LINE 為您開設專屬「7-11 賣貨便」賣場出貨。"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Receiving Bank Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          團隊收款帳戶 (提供給顧客匯款)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">銀行機構與代碼</label>
            <input
              type="text"
              value={formData.receivingBank.bankName}
              onChange={(e) => handleBankChange('bankName', e.target.value)}
              placeholder="例：玉山銀行 (808)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">銀行代碼 (3碼)</label>
            <input
              type="text"
              value={formData.receivingBank.bankCode}
              onChange={(e) => handleBankChange('bankCode', e.target.value)}
              placeholder="例：808"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">匯款帳號</label>
            <input
              type="text"
              value={formData.receivingBank.accountNo}
              onChange={(e) => handleBankChange('accountNo', e.target.value)}
              placeholder="例：1388-979-018264"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-semibold"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">戶名</label>
            <input
              type="text"
              value={formData.receivingBank.accountHolder}
              onChange={(e) => handleBankChange('accountHolder', e.target.value)}
              placeholder="例：全球代購工作室"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            轉帳後對帳回報備註說明
          </label>
          <input
            type="text"
            value={formData.receivingBank.note}
            onChange={(e) => handleBankChange('note', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* 4. 會員註冊與下單自訂問卷欄位 (詢問社群名稱/FB社團/推薦人等) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              會員註冊與下單自訂問卷欄位 (例: 社群/社團顯示暱稱)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              您可以自由自訂前台會員註冊與結帳時需填寫額外欄位名稱（例如詢問顧客在 LINE 群組/FB 社團的顯示名稱，方便核對對話人身份）。
            </p>
          </div>
          <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded font-medium">
            全彈性自由自訂
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              自訂問卷欄位名稱 / 標題 *
            </label>
            <input
              type="text"
              value={formData.customRegFieldLabel ?? 'LINE 社群/社團顯示暱稱'}
              onChange={(e) => setFormData((prev) => ({ ...prev, customRegFieldLabel: e.target.value }))}
              placeholder="例如: LINE社群暱稱、FB社團名稱、或推薦人"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              顧客在註冊新帳號、下單結帳或提交圖片許願時，將會看見此欄位名稱。
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              輸入框提示說明 (Placeholder)
            </label>
            <input
              type="text"
              value={formData.customRegFieldPlaceholder ?? '例如：威廉-台北VIP群、Jessica (社團暱稱)'}
              onChange={(e) => setFormData((prev) => ({ ...prev, customRegFieldPlaceholder: e.target.value }))}
              placeholder="例如：請填寫您在連線 LINE 群組內的暱稱"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isCustomRegFieldRequired"
            checked={formData.isCustomRegFieldRequired ?? false}
            onChange={(e) => setFormData((prev) => ({ ...prev, isCustomRegFieldRequired: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="isCustomRegFieldRequired" className="text-xs font-bold text-slate-800 cursor-pointer">
            設為顧客註冊/下單必填項目
          </label>
        </div>
      </div>

      {/* 5. 前台圖片許願詢價區設定 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              前台圖片許願詢價區設定
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              開啟後，顧客可在前台自由傳圖片或網址許願商品，小幫手可於後台直接計算並回覆報價。
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enableWishlistArea ?? true}
              onChange={(e) => setFormData((prev) => ({ ...prev, enableWishlistArea: e.target.checked }))}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs font-bold text-slate-800">開啟前台許願區</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            許願詢價須知說明文案
          </label>
          <textarea
            rows={2}
            value={formData.wishlistNotice ?? '貼上想要代購的商品照片、官網或小紅書連結，小幫手將於專櫃現場為您即時算價與回覆專屬報價！'}
            onChange={(e) => setFormData((prev) => ({ ...prev, wishlistNotice: e.target.value }))}
            placeholder="請輸入給許願顧客看的情報或說明..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Domestic Shipping Rates */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">台灣本地配送運費預設</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">超商取貨運費 (NT$)</label>
            <input
              type="number"
              value={formData.domesticShippingRates.convenienceStore}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  domesticShippingRates: {
                    ...prev.domesticShippingRates,
                    convenienceStore: parseFloat(e.target.value) || 0,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">黑貓宅配到府運費 (NT$)</label>
            <input
              type="number"
              value={formData.domesticShippingRates.homeDelivery}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  domesticShippingRates: {
                    ...prev.domesticShippingRates,
                    homeDelivery: parseFloat(e.target.value) || 0,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>
      </div>

      {/* Shop Terms / Copy */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" />
          代購委託須知條款 (顯示於報價文案)
        </h3>
        <textarea
          rows={4}
          value={formData.shopNotice}
          onChange={(e) => setFormData((prev) => ({ ...prev, shopNotice: e.target.value }))}
          className="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed"
        />
      </div>

      {/* Backup & System Reset */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">資料備份與安全還原</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          您可以隨時將所有代購委託單、海外採購明細、收款對帳清單、人員帳號與客戶資料匯出為標準 Excel 檔案 (.xlsx) 或 JSON 完整資料備份檔。
        </p>

        {/* Local Storage Capacity Monitor */}
        {(() => {
          const usage = getLocalStorageUsage();
          const isWarning = usage.percentEstimate >= 80;
          return (
            <div className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isWarning ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{isWarning ? '⚠️' : '💾'}</span>
                <div>
                  <span className="font-bold">本機瀏覽器儲存容量 (Local Storage)：</span>
                  <span>已使用約 <strong>{usage.usedMb} MB</strong> / 預估上限 5.0 MB ({usage.percentEstimate}%)</span>
                  {isWarning && (
                    <span className="ml-2 text-rose-600 font-bold">接近上限！請勿直接貼入超大解析度圖片，建議定期匯出備份。</span>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-32 bg-slate-200 rounded-full h-2 overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full ${isWarning ? 'bg-amber-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(100, usage.percentEstimate)}%` }}
                />
              </div>
            </div>
          );
        })()}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportComprehensiveWorkbookToExcel()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>匯出完整 Excel 報表檔 (.xlsx)</span>
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出 JSON 備份</span>
          </button>

          <button
            onClick={handleImport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>匯入並還原備份檔</span>
          </button>

          <button
            onClick={handleClearDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="清空全站示範商品、訂單、對帳與客戶資料，歸零開始真實測試"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>🗑️ 一鍵清空所有示範資料 (歸零重置測試)</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>還原為初始示範資料</span>
          </button>
        </div>
      </div>

      {/* Cloud Firestore Status & Safe Migration */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-800/60 rounded-xl p-5 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg shadow-xs">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Firebase 雲端資料庫狀態</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Cloud Firestore
                </span>
              </h3>
              <p className="text-xs text-blue-200/80">
                跨裝置自動永久存儲 · 支援手機與電腦即時同步
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestCloudConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-800/60 hover:bg-blue-700 text-blue-100 border border-blue-600/50 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {cloudConnStatus === 'testing'
                  ? '連線檢測中...'
                  : cloudConnStatus === 'online'
                  ? '🟢 連線正常 (已通訊)'
                  : cloudConnStatus === 'offline'
                  ? '🔴 無法連線'
                  : '檢測雲端連線'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMigrationResult(null);
                setIsMigrationModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>啟動安全資料遷移精靈</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-[11px] text-blue-200">商品庫</div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {getStoredCatalog().length} <span className="text-xs font-normal text-blue-300">款</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-[11px] text-blue-200">訂單總量</div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {getStoredOrders().length} <span className="text-xs font-normal text-blue-300">筆</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-[11px] text-blue-200">客戶 CRM</div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {getStoredCustomers().length} <span className="text-xs font-normal text-blue-300">位</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-[11px] text-blue-200">許願詢價單</div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {getStoredWishRequests().length} <span className="text-xs font-normal text-blue-300">則</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-blue-200/70 flex items-center justify-between">
          <span>專案 ID: <strong className="font-mono text-white">noted-focus-wpthm</strong> · 資料庫 ID: <strong className="font-mono text-white">ai-studio-16855e39-9011-474a-9fe1-49c4e7624a24</strong></span>
          <span className="text-emerald-400 font-medium">✓ 已套用嚴格 ABAC 安全規則</span>
        </div>
      </div>

      {/* Migration Wizard Modal */}
      {isMigrationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  本地資料安全遷移至雲端 Firestore
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMigrationModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>資料隱私與脫敏安全防護</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  系統在將資料寫入雲端前，已自動<strong>剔除所有客戶與工作人員的本地明文密碼</strong>。密碼全面改由 Google Firebase Authentication 進行獨立加密驗證，確保個資絕不洩漏。
                </p>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-2">本次即將同步遷移至雲端的資料筆數：</div>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-medium">
                  <div className="flex justify-between">
                    <span>• 賣場與多國匯率設定</span>
                    <span className="font-mono font-bold text-blue-700">1 組設定文檔</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 商品上架庫品項</span>
                    <span className="font-mono font-bold text-blue-700">{getStoredCatalog().length} 筆</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 代購委託訂單</span>
                    <span className="font-mono font-bold text-blue-700">{getStoredOrders().length} 筆</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 轉帳末五碼付款紀錄</span>
                    <span className="font-mono font-bold text-blue-700">{getStoredPayments().length} 筆</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 客戶 CRM 資料庫</span>
                    <span className="font-mono font-bold text-blue-700">{getStoredCustomers().length} 位 (已去除密碼)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 顧客傳圖許願單</span>
                    <span className="font-mono font-bold text-blue-700">{getStoredWishRequests().length} 則</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 後台使用人員名冊</span>
                    <span className="font-mono font-bold text-blue-700">{getStoredStaffUsers().length} 位 (已去除密碼)</span>
                  </div>
                </div>
              </div>

              {migrationResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    migrationResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {migrationResult.success ? (
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>✅ 恭喜！資料已成功寫入 Firebase Cloud Firestore！</span>
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        所有設定、商品與訂單已安全託管於雲端，換電腦或重整頁面皆可完整載入。
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="font-bold text-rose-800">⚠️ 遷移失敗</div>
                      <div className="text-[11px] text-rose-700">{migrationResult.error}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>遷移前先下載本機 JSON 備份</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMigrationModalOpen(false)}
                    className="px-3.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    關閉
                  </button>
                  <button
                    type="button"
                    disabled={isMigrating}
                    onClick={handleStartMigration}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{isMigrating ? '正在寫入雲端 Firestore...' : '確認執行遷移上雲'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Staff Add/Edit Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingStaffId ? '編輯後台使用人員' : '新增後台使用人員'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  人員姓名 *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="例：小幫手 Alice"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  後台登入帳號 *
                </label>
                <input
                  type="text"
                  required
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="例：alice 或 helper01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  權限角色 *
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="super_admin">👑 主管 / 主理人 (最高管理權限)</option>
                  <option value="purchaser">🛍️ 採購專員 (海外商品採購與核銷)</option>
                  <option value="finance">💰 財務會計 (訂金與尾款末五碼審核)</option>
                  <option value="customer_service">💬 客服專員 (客戶溝通與訂單進度)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  登入密碼 * (至少 4 碼)
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">聯絡電話 (選填)</label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="09xx-xxx-xxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">帳號狀態</label>
                  <select
                    value={staffStatus}
                    onChange={(e) => setStaffStatus(e.target.value as 'active' | 'disabled')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="active">正常啟用</option>
                    <option value="disabled">停用帳號</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">電子信箱 (選填)</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              {staffError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {editingStaffId ? '儲存變更' : '確認新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Country Add/Edit Modal */}
      {isCountryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingCountryCurrency ? '編輯代購國家與費率' : '新增自訂代購國家 / 幣別'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCountryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCountry} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    國家分類名稱 *
                  </label>
                  <input
                    type="text"
                    required
                    value={countryFormName}
                    onChange={(e) => setCountryFormName(e.target.value)}
                    placeholder="例：中國專櫃/旗艦店"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    幣別代碼 (3 碼) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={countryFormCode}
                    onChange={(e) => setCountryFormCode(e.target.value.toUpperCase())}
                    placeholder="例：CNY"
                    disabled={!!editingCountryCurrency}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900 uppercase disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    國旗圖示 Emoji
                  </label>
                  <input
                    type="text"
                    value={countryFormFlag}
                    onChange={(e) => setCountryFormFlag(e.target.value)}
                    placeholder="例：🇨🇳 或 🇯🇵 或 🇰🇷"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base text-center"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    貨幣符號
                  </label>
                  <input
                    type="text"
                    value={countryFormSymbol}
                    onChange={(e) => setCountryFormSymbol(e.target.value)}
                    placeholder="例：¥ 或 ₩ 或 $"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    代購報價換算匯率 *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={countryFormQuoteRate}
                    onChange={(e) => setCountryFormQuoteRate(parseFloat(e.target.value) || 0)}
                    placeholder="4.85"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-mono font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    市場參考基準匯率
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={countryFormBaseRate}
                    onChange={(e) => setCountryFormBaseRate(parseFloat(e.target.value) || 0)}
                    placeholder="4.45"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    空運費 (NT$/kg)
                  </label>
                  <input
                    type="number"
                    value={countryFormAirFreight}
                    onChange={(e) => setCountryFormAirFreight(parseFloat(e.target.value) || 0)}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    單件低消代購費 (NT$)
                  </label>
                  <input
                    type="number"
                    value={countryFormMinFee}
                    onChange={(e) => setCountryFormMinFee(parseFloat(e.target.value) || 0)}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-900 block">前台與開單立即啟用</span>
                  <span className="text-[11px] text-slate-500">若關閉則前台顧客與開單選單暫不顯示此國家</span>
                </div>
                <input
                  type="checkbox"
                  checked={countryFormActive}
                  onChange={(e) => setCountryFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCountryModalOpen(false)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {editingCountryCurrency ? '儲存變更' : '確認新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
