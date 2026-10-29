import React from 'react';
import { Currency, Customer, Order, PaymentRecord, SystemSettings } from '../../types';
import { NavTab } from '../layout/Sidebar';
import { formatTwd, formatDateTime } from '../../utils/format';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Clock,
  ArrowRight,
  Plane,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface OverviewViewProps {
  orders: Order[];
  payments: PaymentRecord[];
  customers: Customer[];
  settings: SystemSettings;
  onNavigate: (tab: NavTab) => void;
  onSelectOrder: (order: Order) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  orders,
  payments,
  settings,
  onNavigate,
  onSelectOrder,
}) => {
  // KPI Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.depositPaidTwd + o.balancePaidTwd), 0);
  const totalProfit = orders.reduce((sum, o) => sum + o.estimatedProfitTwd, 0);

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const pendingPaymentSum = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const pendingPurchaseItemsCount = orders
    .filter((o) => o.status === 'purchasing' || (o.status === 'pending_deposit' && o.depositPaymentStatus === 'paid'))
    .flatMap((o) => o.items)
    .filter((i) => i.purchaseStatus === 'pending')
    .reduce((sum, i) => sum + i.quantity, 0);

  const arrivedPendingWeighOrBalanceOrders = orders.filter(
    (o) => o.status === 'arrived_tw' || o.status === 'pending_balance'
  );

  // Country Breakdown
  const countryStats = (['JPY', 'KRW', 'USD', 'EUR'] as Currency[]).map((code) => {
    const cOrders = orders.filter((o) => o.country === code);
    const amount = cOrders.reduce((sum, o) => sum + o.itemsTotalTwd, 0);
    return {
      code,
      name: settings.exchangeRates[code]?.name || code,
      count: cOrders.length,
      amount,
    };
  });
  const maxCountryAmount = Math.max(...countryStats.map((c) => c.amount), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium tracking-wide">已實收總金額</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatTwd(totalRevenue)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>累計委託單 {orders.length} 筆</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-medium font-mono tabular-nums">100% 履約追蹤</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium tracking-wide">預估代購淨毛利</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {formatTwd(totalProfit)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>代購服務費與匯差結算</span>
          </div>
        </div>

        {/* KPI 3: Actionable Reconcile */}
        <div
          onClick={() => onNavigate('reconciliation')}
          className="bg-white border border-amber-200/90 rounded-xl p-5 shadow-xs hover:border-amber-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium tracking-wide text-amber-900">待核銷收款 (末5碼)</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {pendingPayments.length}
            </span>
            <span className="text-xs text-amber-800">筆回報款項</span>
          </div>
          <div className="mt-2 text-xs text-amber-800 flex items-center justify-between">
            <span className="font-mono tabular-nums">待核銷總額：{formatTwd(pendingPaymentSum)}</span>
            <span className="text-amber-700 flex items-center gap-0.5 font-medium group-hover:translate-x-0.5 transition-transform">
              立即審核 <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: Actionable Procurement */}
        <div
          onClick={() => onNavigate('procurement')}
          className="bg-white border border-blue-200/90 rounded-xl p-5 shadow-xs hover:border-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium tracking-wide text-blue-900">待採購商品數量</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-700">
              {pendingPurchaseItemsCount}
            </span>
            <span className="text-xs text-blue-800">件商品</span>
          </div>
          <div className="mt-2 text-xs text-blue-800 flex items-center justify-between">
            <span>海外買手連線清單</span>
            <span className="text-blue-700 flex items-center gap-0.5 font-medium group-hover:translate-x-0.5 transition-transform">
              查看彙總 <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Action Alerts & Quick Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Queue & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Action Banner */}
          {arrivedPendingWeighOrBalanceOrders.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-semibold text-amber-900">
                  有 {arrivedPendingWeighOrBalanceOrders.length} 筆包裹已抵台過秤 / 待結清尾款
                </div>
                <div className="text-xs text-amber-800 mt-1">
                  請確認實際磅重後產出尾款與空運費通知單，顧客付款後即可印單寄出。
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('orders')}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors"
                  >
                    前往訂單秤重與收款
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">近期代購委託單</h3>
                <p className="text-xs text-slate-500 mt-0.5">即時追蹤客戶訂金與物流履約進度</p>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                查看全部訂單 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2.5 px-4">委託單號 / 時間</th>
                    <th className="py-2.5 px-4">客戶名稱</th>
                    <th className="py-2.5 px-4">採購國別</th>
                    <th className="py-2.5 px-4">委託商品概要</th>
                    <th className="py-2.5 px-4 text-right">訂單總額</th>
                    <th className="py-2.5 px-4 text-center">當前狀態</th>
                    <th className="py-2.5 px-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((order) => {
                    const statusLabel =
                      order.status === 'pending_deposit'
                        ? '待收訂金'
                        : order.status === 'purchasing'
                        ? '採購中'
                        : order.status === 'shipped_overseas'
                        ? '國際轉運中'
                        : order.status === 'arrived_tw'
                        ? '抵台待付尾款'
                        : order.status === 'fulfilled'
                        ? '已發貨完成'
                        : order.status;

                    const statusStyle =
                      order.status === 'pending_deposit'
                        ? 'text-amber-700 bg-amber-50'
                        : order.status === 'purchasing'
                        ? 'text-blue-700 bg-blue-50'
                        : order.status === 'arrived_tw'
                        ? 'text-purple-700 bg-purple-50'
                        : order.status === 'fulfilled'
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-slate-600 bg-slate-100';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-medium text-slate-900">{order.orderNo}</div>
                          <div className="text-[11px] text-slate-600">{formatDateTime(order.createdAt)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{order.customerName}</div>
                          <div className="text-[11px] text-slate-600">{order.customerPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-700 font-medium">{order.country}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-700">
                          {order.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatTwd(order.itemsTotalTwd)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              onSelectOrder(order);
                              onNavigate('orders');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            檢視明細
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Rates & Country Breakdown */}
        <div className="space-y-6">
          {/* Current Proxy Exchange Rates */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">各國代購換算匯率</h3>
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                維護匯率
              </button>
            </div>
            <div className="space-y-3">
              {(['JPY', 'KRW', 'USD', 'EUR'] as Currency[]).map((code) => {
                const conf = settings.exchangeRates[code];
                if (!conf) return null;
                return (
                  <div
                    key={code}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono">{conf.symbol}</span>
                        <span>{conf.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        市場參考: <span className="font-mono">{conf.baseRate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono tabular-nums text-blue-700">
                        {conf.quoteRate}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">報價匯率</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
              <span>國際空運費基準：</span>
              <span>日韓 NT$200~240/kg · 美歐 NT$280~350/kg</span>
            </div>
          </div>

          {/* Market Share by Country */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">市場採購佔比</h3>
            <div className="space-y-3">
              {countryStats.map((item) => {
                const pct = Math.round((item.amount / maxCountryAmount) * 100);
                return (
                  <div key={item.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.code} - {item.name.split(' ')[0]}</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        {formatTwd(item.amount)} ({item.count}單)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shop Reminder */}
          <div className="bg-slate-900 text-slate-300 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-white font-medium text-xs mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              代購帳戶收款資訊
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              目前預設收款銀行為：{settings.receivingBank.bankName}
              <br />
              戶名：{settings.receivingBank.accountHolder}
              <br />
              帳號：<span className="font-mono text-white">{settings.receivingBank.accountNo}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
