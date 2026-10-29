import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Sparkles,
  Store,
  AlertCircle,
} from 'lucide-react';
import { StaffUser, SystemSettings } from '../../types';

interface AdminLoginViewProps {
  settings: SystemSettings;
  staffUsers: StaffUser[];
  onLoginSuccess: (user: StaffUser) => void;
  onReturnToStorefront: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  settings,
  staffUsers,
  onLoginSuccess,
  onReturnToStorefront,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg('請輸入管理員帳號與登入密碼！');
      return;
    }

    const matched = staffUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (u.email && u.email.toLowerCase() === cleanUsername)
    );

    if (!matched) {
      setErrorMsg('查無此管理員帳號，請確認輸入是否正確。');
      return;
    }

    if (matched.status === 'disabled') {
      setErrorMsg('此使用人員帳號已被停用，請聯絡主理人或系統超級管理員。');
      return;
    }

    if (matched.password !== cleanPassword) {
      setErrorMsg('登入密碼錯誤，請重新確認！(預設密碼請參考下方快捷按鈕)');
      return;
    }

    // Success! Update last login
    const updatedUser: StaffUser = {
      ...matched,
      lastLoginAt: new Date().toISOString(),
    };
    onLoginSuccess(updatedUser);
  };

  const handleQuickFill = (demoUsername: string, demoPass: string) => {
    setUsername(demoUsername);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-fade-in">
        {/* Card Header with Shop Name */}
        <div className="p-6 bg-slate-900 text-white text-center relative border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {settings.shopName || 'GlobalProxy 連線代購'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">後台管理人員安全登入系統</p>
        </div>

        {/* Demo Fast Logins */}
        <div className="px-6 pt-4 pb-1 bg-blue-50/70 border-b border-blue-100 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>示範帳號一鍵快速填入：</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pb-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="px-2 py-1.5 bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              <div>👑 總管理員</div>
              <div className="text-[9px] text-slate-400 font-mono font-normal">admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('wendy', 'password123')}
              className="px-2 py-1.5 bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              <div>🛍️ 小幫手 Wendy</div>
              <div className="text-[9px] text-slate-400 font-mono font-normal">wendy</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('finance_alice', 'password123')}
              className="px-2 py-1.5 bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              <div>💰 會計 Alice</div>
              <div className="text-[9px] text-slate-400 font-mono font-normal">finance</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              後台登入帳號 / Email *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入帳號 (例：admin 或 wendy)"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              管理登入密碼 *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>登入代購營運工作台</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={onReturnToStorefront}
              className="text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回顧客下單前台</span>
            </button>
            <span className="text-[11px] text-slate-400">系統版本 v2.5</span>
          </div>
        </form>
      </div>
    </div>
  );
};
