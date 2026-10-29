import React, { useState } from 'react';
import { Order, PaymentRecord, PaymentStage, SystemSettings } from '../../types';
import { formatTwd, formatDateTime } from '../../utils/format';
import { exportReconciliationToExcel } from '../../utils/excelExport';
import {
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Building2,
  FileCheck2,
  FileSpreadsheet,
} from 'lucide-react';

interface ReconciliationViewProps {
  orders: Order[];
  payments: PaymentRecord[];
  settings: SystemSettings;
  onVerifyPayment: (paymentId: string, orderId: string, stage: PaymentStage, amount: number) => void;
  onRejectPayment: (paymentId: string, reason: string) => void;
  onManualRecordPayment: (payment: Omit<PaymentRecord, 'id' | 'paymentNo' | 'createdAt'>) => void;
  initialFilterOrderNo?: string;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  orders,
  payments,
  settings,
  onVerifyPayment,
  onRejectPayment,
  onManualRecordPayment,
  initialFilterOrderNo = '',
}) => {
  const [activeStageTab, setActiveStageTab] = useState<'all' | 'deposit' | 'balance'>('all');
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'pending' | 'verified'>('pending');
  const [searchQuery, setSearchQuery] = useState(initialFilterOrderNo);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual payment modal state
  const [manualOrderId, setManualOrderId] = useState<string>(orders[0]?.id || '');
  const [manualStage, setManualStage] = useState<PaymentStage>('deposit');
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualBank, setManualBank] = useState('玉山銀行 (808)');
  const [manualLast5, setManualLast5] = useState('88888');
  const [manualNote, setManualNote] = useState('');

  // When order changes in manual modal, default amount to required amount
  const handleOrderSelectInModal = (orderId: string) => {
    setManualOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      if (manualStage === 'deposit') {
        setManualAmount(ord.depositRequiredTwd - ord.depositPaidTwd);
      } else {
        setManualAmount(ord.balanceRequiredTwd - ord.balancePaidTwd);
      }
    }
  };

  const handleStageSelectInModal = (stage: PaymentStage) => {
    setManualStage(stage);
    const ord = orders.find((o) => o.id === manualOrderId);
    if (ord) {
      if (stage === 'deposit') {
        setManualAmount(ord.depositRequiredTwd - ord.depositPaidTwd);
      } else {
        setManualAmount(ord.balanceRequiredTwd - ord.balancePaidTwd);
      }
    }
  };

  const handleCreateManualPayment = () => {
    const targetOrder = orders.find((o) => o.id === manualOrderId);
    if (!targetOrder) {
      alert('請選擇有效訂單');
      return;
    }
    if (manualAmount <= 0) {
      alert('請輸入大於 0 的入帳金額');
      return;
    }

    onManualRecordPayment({
      orderId: targetOrder.id,
      orderNo: targetOrder.orderNo,
      customerId: targetOrder.customerId,
      customerName: targetOrder.customerName,
      stage: manualStage,
      amount: Number(manualAmount),
      bankName: manualBank,
      bankLast5: manualLast5,
      transferTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      proofNote: manualNote || '後台小幫手手動入帳確認',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifier: '系統管理員',
    });

    setIsManualModalOpen(false);
    alert(`訂單 ${targetOrder.orderNo} 款項已登記並成功核銷入帳！`);
  };

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (activeStageTab !== 'all' && p.stage !== activeStageTab) return false;
    if (activeStatusTab !== 'all' && p.status !== activeStatusTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrder = p.orderNo.toLowerCase().includes(q);
      const matchCust = p.customerName.toLowerCase().includes(q);
      const matchLast5 = p.bankLast5.includes(q);
      if (!matchOrder && !matchCust && !matchLast5) return false;
    }
    return true;
  });

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const pendingTotalAmount = pendingPayments.reduce((s, p) => s + p.amount, 0);

  const verifiedPayments = payments.filter((p) => p.status === 'verified');
  const verifiedTotalAmount = verifiedPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Financial Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Reconcile */}
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-2">
            <span>待對帳核銷筆數 (末五碼)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-900">
            {pendingPayments.length} 筆
          </div>
          <div className="text-xs text-amber-800 mt-1 font-mono">
            待查核入帳金額：{formatTwd(pendingTotalAmount)}
          </div>
        </div>

        {/* Verified Today/Cumulative */}
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-2">
            <span>累計已核銷入帳總額</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-900">
            {formatTwd(verifiedTotalAmount)}
          </div>
          <div className="text-xs text-emerald-800 mt-1">
            已確認 {verifiedPayments.length} 筆金流無誤
          </div>
        </div>

        {/* Bank Receiving Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>當前團隊收款帳戶</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {settings.receivingBank.bankName}
            </div>
            <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
              {settings.receivingBank.accountNo}
            </div>
            <div className="text-[11px] text-slate-500">
              戶名：{settings.receivingBank.accountHolder}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Stage Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 shrink-0">對帳階段：</span>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all', label: '全部階段' },
                { id: 'deposit', label: '第 1 階段：訂金款' },
                { id: 'balance', label: '第 2 階段：尾款與運費' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveStageTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeStageTab === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveStatusTab('pending')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeStatusTab === 'pending'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                待核銷 ({pendingPayments.length})
              </button>
              <button
                onClick={() => setActiveStatusTab('verified')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeStatusTab === 'verified'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                已入帳 ({verifiedPayments.length})
              </button>
              <button
                onClick={() => setActiveStatusTab('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeStatusTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部
              </button>
            </div>

            {/* Export & Manual record action */}
            <button
              onClick={() => exportReconciliationToExcel(filteredPayments)}
              title="匯出當前收款對帳明細為 Excel 檔案 (.xlsx)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>匯出 Excel</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>手動登記收款</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋委託單號、客戶姓名或匯款末五碼 (例：88392)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Payment Records List / Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Desktop Table: Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">流水號 / 回報時間</th>
                <th className="py-3 px-4">委託單號</th>
                <th className="py-3 px-4">委託客戶</th>
                <th className="py-3 px-4">款項階段</th>
                <th className="py-3 px-4">客戶轉帳銀行</th>
                <th className="py-3 px-4">帳號末五碼</th>
                <th className="py-3 px-4 text-right">申報金額</th>
                <th className="py-3 px-4">轉帳時間 / 備註</th>
                <th className="py-3 px-4 text-center">核銷狀態</th>
                <th className="py-3 px-4 text-center">核銷作業</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    無符合條件的收款對帳明細
                  </td>
                </tr>
              ) : (
                filteredPayments.map((record) => {
                  const isPending = record.status === 'pending';
                  const isVerified = record.status === 'verified';

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isPending ? 'bg-amber-50/15' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-slate-900">{record.paymentNo}</div>
                        <div className="text-[11px] text-slate-600">
                          {formatDateTime(record.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-blue-600">
                          {record.orderNo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {record.customerName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            record.stage === 'deposit'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {record.stage === 'deposit' ? '1. 訂金款' : '2. 尾款與運費'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{record.bankName}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {record.bankLast5}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                        {formatTwd(record.amount)}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[11px] text-slate-500 font-mono">
                          {record.transferTime}
                        </div>
                        {record.proofNote && (
                          <div className="text-[11px] text-slate-700 truncate" title={record.proofNote}>
                            {record.proofNote}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" /> 已核銷入帳
                          </span>
                        ) : record.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" /> 已駁回
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" /> 待核銷
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                onVerifyPayment(
                                  record.id,
                                  record.orderId,
                                  record.stage,
                                  record.amount
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> 核銷入帳
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('請輸入駁回原因 (例：查無此末五碼、金額短少)：');
                                if (reason) {
                                  onRejectPayment(record.id, reason);
                                }
                              }}
                              className="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              駁回
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-600 font-mono">
                            {record.verifiedAt ? formatDateTime(record.verifiedAt) : '已處理'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards: Visible only on Mobile */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              無符合條件的收款對帳明細
            </div>
          ) : (
            filteredPayments.map((record) => {
              const isPending = record.status === 'pending';
              const isVerified = record.status === 'verified';

              return (
                <div
                  key={record.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isPending ? 'bg-amber-50/20' : 'bg-white'
                  }`}
                >
                  {/* Top Bar: Payment No, Stage Badge, Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        {record.paymentNo}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDateTime(record.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          record.stage === 'deposit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {record.stage === 'deposit' ? '1. 訂金款' : '2. 尾款與運費'}
                      </span>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> 已核銷
                        </span>
                      ) : record.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3 h-3" /> 已駁回
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3" /> 待核銷
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order & Customer */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">關聯委託單</span>
                      <span className="font-mono font-bold text-blue-600">
                        {record.orderNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">委託客戶</span>
                      <span className="font-bold text-slate-800">
                        {record.customerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 text-[11px]">轉帳末五碼</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 text-[11px]">{record.bankName}</span>
                        <span className="font-mono font-bold text-slate-900 px-1.5 py-0.2 rounded bg-white border border-slate-200 text-xs">
                          {record.bankLast5}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 text-[11px]">申報匯款金額</span>
                      <span className="font-mono font-bold text-base text-blue-700 tabular-nums">
                        {formatTwd(record.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Transfer Time & Proof Note */}
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">匯款時間：</span>
                      <span className="font-mono">{record.transferTime || '未填寫'}</span>
                    </div>
                    {record.proofNote && (
                      <div className="bg-slate-50/80 p-2 rounded text-slate-700 border border-slate-100 break-all">
                        <span className="text-slate-400">備註：</span>
                        {record.proofNote}
                      </div>
                    )}
                  </div>

                  {/* Actions for Mobile */}
                  {isPending ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() =>
                          onVerifyPayment(
                            record.id,
                            record.orderId,
                            record.stage,
                            record.amount
                          )
                        }
                        className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> 核銷入帳
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('請輸入駁回原因 (例：查無此末五碼、金額短少)：');
                          if (reason) {
                            onRejectPayment(record.id, reason);
                          }
                        }}
                        className="w-full py-2 px-3 text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer text-center"
                      >
                        駁回
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 text-right font-mono">
                      {record.verifiedAt ? `核銷時間: ${formatDateTime(record.verifiedAt)}` : '已處理'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Payment Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                代客登記收款 (手動快速核銷)
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">選擇核銷訂單 *</label>
                <select
                  value={manualOrderId}
                  onChange={(e) => handleOrderSelectInModal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} - {o.customerName} (商品總額: {formatTwd(o.itemsTotalTwd)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">收款階段 *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStageSelectInModal('deposit')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium ${
                      manualStage === 'deposit'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    第 1 階段：訂金款
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStageSelectInModal('balance')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium ${
                      manualStage === 'balance'
                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    第 2 階段：尾款與運費
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">入帳金額 (NT$) *</label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">帳號末五碼 / 交易序號</label>
                  <input
                    type="text"
                    value={manualLast5}
                    onChange={(e) => setManualLast5(e.target.value)}
                    placeholder="例：99201 或 LINE Pay"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">匯入管道 / 銀行</label>
                <input
                  type="text"
                  value={manualBank}
                  onChange={(e) => setManualBank(e.target.value)}
                  placeholder="例：玉山銀行 / 現場現金 / LINE Pay"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">備註說明</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="例：客人親付現金或面交結清"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateManualPayment}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                確認入帳並核銷
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
