import React, { useState, useMemo } from 'react';
import { Currency, Order, OrderStatus, SystemSettings } from '../../types';
import { formatCurrencyAmount, formatTwd, formatDateTime, generateBalanceNoticeCopy } from '../../utils/format';
import { exportOrdersToExcel } from '../../utils/excelExport';
import { ProductImage } from '../common/ProductImage';
import {
  Search,
  Filter,
  Eye,
  Package,
  Plane,
  Scale,
  Truck,
  CheckCircle,
  Copy,
  Check,
  X,
  FileText,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  CheckSquare,
  Square,
  Sparkles,
  CreditCard,
  Ban,
  ArrowRight,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  settings: SystemSettings;
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  onUpdateOrder: (updated: Order) => void;
  onOpenReconciliationWithOrder: (orderNo: string) => void;
}

const STATUS_FILTERS: { id: string; label: string; count?: number }[] = [
  { id: 'all', label: '全部訂單' },
  { id: 'pending_deposit', label: '待付訂金' },
  { id: 'purchasing', label: '海外採購中' },
  { id: 'shipped_overseas', label: '國際轉運中' },
  { id: 'arrived_tw', label: '抵台待出貨 (可合併)' },
  { id: 'out_of_stock', label: '專櫃斷貨/退款' },
  { id: 'fulfilled', label: '已發貨完成' },
  { id: 'cancelled', label: '已取消' },
];

const statusColors: Record<OrderStatus, string> = {
  draft: 'bg-slate-100 text-slate-800 border-slate-300',
  pending_deposit: 'bg-amber-100 text-amber-800 border-amber-300',
  purchasing: 'bg-blue-100 text-blue-800 border-blue-300',
  shipped_overseas: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  arrived_tw: 'bg-purple-100 text-purple-800 border-purple-300',
  pending_balance: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  fulfilled: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  out_of_stock: 'bg-rose-100 text-rose-800 border-rose-300',
  cancelled: 'bg-stone-100 text-stone-600 border-stone-300',
};

