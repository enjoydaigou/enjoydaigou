import React, { useState } from 'react';
import { Customer, UserSession } from '../../types';
import {
  ShoppingBag,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  HelpCircle,
  MessageCircle,
  Phone,
  Store,
  KeyRound,
  Check,
  LogIn,
  Layers,
} from 'lucide-react';

interface LoginViewProps {
  customers: Customer[];
  onLoginAsCustomer: (customer: Customer) => void;
  onLoginAsAdmin: () => void;
  onNavigateToShop: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  customers,
  onLoginAsCustomer,
  onLoginAsAdmin,
  onNavigateToShop,
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');

  // Customer Form State
  const [lineId, setLineId] = useState('');
  const [lineName, setLineName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Admin Form State
  const [adminAccount, setAdminAccount] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Handle Customer Login or Registration
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanLineId = lineId.trim();
    if (!cleanLineId) {
      setErrorMsg('請填寫你的 LINE ID 或 LINE 帳號');
      return;
    }

    // Check if customer already exists by LINE ID
    const existing = customers.find(
      (c) => c.lineId.toLowerCase() === cleanLineId.toLowerCase()
    );

    if (existing) {
      onLoginAsCustomer(existing);
      return;
    }

    // Otherwise create new customer
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: lineName.trim() || cleanLineId,
      lineId: cleanLineId,
      phone: phone.trim() || '0900-000-000',
      delivery: {
        type: '7-11',
        storeName: storeName.trim() || '7-11 常用門市',
      },
      tag: '新客',
      totalSpentTwd: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };

    onLoginAsCustomer(newCust);
  };

  // Quick Demo Login for existing customer
  const handleQuickCustomer = (cust: Customer) => {
    onLoginAsCustomer(cust);
  };

  // Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    // Allow any demo password or empty
    onLoginAsAdmin();
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      {/* Top Brand Banner */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 mb-3">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>Tama桑日韓代購 🛒</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          日本、韓國代購開團中。挑選商品、送出訂單、回報匯款與查詢出貨進度，一站完成。
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'customer'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>顧客登記 / 登入</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>團主 / 管理員後台</span>
          </button>
        </div>

        {/* Tab 1: Customer Login / Register */}
        {activeTab === 'customer' && (
          <div className="p-6 space-y-5">
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 text-xs text-emerald-900">
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>免記密碼！用 LINE ID 快速登記與查單</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                輸入你在 LINE 群組使用的 ID 或暱稱，就能隨時檢視開團商品、查訂單狀態與回報匯款。
              </p>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  帳號（LINE ID）<span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="例如：jessica_lin88 或你的 LINE 名稱"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  登入時要用的主要帳號，之後可在這查詢所有代購單。
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  LINE 顯示名稱（選填）
                </label>
                <input
                  type="text"
                  value={lineName}
                  onChange={(e) => setLineName(e.target.value)}
                  placeholder="你在 LINE 社群顯示的暱稱，方便團主對人"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    聯絡手機（選填）
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912-345-678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    常用超商門市（選填）
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="7-11 威秀門市"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>登入 / 登記並前往選購</span>
              </button>
            </form>

            {/* Quick Demo Customer Login Pills */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block mb-2">
                或點擊下方示範顧客帳號，一鍵快速登入體驗：
              </span>
              <div className="flex flex-wrap gap-2">
                {customers.slice(0, 3).map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleQuickCustomer(cust)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-lg text-xs text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{cust.name}</span>
                    <span className="text-[10px] text-slate-400">({cust.lineId})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Admin / Buyer Back-office Login */}
        {activeTab === 'admin' && (
          <div className="p-6 space-y-5">
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-900">
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>團主與買手營運後台</span>
              </div>
              <p className="text-[11px] text-blue-800/90 leading-relaxed">
                全功能包含開團上架、訂單審核、海外買手採購單、秤重二補、末五碼對帳與 Excel 匯出。
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  管理員帳號
                </label>
                <input
                  type="text"
                  value={adminAccount}
                  onChange={(e) => setAdminAccount(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  後台通行密碼 / 邀請碼
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="預設免密碼或輸入任何密碼"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {adminError && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>進入團主管理後台</span>
              </button>
            </form>

            {/* Quick Demo Admin Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onLoginAsAdmin}
                className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>🚀 一鍵體驗進入團主管理後台 (免密碼)</span>
              </button>
            </div>

            {/* Password recovery hint matching reference site */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                忘記密碼時不用擔心：直接在 LINE 上跟團主說，團主會給你一組臨時密碼，登入後再回來這裡改成自己的密碼。
              </span>
            </div>
          </div>
        )}

        {/* Footer Link to Shop */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onNavigateToShop}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>直接以訪客身份逛開團商品</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bottom Features Showcase matching reference */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full text-center text-xs text-slate-500">
        <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60 shadow-2xs">
          <div className="font-bold text-slate-800 mb-0.5">🛒 連線開團選購</div>
          <div>多品項自由選購，規格清楚，一口價免二次補款</div>
        </div>
        <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60 shadow-2xs">
          <div className="font-bold text-slate-800 mb-0.5">📦 隨時查單查物流</div>
          <div>LINE ID 一鍵查單，追蹤過秤、抵台與超取單號</div>
        </div>
        <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60 shadow-2xs">
          <div className="font-bold text-slate-800 mb-0.5">🏦 合併付款與對帳</div>
          <div>支援多筆訂單合併匯款，末五碼線上即時回報</div>
        </div>
      </div>
    </div>
  );
};
