import React, { useState, useMemo } from 'react';
import {
  WishRequest,
  SystemSettings,
  Currency,
  CatalogProduct,
  Customer,
} from '../../types';
import { formatTwd, formatDateTime } from '../../utils/format';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  ArrowRight,
  FilePlus2,
  Tags,
  MessageCircle,
  Phone,
  User,
  Globe2,
  ExternalLink,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface WishesViewProps {
  wishRequests: WishRequest[];
  settings: SystemSettings;
  customers?: Customer[];
  onUpdateWish: (wish: WishRequest) => void;
  onConvertToQuote: (wish: WishRequest, quotedPriceTwd: number) => void;
  onConvertToCatalog: (wish: WishRequest, priceTwd: number) => void;
}

export const WishesView: React.FC<WishesViewProps> = ({
  wishRequests = [],
  settings,
  customers = [],
  onUpdateWish,
  onConvertToQuote,
  onConvertToCatalog,
}) => {
  const wishes = wishRequests;
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'quoted' | 'converted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWish, setSelectedWish] = useState<WishRequest | null>(null);

  // Quote Form inside modal
  const [quotePrice, setQuotePrice] = useState<number | ''>('');
  const [quoteAdminNote, setQuoteAdminNote] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Filtered Wish Requests
  const filteredWishes = useMemo(() => {
    return wishes.filter((w) => {
      if (filterStatus !== 'all' && w.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = w.productName.toLowerCase().includes(q);
        const matchCustomer = w.customerName.toLowerCase().includes(q);
        const matchPhone = w.customerPhone.includes(q);
        const matchCommunity = w.communityName?.toLowerCase().includes(q);
        const matchWishNo = w.wishNo.toLowerCase().includes(q);
        if (!matchName && !matchCustomer && !matchPhone && !matchCommunity && !matchWishNo) return false;
      }
      return true;
    });
  }, [wishes, filterStatus, searchQuery]);

  const pendingCount = wishes.filter((w) => w.status === 'pending').length;
  const quotedCount = wishes.filter((w) => w.status === 'quoted').length;

  const handleOpenDetail = (wish: WishRequest) => {
    setSelectedWish(wish);
    setQuotePrice(wish.quotedPriceTwd || '');
    setQuoteAdminNote(wish.adminNote || '');
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWish) return;
    if (!quotePrice || Number(quotePrice) <= 0) {
      alert('請填寫有效的報價金額！');
      return;
    }

    const updated: WishRequest = {
      ...selectedWish,
      quotedPriceTwd: Number(quotePrice),
      adminNote: quoteAdminNote.trim() || undefined,
      status: 'quoted',
      quotedAt: new Date().toISOString(),
    };

    onUpdateWish(updated);
    setSelectedWish(updated);
    setToastMsg('已成功儲存報價！顧客前台登入後即可看見專屬報價。');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-500/30 border border-purple-400/40 rounded text-purple-200 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>圖片許願與商品詢價區</span>
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white font-mono text-xs font-bold rounded-full animate-pulse">
                {pendingCount} 件待處理解答
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            顧客圖片許願與報價處理中心
          </h2>
          <p className="text-xs text-purple-200/80 leading-relaxed max-w-2xl">
            顧客於前台上傳圖片或商品連結許願詢價，小幫手可在此直接計算台幣一口價並輸入專屬報價，並一鍵轉為正式訂單或上架至商品庫！
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shrink-0 text-xs">
          <div className="text-center px-2">
            <div className="text-lg font-mono font-black text-amber-300">{pendingCount}</div>
            <div className="text-[10px] text-purple-200">待報價</div>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center px-2">
            <div className="text-lg font-mono font-black text-emerald-300">{quotedCount}</div>
            <div className="text-[10px] text-purple-200">已回覆報價</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部許願單 ({wishes.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>待報價 ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('quoted')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'quoted'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>已報價 ({quotedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('converted')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'converted'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            已轉訂單/上架 ({wishes.filter((w) => w.status === 'converted').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋商品、客戶、社群暱稱..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Wish Requests Grid */}
      {filteredWishes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 space-y-2">
          <Sparkles className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">尚無符合條件的圖片許願單</p>
          <p className="text-xs text-slate-400">當顧客在前台送出商品許願詢價時，將第一時間顯示在此！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWishes.map((wish) => {
            const isPending = wish.status === 'pending';
            const isQuoted = wish.status === 'quoted';
            const isConverted = wish.status === 'converted';

            return (
              <div
                key={wish.id}
                onClick={() => handleOpenDetail(wish)}
                className={`bg-white rounded-2xl border transition-all p-4 space-y-3 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-200/50 bg-amber-50/20'
                    : isQuoted
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Top Meta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {wish.wishNo}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                        {wish.country} 許願
                      </span>
                    </div>

                    <div>
                      {isPending ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          待報價
                        </span>
                      ) : isQuoted ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          已報價 {formatTwd(wish.quotedPriceTwd || 0)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                          已轉開單/上架
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Info Badge */}
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-900 truncate">{wish.customerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({wish.customerPhone})</span>
                    </div>
                    {wish.communityName && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                        💬 {wish.communityName}
                      </span>
                    )}
                  </div>

                  {/* Product Title & Image Preview */}
                  <div className="flex items-start gap-3 pt-1">
                    {wish.imageUrl ? (
                      <div className="w-18 h-18 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={wish.imageUrl}
                          alt={wish.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-18 h-18 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                        <span className="text-[9px] mt-0.5">無附圖</span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                        {wish.productName}
                      </h3>

                      {wish.specNote && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 bg-amber-50/60 p-1.5 rounded border border-amber-100">
                          備註: {wish.specNote}
                        </p>
                      )}

                      {wish.budgetTwd ? (
                        <div className="text-[11px] text-slate-500">
                          期望預算：<span className="font-mono font-bold text-purple-700">{formatTwd(wish.budgetTwd)}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDateTime(wish.createdAt).slice(0, 16)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(wish);
                    }}
                    className="px-3 py-1 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isPending ? '立即報價' : '查看詳情/轉開單'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wish Detail & Quoting Modal */}
      {selectedWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    許願詢價單審核與報價 ({selectedWish.wishNo})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    提交時間：{formatDateTime(selectedWish.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWish(null)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 flex-1">
              {/* Customer Info Card */}
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1.5 text-xs">
                <div className="font-bold text-purple-900 flex items-center justify-between">
                  <span>👤 許願委託顧客資料</span>
                  {selectedWish.communityName && (
                    <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-semibold">
                      💬 社群暱稱: {selectedWish.communityName}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>姓名：<span className="font-bold text-slate-900">{selectedWish.customerName}</span></div>
                  <div>電話：<span className="font-mono text-slate-900">{selectedWish.customerPhone}</span></div>
                </div>
              </div>

              {/* Wish Product Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    許願商品內容：
                  </label>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    採購國別：{selectedWish.country}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-sm text-slate-900">
                    {selectedWish.productName}
                  </div>

                  {selectedWish.specNote && (
                    <div className="text-slate-600 bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-800">規格說明：</span>
                      {selectedWish.specNote}
                    </div>
                  )}

                  {selectedWish.referenceUrl && (
                    <div className="flex items-center gap-1 text-blue-600 truncate">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <a
                        href={selectedWish.referenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline truncate"
                      >
                        {selectedWish.referenceUrl}
                      </a>
                    </div>
                  )}

                  {selectedWish.budgetTwd ? (
                    <div className="text-slate-600">
                      期望預算：<span className="font-mono font-bold text-purple-700">{formatTwd(selectedWish.budgetTwd)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Photo Preview */}
                {selectedWish.imageUrl && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-900">顧客附圖照片：</label>
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64 flex items-center justify-center p-2">
                      <img
                        src={selectedWish.imageUrl}
                        alt="許願商品圖"
                        className="max-h-60 object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Staff Quoting Form */}
              <form onSubmit={handleSaveQuote} className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                    <DollarSign className="w-4 h-4" />
                    <span>店家試算與專屬一口報價 (NT$)</span>
                  </div>
                  {selectedWish.quotedAt && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      前次報價: {formatDateTime(selectedWish.quotedAt).slice(0, 16)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    專屬報價台幣一口價 (已含國際運費與服務費) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold text-xs">NT$</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="請輸入欲報價金額 (例如: 1280)"
                      className="w-full pl-12 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    報價備註 / 專櫃採購說明 (選填)
                  </label>
                  <textarea
                    rows={2}
                    value={quoteAdminNote}
                    onChange={(e) => setQuoteAdminNote(e.target.value)}
                    placeholder="例如: 買手確認專櫃現貨，完成轉帳後約 5 個工作天抵台，贈品牌原廠防塵袋..."
                    className="w-full p-2.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{selectedWish.status === 'quoted' ? '更新報價內容' : '確認送出報價 (發送給顧客)'}</span>
                </button>
              </form>

              {/* Quick Conversion Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const finalPrice = Number(quotePrice) || selectedWish.quotedPriceTwd || selectedWish.budgetTwd || 1000;
                    onConvertToQuote(selectedWish, finalPrice);
                    setSelectedWish(null);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FilePlus2 className="w-4 h-4" />
                  <span>⚡ 帶入【開單報價】生成正式委託</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const finalPrice = Number(quotePrice) || selectedWish.quotedPriceTwd || selectedWish.budgetTwd || 1000;
                    onConvertToCatalog(selectedWish, finalPrice);
                    setSelectedWish(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Tags className="w-4 h-4" />
                  <span>📦 帶入【商品上架】上架前台</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