const statusNames: Record<OrderStatus, string> = {
  draft: '草稿 (報價中)',
  pending_deposit: '待付訂金',
  purchasing: '海外採購中',
  shipped_overseas: '國際轉運中',
  arrived_tw: '已抵台待出貨',
  pending_balance: '待付尾款',
  fulfilled: '已發貨完成',
  out_of_stock: '專櫃已斷貨',
  cancelled: '已取消',
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  settings,
  selectedOrder,
  onSelectOrder,
  onUpdateOrder,
  onOpenReconciliationWithOrder,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBalanceCopy, setCopiedBalanceCopy] = useState(false);

  // Selected orders for Batch Merge Shipment
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeDomesticCarrier, setMergeDomesticCarrier] = useState('7-11 交貨便');
  const [mergeTrackingNo, setMergeTrackingNo] = useState('');
  const [mergeDiscountExtraFreight, setMergeDiscountExtraFreight] = useState(true);
  const [mergeNote, setMergeNote] = useState('');
  const [copiedMergeNotice, setCopiedMergeNotice] = useState(false);

  // Out of Stock & Refund Modal states
  const [isOutOfStockModalOpen, setIsOutOfStockModalOpen] = useState(false);
  const [outOfStockTargetOrder, setOutOfStockTargetOrder] = useState<Order | null>(null);
  const [outOfStockReasonInput, setOutOfStockReasonInput] = useState('專櫃/官方已全數售罄斷貨，無後續補貨規劃');
  const [copiedOutOfStockNotice, setCopiedOutOfStockNotice] = useState(false);

  // Admin Manual Refund Recording Modal states
  const [isAdminRefundModalOpen, setIsAdminRefundModalOpen] = useState(false);
  const [adminRefundTransferRef, setAdminRefundTransferRef] = useState('');
  const [adminManualBankCode, setAdminManualBankCode] = useState('');
  const [adminManualBankName, setAdminManualBankName] = useState('');
  const [adminManualAccountNo, setAdminManualAccountNo] = useState('');
  const [adminManualAccountHolder, setAdminManualAccountHolder] = useState('');
  const [isAdminEnteringBankInfo, setIsAdminEnteringBankInfo] = useState(false);

  // Edit fields for active drawer
  const [editActualWeight, setEditActualWeight] = useState<number>(0);
  const [editOverseasTracking, setEditOverseasTracking] = useState('');
  const [editDomesticTracking, setEditDomesticTracking] = useState('');
  const [editDiscount, setEditDiscount] = useState<number>(0);

  const openOrderDetail = (order: Order) => {
    onSelectOrder(order);
    setEditActualWeight(order.actualWeightKg || 0);
    setEditOverseasTracking(order.overseasTrackingNo || '');
    setEditDomesticTracking(order.domesticTrackingNo || '');
    setEditDiscount(order.discountTwd || 0);
  };

  // Selected order objects
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  // Check if all selected orders belong to the same customer
  const isSameCustomer = useMemo(() => {
    if (selectedOrders.length <= 1) return true;
    const firstCust = selectedOrders[0].customerId;
    return selectedOrders.every((o) => o.customerId === firstCust);
  }, [selectedOrders]);

  // Check how many orders are arrived in TW per customer
  const arrivedCountByCustomer = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status === 'arrived_tw' || o.status === 'pending_balance') {
        counts[o.customerId] = (counts[o.customerId] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const selectAllArrivedOrdersForCustomer = (customerId: string) => {
    const ids = orders
      .filter((o) => o.customerId === customerId && (o.status === 'arrived_tw' || o.status === 'pending_balance'))
      .map((o) => o.id);
    setSelectedOrderIds(ids);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter !== 'all') {
      if (activeFilter === 'arrived_tw') {
        if (o.status !== 'arrived_tw' && o.status !== 'pending_balance') return false;
      } else if (activeFilter === 'out_of_stock') {
        if (o.status !== 'out_of_stock' && !o.isOutOfStock) return false;
      } else if (o.status !== activeFilter) {
        return false;
      }
    }
    if (selectedCountry !== 'all' && o.country !== selectedCountry) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = o.orderNo.toLowerCase().includes(q);
      const matchCust = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.toLowerCase().includes(q);
      const matchItem = o.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchNo && !matchCust && !matchPhone && !matchItem) return false;
    }
    return true;
  });

  // Handle actual weight input to recompute balance required
  const handleSaveWeighingAndComputeBalance = () => {
    if (!selectedOrder) return;
    const ratePerKg = settings.exchangeRates[selectedOrder.country]?.airFreightPerKg || 240;
    const computedAirFreight = Math.round((Number(editActualWeight) || 0) * ratePerKg);
    const domesticFee = selectedOrder.domesticFreightTwd || 60;
    const discount = Number(editDiscount) || 0;

    // Remaining items balance if not 100% deposit
    const unpaidItemTwd = Math.max(selectedOrder.itemsTotalTwd - selectedOrder.depositPaidTwd, 0);
    const computedBalance = unpaidItemTwd + computedAirFreight + domesticFee - discount;

    const updated: Order = {
      ...selectedOrder,
      status: 'pending_balance',
      actualWeightKg: Number(editActualWeight) || 0,
      actualAirFreightTwd: computedAirFreight,
      discountTwd: discount,
      balanceRequiredTwd: Math.max(computedBalance, 0),
      balancePaymentStatus: 'unpaid',
      overseasTrackingNo: editOverseasTracking,
      domesticTrackingNo: editDomesticTracking,
    };

    onUpdateOrder(updated);
    onSelectOrder(updated);
    alert(`包裹過秤完成！實重 ${editActualWeight} kg，已計算尾款與國際運費為 ${formatTwd(computedBalance)}。`);
  };

  const handleUpdateStatus = (newStatus: OrderStatus, targetOrder?: Order) => {
    const ord = targetOrder || selectedOrder;
    if (!ord) return;

    if (newStatus === 'out_of_stock') {
      handleOpenOutOfStockModal(ord);
      return;
    }

    if (newStatus === 'cancelled') {
      if (!confirm(`確定要將訂單【${ord.orderNo}】標記為「已取消」嗎？`)) {
        return;
      }
    }

    const updated: Order = {
      ...ord,
      status: newStatus,
      isOutOfStock: false,
      overseasTrackingNo: ord.id === selectedOrder?.id ? editOverseasTracking : ord.overseasTrackingNo,
      domesticTrackingNo: ord.id === selectedOrder?.id ? editDomesticTracking : ord.domesticTrackingNo,
    };
    onUpdateOrder(updated);
    if (selectedOrder && selectedOrder.id === ord.id) {
      onSelectOrder(updated);
    }
  };

  const handleCopyBalanceNotice = () => {
    if (!selectedOrder) return;
    const notice = generateBalanceNoticeCopy(selectedOrder, settings);
    navigator.clipboard.writeText(notice);
    setCopiedBalanceCopy(true);
    setTimeout(() => setCopiedBalanceCopy(false), 2000);
  };

  // Open merge orders modal
  const handleOpenMergeModal = () => {
    if (selectedOrders.length < 2) {
      alert('請至少勾選 2 筆同一位客戶的訂單進行合併出貨！');
      return;
    }
    if (!isSameCustomer) {
      alert('所勾選之訂單屬於不同客戶，請僅勾選同一位客戶的訂單！');
      return;
    }
    setMergeTrackingNo('');
    setMergeNote('');
    setCopiedMergeNotice(false);
    setIsMergeModalOpen(true);
  };

  // Confirm Merge Shipment
  const handleConfirmMergeShipment = () => {
    if (!mergeTrackingNo.trim()) {
      alert('請填寫台灣本地寄件單號 / 配送編號 (例如 7-11 寄件編號或黑貓單號)');
      return;
    }

    const orderNos = selectedOrders.map((o) => o.orderNo);
    const orderIds = selectedOrders.map((o) => o.id);

    selectedOrders.forEach((ord, idx) => {
      // If discount extra domestic freight, keep domestic freight on first order and set 0 on subsequent orders
      const domesticFreight = mergeDiscountExtraFreight ? (idx === 0 ? ord.domesticFreightTwd : 0) : ord.domesticFreightTwd;
      const updated: Order = {
        ...ord,
        status: 'fulfilled',
        domesticTrackingNo: mergeTrackingNo.trim(),
        mergedShipmentNo: mergeTrackingNo.trim(),
        mergedWithOrderIds: orderIds.filter((id) => id !== ord.id),
        mergedWithOrderNos: orderNos.filter((no) => no !== ord.orderNo),
        isMergedSubOrder: idx > 0,
        domesticFreightTwd: domesticFreight,
        adminNotes: `${ord.adminNotes ? ord.adminNotes + '；' : ''}【已合併出貨】與訂單【${orderNos.filter((no) => no !== ord.orderNo).join(', ')}】同箱寄出，配送單號：${mergeTrackingNo.trim()}`,
      };
      onUpdateOrder(updated);
    });

    setIsMergeModalOpen(false);
    setSelectedOrderIds([]);
    alert(`🎉 合併出貨成功！已將 ${selectedOrders.length} 筆訂單合併為同一包裹，並指派寄件單號 ${mergeTrackingNo.trim()}。`);
  };

  // Copy Merged shipment notice
  const handleCopyMergedNotice = () => {
    if (selectedOrders.length === 0) return;
    const first = selectedOrders[0];
    const orderNos = selectedOrders.map((o) => o.orderNo).join(', ');
    const totalItems = selectedOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0), 0);
    const totalWeight = selectedOrders.reduce((sum, o) => sum + (o.actualWeightKg || 0), 0).toFixed(2);
    const totalBalance = selectedOrders.reduce((sum, o) => sum + (o.balanceRequiredTwd || 0), 0);

    const text = `📦【GlobalProxy 連線代購 - 多單合併出貨通知】
親愛的 ${first.customerName} 您好！
您委託的多筆代購商品已全數抵達台灣轉運倉！
小幫手已為您整併同箱寄出，為您省下重複超取的國內運費！

📑 合併訂單單號：${orderNos}
🎁 合併商品總數：共 ${totalItems} 件 (預估總重約 ${totalWeight} kg)
🚚 寄件物流：${mergeDomesticCarrier} (${first.deliveryMethod})
🔖 台灣物流單號：${mergeTrackingNo.trim() || '已寄出待刷碼'}
💰 尾款運費金額：${totalBalance > 0 ? `NT$ ${totalBalance} (已結清)` : '全額已結清'}

包裹已由物流收件送往門市，預計 2~3 天抵達，感謝您的支持！`;

    navigator.clipboard.writeText(text);
    setCopiedMergeNotice(true);
    setTimeout(() => setCopiedMergeNotice(false), 2000);
  };

  // Handle Mark as Out of Stock
  const handleOpenOutOfStockModal = (order: Order) => {
    setOutOfStockTargetOrder(order);
    setOutOfStockReasonInput('專櫃/官方已全數售罄斷貨，無後續補貨規劃');
    setCopiedOutOfStockNotice(false);
    setIsOutOfStockModalOpen(true);
  };

  const handleConfirmOutOfStock = () => {
    if (!outOfStockTargetOrder) return;
    const reason = outOfStockReasonInput.trim() || '專櫃/官方已售罄斷貨';
    const refundAmount = outOfStockTargetOrder.depositPaidTwd || 0;

    const updatedItems = outOfStockTargetOrder.items.map((it) => ({
      ...it,
      purchaseStatus: 'out_of_stock' as const,
      purchaseNote: reason,
    }));

    const updated: Order = {
      ...outOfStockTargetOrder,
      items: updatedItems,
      status: 'out_of_stock',
      isOutOfStock: true,
      outOfStockReason: reason,
      outOfStockNotifiedAt: new Date().toISOString(),
      refundStatus: refundAmount > 0 ? 'pending_info' : 'none',
      refundAmountTwd: refundAmount,
      adminNotes: `${outOfStockTargetOrder.adminNotes ? outOfStockTargetOrder.adminNotes + '；' : ''}【商品斷貨】${reason}，應退款金額 NT$ ${refundAmount}`,
    };

    onUpdateOrder(updated);
    if (selectedOrder && selectedOrder.id === updated.id) {
      onSelectOrder(updated);
    }
    setIsOutOfStockModalOpen(false);
    alert(`已成功將訂單【${outOfStockTargetOrder.orderNo}】標記為已斷貨！已啟動顧客退款流程。`);
  };

  // Copy Out-of-Stock LINE Notice
  const handleCopyOutOfStockNotice = () => {
    if (!outOfStockTargetOrder) return;
    const ord = outOfStockTargetOrder;
    const itemNames = ord.items.map((i) => i.name).join('、');
    const text = `【GlobalProxy 連線代購 - 商品斷貨與退款通知】
親愛的 ${ord.customerName} 您好：
非常抱歉通知您，您於委託訂單【${ord.orderNo}】所委託的商品：
「${itemNames}」
經買手多次前往專櫃現場與官方官網確認，已全面售罄斷貨，未能為您順利購得，深感抱歉！

${
  ord.depositPaidTwd > 0
    ? `💰 因您先前已預先支付訂金 NT$ ${ord.depositPaidTwd}，我們將為您辦理全額原路退款！
請您至代購前台會員中心登入或點擊「訂單進度查詢」（手機號碼：${ord.customerPhone}），即可於訂單內填寫您的退款銀行帳號；小幫手確認後將於 1 個工作天內為您完成匯款退款。`
    : '因本筆委託尚未收取款項，訂單將自動為您取消歸檔。'
}

再次向您致上最誠摯的歉意，感謝您的理解與包涵！`;

    navigator.clipboard.writeText(text);
    setCopiedOutOfStockNotice(true);
    setTimeout(() => setCopiedOutOfStockNotice(false), 2000);
  };

  // Admin Manual Record Refund Bank Info
  const handleSaveAdminManualBankInfo = () => {
    if (!selectedOrder) return;
    if (!adminManualAccountNo.trim() || !adminManualAccountHolder.trim()) {
      alert('請填寫完整退款帳號與戶名！');
      return;
    }

    const updated: Order = {
      ...selectedOrder,
      refundStatus: 'ready_to_refund',
      refundBankInfo: {
        bankCode: adminManualBankCode.trim() || '822',
        bankName: adminManualBankName.trim() || '銀行',
        accountNo: adminManualAccountNo.trim(),
        accountHolder: adminManualAccountHolder.trim(),
        submittedAt: new Date().toISOString(),
        note: '由管理員於後台代填顧客 LINE 提供之帳戶',
      },
    };
    onUpdateOrder(updated);
    onSelectOrder(updated);
    setIsAdminEnteringBankInfo(false);
    alert('已成功登記顧客退款銀行帳號！');
  };

  // Admin Confirm Refund Completed
  const handleConfirmRefundCompleted = () => {
    if (!selectedOrder) return;
    const ref = adminRefundTransferRef.trim() || `REF-${Date.now().toString().slice(-6)}`;
    const updated: Order = {
      ...selectedOrder,
      refundStatus: 'refunded',
      refundCompletedAt: new Date().toISOString(),
      refundTransferRef: ref,
      adminNotes: `${selectedOrder.adminNotes ? selectedOrder.adminNotes + '；' : ''}已於 ${new Date().toLocaleDateString('zh-TW')} 完成退款 NT$ ${selectedOrder.refundAmountTwd}，交易序號: ${ref}`,
    };
    onUpdateOrder(updated);
    onSelectOrder(updated);
    setIsAdminRefundModalOpen(false);
    alert(`🎉 已確認全額退款 NT$ ${selectedOrder.refundAmountTwd} 完成！`);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_FILTERS.map((f) => {
              const isSelected = activeFilter === f.id;
              const count =
                f.id === 'all'
                  ? orders.length
                  : f.id === 'arrived_tw'
                  ? orders.filter((o) => o.status === 'arrived_tw' || o.status === 'pending_balance').length
                  : f.id === 'out_of_stock'
                  ? orders.filter((o) => o.status === 'out_of_stock' || o.isOutOfStock).length
                  : orders.filter((o) => o.status === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="text-[11px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Country filter & Excel Export */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500">國別：</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer"
            >
              <option value="all">全部國家</option>
              {(settings.customCountries && settings.customCountries.length > 0
                ? settings.customCountries.filter((c) => c.isActive !== false)
                : Object.entries(settings.exchangeRates).map(([cur, r]) => ({
                    currency: cur,
                    name: r.name,
                    flag: r.flag,
                  }))
              ).map((c) => (
                <option key={c.currency} value={c.currency}>
                  {c.flag || ''} {c.name} ({c.currency})
                </option>
              ))}
            </select>

            <button
              onClick={() => exportOrdersToExcel(filteredOrders)}
              title="匯出當前清單為 Excel 檔案 (.xlsx)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer ml-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>匯出 Excel</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋委託單號、客戶姓名、電話或商品名稱..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Batch Action Bar when Orders are Checked */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-indigo-900 text-white px-4 py-3 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center font-bold text-white shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span>已勾選 <strong>{selectedOrderIds.length}</strong> 筆訂單</span>
              {isSameCustomer ? (
                <span className="ml-2 bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded text-[11px]">
                  客戶：<strong>{selectedOrders[0]?.customerName}</strong> ({selectedOrders[0]?.customerPhone})
                </span>
              ) : (
                <span className="ml-2 bg-rose-900 text-rose-200 px-2 py-0.5 rounded text-[11px] font-bold">
                  ⚠️ 勾選之訂單跨不同客戶，合併出貨僅能合併同一位客戶之訂單！
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 text-indigo-200 hover:text-white cursor-pointer"
            >
              清除選取
            </button>
            <button
              type="button"
              disabled={!isSameCustomer || selectedOrders.length < 2}
              onClick={handleOpenMergeModal}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isSameCustomer && selectedOrders.length >= 2
                  ? 'bg-white text-indigo-950 hover:bg-indigo-50 cursor-pointer font-bold'
                  : 'bg-indigo-800 text-indigo-400 cursor-not-allowed opacity-70'
              }`}
            >
              <Package className="w-4 h-4 text-indigo-600" />
              <span>合併訂單安排出貨 ({selectedOrders.length} 筆)</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders Table & Mobile Responsive Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Desktop Table: Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    title="選取全部可出貨訂單"
                    checked={
                      filteredOrders.length > 0 &&
                      filteredOrders.every((o) => selectedOrderIds.includes(o.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(filteredOrders.map((o) => o.id));
                      } else {
                        setSelectedOrderIds([]);
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">訂單單號 / 日期</th>
                <th className="py-3 px-4">委託客戶</th>
                <th className="py-3 px-4">國家</th>
                <th className="py-3 px-4">商品與件數</th>
                <th className="py-3 px-4 text-right">商品總額</th>
                <th className="py-3 px-4">第一階段 (訂金)</th>
                <th className="py-3 px-4">第二階段 (尾款)</th>
                <th className="py-3 px-4 text-center">狀態</th>
                <th className="py-3 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    查無符合條件的代購訂單
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusColors: Record<OrderStatus, string> = {
                    draft: 'text-slate-600 bg-slate-100',
                    pending_deposit: 'text-amber-800 bg-amber-50 border border-amber-200/60',
                    purchasing: 'text-blue-800 bg-blue-50 border border-blue-200/60',
                    shipped_overseas: 'text-sky-800 bg-sky-50 border border-sky-200/60',
                    arrived_tw: 'text-purple-800 bg-purple-50 border border-purple-200/60',
                    pending_balance: 'text-indigo-800 bg-indigo-50 border border-indigo-200/60',
                    fulfilled: 'text-emerald-800 bg-emerald-50 border border-emerald-200/60',
                    out_of_stock: 'text-rose-800 bg-rose-50 border border-rose-300 font-bold',
                    cancelled: 'text-rose-700 bg-rose-50 border border-rose-200/60',
                  };

                  const isChecked = selectedOrderIds.includes(order.id);
                  const isArrived = order.status === 'arrived_tw' || order.status === 'pending_balance';
                  const arrivedCount = arrivedCountByCustomer[order.customerId] || 0;

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isChecked ? 'bg-indigo-50/60' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-semibold text-slate-900">{order.orderNo}</span>
                          {order.mergedShipmentNo && (
                            <span
                              title={`已合併包裹單號: ${order.mergedShipmentNo}`}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold border border-indigo-200"
                            >
                              📦 併單
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900">{order.customerName}</span>
                          {isArrived && arrivedCount >= 2 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAllArrivedOrdersForCustomer(order.customerId);
                              }}
                              title={`點擊全選此客戶 ${arrivedCount} 筆已抵台訂單進行合併出貨`}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-0.5 cursor-pointer shadow-2xs"
                            >
                              <Layers className="w-2.5 h-2.5 text-indigo-600" />
                              <span>併單({arrivedCount})</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-slate-800">{order.country}</span>
                      </td>
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {/* Product Cover Image (商品首頁圖) */}
                          <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs group-hover:border-blue-400 transition-colors">
                            <ProductImage
                              src={order.items[0]?.imageUrl || (order.items[0]?.images && order.items[0]?.images[0])}
                              alt={order.items[0]?.name || '商品首頁圖'}
                              category={order.items[0]?.category}
                              country={order.items[0]?.country || order.country}
                              className="w-full h-full object-cover"
                            />
                            {order.items.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded-tl-md font-bold">
                                +{order.items.length - 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors" title={order.items[0]?.name}>
                              {order.items[0]?.name}
                            </div>
                            {order.items[0]?.spec && (
                              <div className="text-[11px] text-blue-600 font-medium truncate">
                                款式: {order.items[0]?.spec}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500">
                              共 {order.items.reduce((s, i) => s + i.quantity, 0)} 件 · {order.items.length} 款品項
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatTwd(order.itemsTotalTwd)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono tabular-nums text-slate-800">
                          {formatTwd(order.depositRequiredTwd)}
                        </div>
                        <div className="text-[11px]">
                          {order.depositPaymentStatus === 'paid' ? (
                            <span className="text-emerald-600 font-medium">✓ 已入帳</span>
                          ) : order.depositPaymentStatus === 'verifying' ? (
                            <button
                              onClick={() => onOpenReconciliationWithOrder(order.orderNo)}
                              className="text-amber-600 font-medium hover:underline cursor-pointer"
                            >
                              待對帳審核 ➔
                            </button>
                          ) : (
                            <span className="text-slate-600">未付款</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono tabular-nums text-slate-800">
                          {order.balanceRequiredTwd > 0 ? formatTwd(order.balanceRequiredTwd) : '尚未秤重結算'}
                        </div>
                        <div className="text-[11px]">
                          {order.balancePaymentStatus === 'paid' ? (
                            <span className="text-emerald-600 font-medium">✓ 尾款已結清</span>
                          ) : order.balancePaymentStatus === 'verifying' ? (
                            <button
                              onClick={() => onOpenReconciliationWithOrder(order.orderNo)}
                              className="text-amber-600 font-medium hover:underline cursor-pointer"
                            >
                              尾款待審核 ➔
                            </button>
                          ) : order.balanceRequiredTwd > 0 ? (
                            <span className="text-indigo-600">待客人付款</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus, order)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs focus:ring-1 focus:ring-blue-500 ${statusColors[order.status]}`}
                          title="點擊下拉選單可直接切換訂單狀態"
                        >
                          <option value="draft">📝 草稿 (審核中)</option>
                          <option value="pending_deposit">⏳ 待收訂金</option>
                          <option value="purchasing">🛒 海外採購中</option>
                          <option value="shipped_overseas">✈️ 國際轉運中</option>
                          <option value="arrived_tw">📦 抵台待秤重</option>
                          <option value="pending_balance">💸 待收尾款</option>
                          <option value="fulfilled">✅ 發貨完成</option>
                          <option value="out_of_stock">⚠️ 專櫃已斷貨</option>
                          <option value="cancelled">❌ 已取消</option>
                        </select>
                        {order.status === 'out_of_stock' && (
                          <div className="text-[10px] mt-0.5">
                            {order.refundStatus === 'refunded' ? (
                              <span className="text-emerald-700 font-bold">✓ 已退款</span>
                            ) : order.refundStatus === 'ready_to_refund' ? (
                              <span className="text-blue-700 font-bold">待匯退款</span>
                            ) : (
                              <span className="text-amber-700">待填退款帳號</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          處理進度
                        </button>
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
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              查無符合條件的代購訂單
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusColors: Record<OrderStatus, string> = {
                draft: 'text-slate-600 bg-slate-100 border-slate-200',
                pending_deposit: 'text-amber-800 bg-amber-50 border-amber-300',
                purchasing: 'text-blue-800 bg-blue-50 border-blue-300',
                shipped_overseas: 'text-sky-800 bg-sky-50 border-sky-300',
                arrived_tw: 'text-purple-800 bg-purple-50 border-purple-300',
                pending_balance: 'text-indigo-800 bg-indigo-50 border-indigo-300',
                fulfilled: 'text-emerald-800 bg-emerald-50 border-emerald-300',
                out_of_stock: 'text-rose-800 bg-rose-50 border-rose-300 font-bold',
                cancelled: 'text-rose-700 bg-rose-50 border-rose-200',
              };

              const isChecked = selectedOrderIds.includes(order.id);
              const isArrived = order.status === 'arrived_tw' || order.status === 'pending_balance';
              const arrivedCount = arrivedCountByCustomer[order.customerId] || 0;

              return (
                <div
                  key={order.id}
                  className={`p-4 space-y-3.5 transition-colors ${
                    isChecked ? 'bg-indigo-50/50' : 'bg-white'
                  }`}
                >
                  {/* Top Bar: Checkbox + Order No + Country + Quick Status Dropdown */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.orderNo}</span>
                          {order.mergedShipmentNo && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                              📦 併單
                            </span>
                          )}
                          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {order.country}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(order.createdAt)}</div>
                      </div>
                    </div>

                    {/* Status Dropdown on Mobile */}
                    <div className="shrink-0 flex flex-col items-end">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus, order)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs focus:ring-1 focus:ring-blue-500 ${statusColors[order.status]}`}
                      >
                        <option value="draft">📝 草稿</option>
                        <option value="pending_deposit">⏳ 待收訂金</option>
                        <option value="purchasing">🛒 海外採購</option>
                        <option value="shipped_overseas">✈️ 國際轉運</option>
                        <option value="arrived_tw">📦 抵台待秤</option>
                        <option value="pending_balance">💸 待收尾款</option>
                        <option value="fulfilled">✅ 發貨完成</option>
                        <option value="out_of_stock">⚠️ 專櫃斷貨</option>
                        <option value="cancelled">❌ 已取消</option>
                      </select>
                      {order.status === 'out_of_stock' && (
                        <div className="text-[9px] mt-0.5">
                          {order.refundStatus === 'refunded' ? (
                            <span className="text-emerald-700 font-bold">✓ 已退款</span>
                          ) : order.refundStatus === 'ready_to_refund' ? (
                            <span className="text-blue-700 font-bold">待匯退款</span>
                          ) : (
                            <span className="text-amber-700">待填退款帳號</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Strip */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 truncate">{order.customerName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{order.customerPhone}</span>
                    </div>
                    {isArrived && arrivedCount >= 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllArrivedOrdersForCustomer(order.customerId);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                      >
                        <Layers className="w-3 h-3 text-indigo-600" />
                        <span>一鍵併單({arrivedCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Product Cover Image & Details */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                      <ProductImage
                        src={order.items[0]?.imageUrl || (order.items[0]?.images && order.items[0]?.images[0])}
                        alt={order.items[0]?.name || '商品首頁圖'}
                        category={order.items[0]?.category}
                        country={order.items[0]?.country || order.country}
                        className="w-full h-full object-cover"
                      />
                      {order.items.length > 1 && (
                        <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-mono px-1 rounded-tl-md font-bold">
                          +{order.items.length - 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {order.items[0]?.name}
                      </div>
                      {order.items[0]?.spec && (
                        <div className="text-[11px] text-blue-600 font-medium truncate mt-0.5">
                          款式: {order.items[0]?.spec}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        共 {order.items.reduce((s, i) => s + i.quantity, 0)} 件 · 商品總計 {formatTwd(order.itemsTotalTwd)}
                      </div>
                    </div>
                  </div>

                  {/* Two Stage Payment Boxes */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100/70 space-y-0.5">
                      <div className="text-[10px] text-blue-700 font-medium">第一階段 (訂金)</div>
                      <div className="font-mono font-bold text-blue-900">{formatTwd(order.depositRequiredTwd)}</div>
                      <div className="text-[10px]">
                        {order.depositPaymentStatus === 'paid' ? (
                          <span className="text-emerald-600 font-semibold">✓ 訂金已付</span>
                        ) : order.depositPaymentStatus === 'verifying' ? (
                          <button
                            onClick={() => onOpenReconciliationWithOrder(order.orderNo)}
                            className="text-amber-600 font-bold underline cursor-pointer"
                          >
                            待審核 ➔
                          </button>
                        ) : (
                          <span className="text-slate-500">未付款</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-100/70 space-y-0.5">
                      <div className="text-[10px] text-purple-700 font-medium">第二階段 (尾款+運)</div>
                      <div className="font-mono font-bold text-purple-900">
                        {order.balanceRequiredTwd > 0 ? formatTwd(order.balanceRequiredTwd) : '待秤重'}
                      </div>
                      <div className="text-[10px]">
                        {order.balancePaymentStatus === 'paid' ? (
                          <span className="text-emerald-600 font-semibold">✓ 尾款已結清</span>
                        ) : order.balancePaymentStatus === 'verifying' ? (
                          <button
                            onClick={() => onOpenReconciliationWithOrder(order.orderNo)}
                            className="text-amber-600 font-bold underline cursor-pointer"
                          >
                            待審核 ➔
                          </button>
                        ) : order.balanceRequiredTwd > 0 ? (
                          <span className="text-indigo-600">待付款</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {order.customerCode ? `編號: ${order.customerCode}` : ''}
                    </span>

                    <button
                      onClick={() => openOrderDetail(order)}
                      className="py-1.5 px-3 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>查看明細與過秤</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Order Detail Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    代購委託單明細：{selectedOrder.orderNo}
                  </h3>
                  <p className="text-xs text-slate-500">
                    建立時間：{formatDateTime(selectedOrder.createdAt)} · 採購國別：{selectedOrder.country}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer & Delivery strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">委託客戶：</span>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedOrder.customerName}
                  </div>
                  <div className="text-slate-600 mt-0.5">電話：{selectedOrder.customerPhone}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">配送方式與收件門市：</span>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedOrder.deliveryMethod}
                  </div>
                  {selectedOrder.customerNotes && (
                    <div className="text-slate-600 mt-0.5">
                      客戶備註：{selectedOrder.customerNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  委託商品項目
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="py-2 px-3">商品項目 / 規格</th>
                        <th className="py-2 px-3">來源店家</th>
                        <th className="py-2 px-3 text-right">確認單價 (NT$)</th>
                        <th className="py-2 px-3 text-center">件數</th>
                        <th className="py-2 px-3 text-right">小計 (NT$)</th>
                        <th className="py-2 px-3 text-center">採購狀態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <ProductImage
                                src={it.imageUrl}
                                alt={it.name}
                                category={it.category}
                                country={it.country}
                                className="w-11 h-11 rounded-xl shrink-0 border border-slate-200 object-cover shadow-2xs"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900">{it.name}</span>
                                  {it.isSecondStageFreight ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200 shrink-0">
                                      需二補
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shrink-0">
                                      一口價
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {it.spec && (
                                    <span className="inline-block text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded font-normal">
                                      規格：{it.spec}
                                    </span>
                                  )}
                                  {it.assignedPurchaserName && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-medium">
                                      買手: {it.assignedPurchaserName}
                                    </span>
                                  )}
                                  {it.actualPurchaseCostTwd ? (
                                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                      成本: {formatTwd(it.actualPurchaseCostTwd)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{it.sourceStore || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <div className="font-bold text-slate-900">{formatTwd(it.unitPriceTwd)}</div>
                            {it.originalPrice ? (
                              <div className="text-[10px] text-slate-400">
                                備註: {formatCurrencyAmount(it.originalPrice, it.country)}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                            {formatTwd(it.subtotalTwd)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded ${
                                it.purchaseStatus === 'purchased'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : it.purchaseStatus === 'out_of_stock'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {it.purchaseStatus === 'purchased'
                                ? '已買到'
                                : it.purchaseStatus === 'out_of_stock'
                                ? '缺貨'
                                : '待採購'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Two-Stage Payment & Logistics Station */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stage 1: Deposit */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-blue-900">
                    <span>第一階段：商品訂金款</span>
                    <span className="font-mono text-sm">{formatTwd(selectedOrder.depositRequiredTwd)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>實收狀態：</span>
                    <span className="font-medium text-slate-900">
                      {selectedOrder.depositPaymentStatus === 'paid' ? (
                        <span className="text-emerald-700">✓ 已入帳 {formatTwd(selectedOrder.depositPaidTwd)}</span>
                      ) : (
                        <span className="text-amber-700">未確認或待核銷</span>
                      )}
                    </span>
                  </div>
                  {selectedOrder.depositPaymentStatus !== 'paid' && (
                    <button
                      onClick={() => {
                        onSelectOrder(null);
                        onOpenReconciliationWithOrder(selectedOrder.orderNo);
                      }}
                      className="w-full mt-2 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      前往核銷訂金末五碼
                    </button>
                  )}
                </div>

                {/* Stage 2: Balance & Weighing */}
                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-purple-900">
                    <span>第二階段：實秤尾款與運費</span>
                    <span className="font-mono text-sm">{formatTwd(selectedOrder.balanceRequiredTwd)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>包裹實重：</span>
                    <span className="font-mono font-medium text-slate-900">
                      {selectedOrder.actualWeightKg ? `${selectedOrder.actualWeightKg} kg` : '尚未填寫'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>尾款收取：</span>
                    <span>
                      {selectedOrder.balancePaymentStatus === 'paid' ? (
                        <span className="text-emerald-700 font-medium">✓ 已結清尾款</span>
                      ) : (
                        <span className="text-purple-700 font-medium">待顧客匯款或核銷</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrival & Weighing Tool (For 'arrived_tw' or 'purchasing' orders) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-purple-600" />
                    商品抵台秤重與尾款試算
                  </h4>
                  {selectedOrder.balanceRequiredTwd > 0 && (
                    <button
                      onClick={handleCopyBalanceNotice}
                      className="inline-flex items-center gap-1 text-xs text-purple-700 font-medium hover:underline"
                    >
                      {copiedBalanceCopy ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedBalanceCopy ? '已複製尾款通知！' : '複製尾款通知給顧客'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      包裹實秤重量 (kg)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={editActualWeight}
                      onChange={(e) => setEditActualWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      優惠折抵 (NT$)
                    </label>
                    <input
                      type="number"
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSaveWeighingAndComputeBalance}
                      className="w-full py-1.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-medium text-xs shadow-xs"
                    >
                      計算並產出尾款單
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      海外/國際轉運單號
                    </label>
                    <input
                      type="text"
                      value={editOverseasTracking}
                      onChange={(e) => setEditOverseasTracking(e.target.value)}
                      placeholder="例：FEDEX-992819827USA"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      台灣本地超商/黑貓單號
                    </label>
                    <input
                      type="text"
                      value={editDomesticTracking}
                      onChange={(e) => setEditDomesticTracking(e.target.value)}
                      placeholder="例：7-11 寄件編號 299381829"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Out of Stock and Refund Station */}
              {(selectedOrder.status === 'out_of_stock' || selectedOrder.isOutOfStock) && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-rose-950">
                      <Ban className="w-4 h-4 text-rose-600" />
                      <span>⚠️ 商品專櫃/官網已斷貨 (未購得)</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      {selectedOrder.refundStatus === 'refunded'
                        ? '全額退款已完成'
                        : selectedOrder.refundStatus === 'ready_to_refund'
                        ? '顧客已回報帳號 · 待匯款'
                        : '待顧客回報退款帳號'}
                    </span>
                  </div>

                  <div className="text-[11px] text-rose-800">
                    斷貨原因：{selectedOrder.outOfStockReason || '買手現場專櫃與官方庫存已斷貨'}
                  </div>

                  {/* Refund Details */}
                  {selectedOrder.depositPaidTwd > 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-rose-200 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>應全額退還訂金：</span>
                        <span className="font-mono text-sm font-bold text-rose-700">
                          {formatTwd(selectedOrder.refundAmountTwd || selectedOrder.depositPaidTwd)}
                        </span>
                      </div>

                      {selectedOrder.refundStatus === 'ready_to_refund' && selectedOrder.refundBankInfo && (
                        <div className="space-y-1.5 text-slate-700 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                          <div className="font-bold text-blue-950 text-xs">顧客已填寫退款銀行資料：</div>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            <div>
                              銀行：
                              <strong>
                                {selectedOrder.refundBankInfo.bankCode} {selectedOrder.refundBankInfo.bankName}
                              </strong>
                            </div>
                            <div>
                              戶名：<strong>{selectedOrder.refundBankInfo.accountHolder}</strong>
                            </div>
                            <div className="col-span-2 font-mono">
                              帳號：<strong>{selectedOrder.refundBankInfo.accountNo}</strong>
                            </div>
                            {selectedOrder.refundBankInfo.note && (
                              <div className="col-span-2 text-stone-500">
                                備註：{selectedOrder.refundBankInfo.note}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminRefundTransferRef('');
                              setIsAdminRefundModalOpen(true);
                            }}
                            className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                          >
                            ✅ 已轉帳退款！登記交易序號完成退款
                          </button>
                        </div>
                      )}

                      {selectedOrder.refundStatus === 'refunded' && (
                        <div className="text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-[11px] space-y-0.5">
                          <div className="font-bold">
                            ✓ 已於 {formatDateTime(selectedOrder.refundCompletedAt || '')} 完成全額退款
                          </div>
                          <div className="font-mono">
                            轉帳交易序號：{selectedOrder.refundTransferRef || '已完成轉帳'}
                          </div>
                        </div>
                      )}

                      {(selectedOrder.refundStatus === 'pending_info' || !selectedOrder.refundStatus) && (
                        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                          <span className="text-[11px] text-amber-800">
                            ⏳ 顧客可於前台登入直接填寫退款銀行帳號
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminManualBankCode('');
                              setAdminManualBankName('');
                              setAdminManualAccountNo('');
                              setAdminManualAccountHolder(selectedOrder.customerName);
                              setIsAdminEnteringBankInfo(true);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            小幫手代填帳號
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">此訂單先前未收取訂金，無需退款。</div>
                  )}
                </div>
              )}

              {/* Dropdown Order Status Selection (Requirement 3: 訂單狀態，要使用下拉選單的方式來選擇) */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>訂單處理狀態（使用下拉選單變更）：</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${statusColors[selectedOrder.status]}`}>
                    目前狀態：{statusNames[selectedOrder.status]}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative flex-1 min-w-[220px]">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus, selectedOrder)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="draft">📝 草稿 (報價審核中)</option>
                      <option value="pending_deposit">⏳ 待收訂金 (等待買家轉帳)</option>
                      <option value="purchasing">🛒 海外採購中 (買手專櫃下單)</option>
                      <option value="shipped_overseas">✈️ 國際轉運中 (空運航班回台)</option>
                      <option value="arrived_tw">📦 已抵台待秤重 (抵達轉運倉待出貨)</option>
                      <option value="pending_balance">💸 待收尾款 (通知買家補運費/尾款)</option>
                      <option value="fulfilled">✅ 發貨完成 (商品已出貨寄出)</option>
                      <option value="out_of_stock">⚠️ 專櫃已斷貨 (辦理全額退款)</option>
                      <option value="cancelled">❌ 已取消委託單</option>
                    </select>
                  </div>

                  {selectedOrder.status !== 'out_of_stock' && (
                    <button
                      type="button"
                      onClick={() => handleOpenOutOfStockModal(selectedOrder)}
                      className="px-3 py-2 text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-600" />
                      <span>斷貨退款登記</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Orders Modal */}
      {isMergeModalOpen && selectedOrders.length >= 2 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    合併訂單安排出貨 ({selectedOrders.length} 筆)
                  </h3>
                  <p className="text-xs text-slate-500">
                    將同一客戶抵台商品整併為同一個寄件包裹發出
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Info Strip */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950">
                  收件客戶：{selectedOrders[0].customerName} ({selectedOrders[0].customerPhone})
                </span>
                <span className="text-[11px] text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 font-mono">
                  共 {selectedOrders.length} 筆訂單
                </span>
              </div>
              <div className="text-indigo-800 text-[11px]">
                配送方式與門市：<strong>{selectedOrders[0].deliveryMethod}</strong>
              </div>
            </div>

            {/* Orders Summary List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">合併商品清單：</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {selectedOrders.map((ord) => (
                  <div key={ord.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{ord.orderNo}</span>
                        <span className="text-[10px] text-slate-500">({ord.items.length} 個品項)</span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5">
                        {ord.items.map((i) => `${i.name} × ${i.quantity}`).join('、')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {ord.actualWeightKg ? `${ord.actualWeightKg} kg` : '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        尾款: {formatTwd(ord.balanceRequiredTwd || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consolidated Freight & Savings */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>合併寄送總計商品件數：</span>
                <span className="font-mono text-sm">
                  {selectedOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0), 0)} 件
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-emerald-200/60">
                <input
                  type="checkbox"
                  checked={mergeDiscountExtraFreight}
                  onChange={(e) => setMergeDiscountExtraFreight(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] text-emerald-900 font-medium">
                  自動為客戶減免多餘超取運費 (同箱僅收取 1 筆運費，其餘訂單國內運費設為 0)
                </span>
              </label>
            </div>

            {/* Tracking & Carrier Input */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    寄件物流商 *
                  </label>
                  <select
                    value={mergeDomesticCarrier}
                    onChange={(e) => setMergeDomesticCarrier(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 cursor-pointer"
                  >
                    <option value="7-11 交貨便">7-11 交貨便</option>
                    <option value="全家店到店">全家店到店</option>
                    <option value="黑貓宅急便">黑貓宅急便</option>
                    <option value="新竹物流">新竹物流</option>
                    <option value="中華郵政包裹">中華郵政包裹</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    台灣本地寄件單號 / 配送編號 *
                  </label>
                  <input
                    type="text"
                    required
                    value={mergeTrackingNo}
                    onChange={(e) => setMergeTrackingNo(e.target.value)}
                    placeholder="例：711-209182390 或 黑貓單號"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  合併出貨備註 (選填)
                </label>
                <input
                  type="text"
                  value={mergeNote}
                  onChange={(e) => setMergeNote(e.target.value)}
                  placeholder="例：多單同箱寄送、外箱已加強防撞氣泡"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyMergedNotice}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedMergeNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMergeNotice ? '已複製發貨文案！' : '複製合併發貨 LINE 通知'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMergeShipment}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>確認合併出貨並更新狀態</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Out of Stock Confirmation Modal */}
      {isOutOfStockModalOpen && outOfStockTargetOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">
                  標記商品已斷貨【{outOfStockTargetOrder.orderNo}】
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOutOfStockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-rose-950">
                客戶：{outOfStockTargetOrder.customerName} ({outOfStockTargetOrder.customerPhone})
              </div>
              <div className="text-rose-800">
                委託品項：{outOfStockTargetOrder.items.map((i) => i.name).join('、')}
              </div>
              {outOfStockTargetOrder.depositPaidTwd > 0 ? (
                <div className="text-rose-900 font-bold bg-white p-2 rounded border border-rose-200 mt-1">
                  💰 客戶已支付訂金 NT$ {outOfStockTargetOrder.depositPaidTwd}，系統將啟動全額退款流程，並允許客人在前台填寫退款銀行帳號。
                </div>
              ) : (
                <div className="text-stone-500 text-[11px]">
                  此訂單尚未付款，標記斷貨後將自動結案。
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                斷貨原因備註 (專櫃現場回報狀況) *
              </label>
              <textarea
                rows={2}
                value={outOfStockReasonInput}
                onChange={(e) => setOutOfStockReasonInput(e.target.value)}
                placeholder="例如：專櫃官方庫存已斷貨，買手無法購得"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyOutOfStockNotice}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedOutOfStockNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOutOfStockNotice ? '已複製致歉文案！' : '複製斷貨致歉 LINE 文案'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOutOfStockModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOutOfStock}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  確認標記為已斷貨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Manual Bank Entry Modal */}
      {isAdminEnteringBankInfo && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                代填顧客退款銀行帳戶【{selectedOrder.orderNo}】
              </h3>
              <button
                type="button"
                onClick={() => setIsAdminEnteringBankInfo(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">銀行代碼 (3 碼) *</label>
                  <input
                    type="text"
                    value={adminManualBankCode}
                    onChange={(e) => setAdminManualBankCode(e.target.value)}
                    placeholder="例：822 或 013"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">銀行名稱 *</label>
                  <input
                    type="text"
                    value={adminManualBankName}
                    onChange={(e) => setAdminManualBankName(e.target.value)}
                    placeholder="例：中國信託商業銀行"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">銀行帳號 *</label>
                <input
                  type="text"
                  value={adminManualAccountNo}
                  onChange={(e) => setAdminManualAccountNo(e.target.value)}
                  placeholder="例：0981-229-182918"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">帳戶戶名 *</label>
                <input
                  type="text"
                  value={adminManualAccountHolder}
                  onChange={(e) => setAdminManualAccountHolder(e.target.value)}
                  placeholder="例：王小明"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdminEnteringBankInfo(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAdminManualBankInfo}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                儲存退款帳戶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Confirm Refund Modal */}
      {isAdminRefundModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">
                  登記已完成退款【{selectedOrder.orderNo}】
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminRefundModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div>退款對象：<strong>{selectedOrder.customerName}</strong></div>
              <div>退款金額：<strong className="font-mono text-emerald-900 text-sm">{formatTwd(selectedOrder.refundAmountTwd || selectedOrder.depositPaidTwd)}</strong></div>
              {selectedOrder.refundBankInfo && (
                <div className="text-[11px] text-emerald-800 font-mono mt-1 pt-1 border-t border-emerald-200">
                  帳戶：{selectedOrder.refundBankInfo.bankName} {selectedOrder.refundBankInfo.accountNo} (戶名: {selectedOrder.refundBankInfo.accountHolder})
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                網銀轉帳交易序號 / 備註 *
              </label>
              <input
                type="text"
                value={adminRefundTransferRef}
                onChange={(e) => setAdminRefundTransferRef(e.target.value)}
                placeholder="例：TXN-882910 或 玉山網銀末五碼 19283"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdminRefundModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmRefundCompleted}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                確認已完成退款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
