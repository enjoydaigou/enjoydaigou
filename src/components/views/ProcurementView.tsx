import React, { useState } from 'react';
import { Currency, Order, OrderItem, SystemSettings } from '../../types';
import { formatCurrencyAmount, formatTwd } from '../../utils/format';
import { exportProcurementToExcel } from '../../utils/excelExport';
import { ProductImage } from '../common/ProductImage';
import {
  ShoppingCart,
  CheckSquare,
  Square,
  AlertTriangle,
  Printer,
  ExternalLink,
  Store,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  UserCheck,
  DollarSign,
  Calculator,
  Tag,
  Check,
  X,
  Sparkles,
  TrendingUp,
  Receipt,
} from 'lucide-react';

interface ProcurementViewProps {
  orders: Order[];
  settings: SystemSettings;
  onUpdateOrderItemStatus: (
    orderId: string,
    itemId: string,
    newStatus: 'pending' | 'purchased' | 'out_of_stock',
    actualCost?: number,
    note?: string,
    buyerDetails?: {
      assignedPurchaserName?: string;
      purchaserPricingType?: 'self' | 'commission_fixed' | 'commission_percent' | 'flat_cost';
      purchaserCommissionTwd?: number;
      actualPurchaseCostTwd?: number;
    }
  ) => void;
}

interface AggregatedItem {
  key: string;
  name: string;
  category: string;
  country: Currency;
  sourceStore: string;
  originalPrice?: number;
  totalQuantity: number;
  purchasedQuantity: number;
  imageUrl?: string;
  orders: {
    orderId: string;
    orderNo: string;
    customerName: string;
    itemId: string;
    spec?: string;
    quantity: number;
    unitPriceTwd: number;
    subtotalTwd: number;
    purchaseStatus: 'pending' | 'purchased' | 'out_of_stock';
    actualCostOriginal?: number;
    assignedPurchaserName?: string;
    purchaserPricingType?: 'self' | 'commission_fixed' | 'commission_percent' | 'flat_cost';
    purchaserCommissionTwd?: number;
    actualPurchaseCostTwd?: number;
    note?: string;
  }[];
}

interface CostModalState {
  orderId: string;
  itemId: string;
  orderNo: string;
  customerName: string;
  itemName: string;
  spec?: string;
  imageUrl?: string;
  quantity: number;
  country: Currency;
  unitPriceTwd: number;
  assignedPurchaserName: string;
  customPurchaserName: string;
  purchaserPricingType: 'self' | 'commission_fixed' | 'commission_percent' | 'flat_cost';
  actualPurchaseCostOriginal: number;
  purchaserCommissionTwd: number;
  flatCostTwd: number;
  purchaseNote: string;
  purchaseStatus: 'pending' | 'purchased' | 'out_of_stock';
  applyToAllInAgg: boolean;
  aggKey?: string;
}

const PRESET_BUYERS = [
  { id: 'self', name: '店主親自採購', label: '店主親採 (無買手抽成)' },
  { id: 'wendy', name: 'Wendy (日本買手)', label: '🇯🇵 Wendy (日本現場/專櫃)' },
  { id: 'alice', name: 'Alice (韓國買手)', label: '🇰🇷 Alice (東大門/品牌官網)' },
  { id: 'ken', name: 'Ken (美國買手)', label: '🇺🇸 Ken (美國官網/Outlet)' },
  { id: 'custom', name: 'custom', label: '✏️ 其他自訂買手' },
];

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  orders,
  settings,
  onUpdateOrderItemStatus,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [filterPurchaser, setFilterPurchaser] = useState<string>('all');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Cost Recording Modal State
  const [costModal, setCostModal] = useState<CostModalState | null>(null);

  // Target orders: purchasing or pending_deposit where deposit is paid
  const activeOrders = orders.filter(
    (o) =>
      o.status === 'purchasing' ||
      (o.status === 'pending_deposit' && o.depositPaymentStatus === 'paid')
  );

  // Aggregate items across active orders
  const aggregatedMap = new Map<string, AggregatedItem>();

  activeOrders.forEach((order) => {
    order.items.forEach((item) => {
      const key = `${item.country}_${item.name.trim()}_${item.sourceStore || 'default'}`;
      if (!aggregatedMap.has(key)) {
        aggregatedMap.set(key, {
          key,
          name: item.name,
          category: item.category,
          country: item.country,
          sourceStore: item.sourceStore || '專櫃或品牌官網',
          originalPrice: item.originalPrice,
          totalQuantity: 0,
          purchasedQuantity: 0,
          imageUrl: item.imageUrl || (item.images && item.images[0]),
          orders: [],
        });
      }

      const agg = aggregatedMap.get(key)!;
      agg.totalQuantity += item.quantity;
      if (item.purchaseStatus === 'purchased') {
        agg.purchasedQuantity += item.quantity;
      }
      agg.orders.push({
        orderId: order.id,
        orderNo: order.orderNo,
        customerName: order.customerName,
        itemId: item.id,
        spec: item.spec,
        quantity: item.quantity,
        unitPriceTwd: item.unitPriceTwd,
        subtotalTwd: item.subtotalTwd,
        purchaseStatus: item.purchaseStatus,
        actualCostOriginal: item.actualPurchaseCostOriginal,
        assignedPurchaserName: item.assignedPurchaserName || '店主親自採購',
        purchaserPricingType: item.purchaserPricingType || 'self',
        purchaserCommissionTwd: item.purchaserCommissionTwd || 0,
        actualPurchaseCostTwd: item.actualPurchaseCostTwd,
        note: item.purchaseNote,
      });
    });
  });

  const aggregatedList = Array.from(aggregatedMap.values()).filter((item) => {
    if (selectedCountry !== 'all' && item.country !== selectedCountry) return false;
    if (filterStore !== 'all' && item.sourceStore !== filterStore) return false;
    if (filterPurchaser !== 'all') {
      const hasPurchaser = item.orders.some((o) => (o.assignedPurchaserName || '店主親自採購') === filterPurchaser);
      if (!hasPurchaser) return false;
    }
    return true;
  });

  // Extract distinct stores and purchasers for filters
  const distinctStores = Array.from(new Set(Array.from(aggregatedMap.values()).map((a) => a.sourceStore)));
  const distinctPurchasers = Array.from(
    new Set(
      Array.from(aggregatedMap.values()).flatMap((a) =>
        a.orders.map((o) => o.assignedPurchaserName || '店主親自採購')
      )
    )
  );

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    window.print();
  };

  // KPI Calculations
  const totalItemsToBuy = aggregatedList.reduce((sum, it) => sum + it.totalQuantity, 0);
  const totalItemsBought = aggregatedList.reduce((sum, it) => sum + it.purchasedQuantity, 0);

  // Total recorded procurement cost & total revenue for purchased items
  let totalPurchasedCostTwd = 0;
  let totalPurchasedRevenueTwd = 0;

  activeOrders.forEach((o) => {
    o.items.forEach((it) => {
      if (it.purchaseStatus === 'purchased') {
        const itemCost = it.actualPurchaseCostTwd || 0;
        totalPurchasedCostTwd += itemCost * it.quantity;
        totalPurchasedRevenueTwd += it.subtotalTwd;
      }
    });
  });

  const totalEstimatedProfitTwd = totalPurchasedRevenueTwd - totalPurchasedCostTwd;

  // Open Cost Recording Modal
  const handleOpenCostModal = (
    agg: AggregatedItem,
    sub: AggregatedItem['orders'][0]
  ) => {
    const isCustom = !PRESET_BUYERS.some(
      (p) => p.name === sub.assignedPurchaserName && p.id !== 'custom'
    );
    const baseRate = settings.exchangeRates[agg.country]?.baseRate || 1;
    const defaultOriginal = sub.actualCostOriginal || agg.originalPrice || 0;

    // Calculate initial flat cost or compute
    const defaultCostTwd =
      sub.actualPurchaseCostTwd || Math.round(defaultOriginal * baseRate);

    setCostModal({
      orderId: sub.orderId,
      itemId: sub.itemId,
      orderNo: sub.orderNo,
      customerName: sub.customerName,
      itemName: agg.name,
      spec: sub.spec,
      imageUrl: agg.imageUrl,
      quantity: sub.quantity,
      country: agg.country,
      unitPriceTwd: sub.unitPriceTwd,
      assignedPurchaserName: isCustom ? 'custom' : sub.assignedPurchaserName || '店主親自採購',
      customPurchaserName: isCustom ? sub.assignedPurchaserName || '' : '',
      purchaserPricingType: sub.purchaserPricingType || 'self',
      actualPurchaseCostOriginal: defaultOriginal,
      purchaserCommissionTwd: sub.purchaserCommissionTwd || 0,
      flatCostTwd: defaultCostTwd,
      purchaseNote: sub.note || '',
      purchaseStatus: sub.purchaseStatus,
      applyToAllInAgg: false,
      aggKey: agg.key,
    });
  };

  // Compute calculated unit cost TWD based on modal state
  const computeCalculatedUnitCost = (state: CostModalState): number => {
    const baseRate = settings.exchangeRates[state.country]?.baseRate || 1;
    const original = state.actualPurchaseCostOriginal || 0;

    if (state.purchaserPricingType === 'self') {
      // 店主親自採購：原幣換算台幣成本
      return Math.round(original * baseRate);
    } else if (state.purchaserPricingType === 'commission_fixed') {
      // 實付原幣 + 買手固定抽成/件
      return Math.round(original * baseRate + (state.purchaserCommissionTwd || 0));
    } else if (state.purchaserPricingType === 'commission_percent') {
      // 實付原幣 + 買手抽成趴數 (例如 8%)
      const commissionRate = (state.purchaserCommissionTwd || 0) / 100;
      return Math.round(original * baseRate * (1 + commissionRate));
    } else if (state.purchaserPricingType === 'flat_cost') {
      // 買手一口價進貨成本
      return Math.round(state.flatCostTwd || 0);
    }
    return Math.round(original * baseRate);
  };

  // Save Cost Modal changes
  const handleSaveCostModal = (newStatus?: 'pending' | 'purchased' | 'out_of_stock') => {
    if (!costModal) return;

    const finalPurchaserName =
      costModal.assignedPurchaserName === 'custom'
        ? costModal.customPurchaserName.trim() || '自訂買手'
        : costModal.assignedPurchaserName;

    const unitCostTwd = computeCalculatedUnitCost(costModal);
    const targetStatus = newStatus || costModal.purchaseStatus;

    if (costModal.applyToAllInAgg && costModal.aggKey) {
      const agg = aggregatedMap.get(costModal.aggKey);
      if (agg) {
        agg.orders.forEach((sub) => {
          onUpdateOrderItemStatus(
            sub.orderId,
            sub.itemId,
            targetStatus,
            costModal.actualPurchaseCostOriginal,
            costModal.purchaseNote,
            {
              assignedPurchaserName: finalPurchaserName,
              purchaserPricingType: costModal.purchaserPricingType,
              purchaserCommissionTwd: costModal.purchaserCommissionTwd,
              actualPurchaseCostTwd: unitCostTwd,
            }
          );
        });
      }
    } else {
      onUpdateOrderItemStatus(
        costModal.orderId,
        costModal.itemId,
        targetStatus,
        costModal.actualPurchaseCostOriginal,
        costModal.purchaseNote,
        {
          assignedPurchaserName: finalPurchaserName,
          purchaserPricingType: costModal.purchaserPricingType,
          purchaserCommissionTwd: costModal.purchaserCommissionTwd,
          actualPurchaseCostTwd: unitCostTwd,
        }
      );
    }

    setCostModal(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">待採購總件數</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {totalItemsToBuy} <span className="text-xs font-normal text-slate-500">件</span>
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">跨訂單商品彙整</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">已完成採購件數</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {totalItemsBought} <span className="text-xs font-normal text-slate-500">件</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            達成率 {totalItemsToBuy > 0 ? Math.round((totalItemsBought / totalItemsToBuy) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">已採購進貨總成本</div>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            {formatTwd(totalPurchasedCostTwd)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">含專櫃實付與買手抽成</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">預估採購毛利</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            +{formatTwd(Math.max(0, totalEstimatedProfitTwd))}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            毛利率 {totalPurchasedRevenueTwd > 0 ? Math.round((totalEstimatedProfitTwd / totalPurchasedRevenueTwd) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Control Bar & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              買手採購彙總清單 (已聚合跨單同品 · 支援多買手成本記錄)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              可分別指派店主或不同買手採購，並記錄專櫃原幣與計價方式，精確統計進貨成本與利潤。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportProcurementToExcel(orders)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer"
              title="匯出海外買手採購彙總清單為 Excel 檔案 (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>匯出 Excel 採購表</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印採購單</span>
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">採購國別：</span>
            <div className="flex items-center gap-1">
              {['all', 'JPY', 'KRW', 'USD', 'EUR'].map((cur) => (
                <button
                  key={cur}
                  onClick={() => setSelectedCountry(cur)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedCountry === cur
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cur === 'all' ? '全部國家' : cur}
                </button>
              ))}
            </div>
          </div>

          {distinctStores.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">購買門市：</span>
              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value="all">全部門市 ({distinctStores.length})</option>
                {distinctStores.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {distinctPurchasers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">採購買手：</span>
              <select
                value={filterPurchaser}
                onChange={(e) => setFilterPurchaser(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
              >
                <option value="all">全部採購人員 ({distinctPurchasers.length})</option>
                {distinctPurchasers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Progress bar */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-600">
              採購進度：<strong className="font-mono text-slate-900">{totalItemsBought}</strong> / {totalItemsToBuy} 件
            </span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${totalItemsToBuy > 0 ? (totalItemsBought / totalItemsToBuy) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated List */}
      <div className="space-y-3">
        {aggregatedList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
            <p className="text-sm font-medium text-slate-700">目前沒有需要海外採購的商品</p>
            <p className="text-xs text-slate-500 mt-1">
              當委託單收到訂金並標記為「採購中」後，商品將會自動在此分類聚合顯示。
            </p>
          </div>
        ) : (
          aggregatedList.map((agg) => {
            const isExpanded = !!expandedKeys[agg.key];
            const isAllPurchased = agg.purchasedQuantity >= agg.totalQuantity;

            return (
              <div
                key={agg.key}
                className={`bg-white border rounded-xl overflow-hidden transition-all shadow-xs ${
                  isAllPurchased ? 'border-emerald-200 bg-emerald-50/15' : 'border-slate-200'
                }`}
              >
                {/* Aggregated Header Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpand(agg.key)}
                      className="mt-1 p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <ProductImage
                      src={agg.imageUrl}
                      alt={agg.name}
                      category={agg.category}
                      country={agg.country}
                      className="w-14 h-14 rounded-xl shrink-0 border border-slate-200 object-cover shadow-2xs"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {agg.country}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 truncate">{agg.name}</h3>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          {agg.sourceStore}
                        </span>
                        {agg.originalPrice ? (
                          <>
                            <span>·</span>
                            <span>
                              原幣標價：
                              <strong className="font-mono text-slate-800">
                                {formatCurrencyAmount(agg.originalPrice, agg.country)}
                              </strong>
                            </span>
                          </>
                        ) : null}
                        <span>·</span>
                        <span className="text-blue-700 font-medium">關聯 {agg.orders.length} 筆客戶分單</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Global Status */}
                  <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">需採購總數</div>
                      <div className="text-lg font-bold font-mono text-blue-700">
                        {agg.purchasedQuantity} / {agg.totalQuantity} 件
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(agg.key)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                    >
                      {isExpanded ? '收合明細' : `展開各單 (${agg.orders.length})`}
                    </button>
                  </div>
                </div>

                {/* Sub-order breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>各訂單分配清單、指派買手與成本記錄：</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        點擊「登記買手與成本」可記錄專櫃實付、抽成方式與試算毛利
                      </span>
                    </div>

                    <div className="space-y-2">
                      {agg.orders.map((sub) => {
                        const isPurchased = sub.purchaseStatus === 'purchased';
                        const isOutOfStock = sub.purchaseStatus === 'out_of_stock';
                        const unitProfit = sub.actualPurchaseCostTwd
                          ? sub.unitPriceTwd - sub.actualPurchaseCostTwd
                          : undefined;

                        return (
                          <div
                            key={sub.orderId + sub.itemId}
                            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                onClick={() => {
                                  const next = isPurchased ? 'pending' : 'purchased';
                                  onUpdateOrderItemStatus(sub.orderId, sub.itemId, next);
                                }}
                                className="mt-0.5 text-slate-600 hover:text-blue-600 cursor-pointer"
                                title={isPurchased ? '點擊標記為未購入' : '點擊標記為已購入'}
                              >
                                {isPurchased ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-blue-900">{sub.orderNo}</span>
                                  <span className="text-slate-300">/</span>
                                  <span className="text-slate-900 font-semibold">{sub.customerName}</span>
                                  {sub.spec && (
                                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-normal">
                                      規格: {sub.spec}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px]">
                                  <span className="text-slate-500">
                                    委託 <strong className="font-mono text-slate-800">{sub.quantity}</strong> 件 · 客人售價: <strong className="font-mono text-slate-900">{formatTwd(sub.unitPriceTwd)}</strong>
                                  </span>

                                  {/* Buyer badge */}
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/80">
                                    買手: {sub.assignedPurchaserName || '店主親採'}
                                  </span>

                                  {/* Cost & Profit info */}
                                  {sub.actualPurchaseCostTwd ? (
                                    <>
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                                        單件成本: {formatTwd(sub.actualPurchaseCostTwd)}
                                      </span>
                                      {unitProfit !== undefined && (
                                        <span
                                          className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                                            unitProfit >= 0
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-rose-50 text-rose-700'
                                          }`}
                                        >
                                          利潤: {unitProfit >= 0 ? `+${formatTwd(unitProfit)}` : formatTwd(unitProfit)}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                                      ⚠️ 尚未記錄成本
                                    </span>
                                  )}
                                </div>

                                {sub.note && (
                                  <div className="text-[10px] text-slate-500 mt-1 italic">
                                    備註: {sub.note}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleOpenCostModal(agg, sub)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                                <span>{sub.actualPurchaseCostTwd ? '編輯成本/買手' : '登記買手與成本'}</span>
                              </button>

                              <button
                                onClick={() =>
                                  onUpdateOrderItemStatus(sub.orderId, sub.itemId, isPurchased ? 'pending' : 'purchased')
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  isPurchased
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {isPurchased ? '✓ 已購入' : '標記已購入'}
                              </button>

                              <button
                                onClick={() =>
                                  onUpdateOrderItemStatus(sub.orderId, sub.itemId, 'out_of_stock')
                                }
                                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                  isOutOfStock
                                    ? 'bg-rose-600 text-white font-bold'
                                    : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-700'
                                }`}
                              >
                                斷貨
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cost & Buyer Recording Modal */}
      {costModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col my-auto">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 bg-white z-10 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    登記採購買手與進貨成本
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    訂單 {costModal.orderNo} · {costModal.customerName} · 委託 {costModal.quantity} 件
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCostModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Product Info Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <ProductImage
                  src={costModal.imageUrl}
                  alt={costModal.itemName}
                  country={costModal.country}
                  className="w-12 h-12 rounded-lg shrink-0 border border-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{costModal.itemName}</div>
                  {costModal.spec && (
                    <div className="text-[11px] text-blue-700">規格：{costModal.spec}</div>
                  )}
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    客戶下單售價：<strong className="font-mono text-slate-900">{formatTwd(costModal.unitPriceTwd)}</strong> / 件
                  </div>
                </div>
              </div>

              {/* 1. Buyer Selector (多位買手) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. 負責採購人員 (買手) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_BUYERS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        setCostModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                assignedPurchaserName: b.name,
                                purchaserPricingType: b.id === 'self' ? 'self' : prev.purchaserPricingType,
                              }
                            : null
                        )
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        costModal.assignedPurchaserName === b.name
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs truncate">{b.label}</div>
                    </button>
                  ))}
                </div>

                {costModal.assignedPurchaserName === 'custom' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      required
                      value={costModal.customPurchaserName}
                      onChange={(e) =>
                        setCostModal((prev) =>
                          prev ? { ...prev, customPurchaserName: e.target.value } : null
                        )
                      }
                      placeholder="請輸入自訂買手姓名或代號 (例如: 小林-東京專線)"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-slate-900 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* 2. Pricing Method (計價方式) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  2. 買手計價方式與成本模式 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCostModal((prev) => (prev ? { ...prev, purchaserPricingType: 'self' } : null))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      costModal.purchaserPricingType === 'self'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">店主親採 (實付原幣)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">專櫃原幣金額 × 基準匯率</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCostModal((prev) =>
                        prev ? { ...prev, purchaserPricingType: 'commission_fixed' } : null
                      )
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      costModal.purchaserPricingType === 'commission_fixed'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">原幣實支 + 固定抽成</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">原幣 × 匯率 + 買手固定費/件</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCostModal((prev) =>
                        prev ? { ...prev, purchaserPricingType: 'commission_percent' } : null
                      )
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      costModal.purchaserPricingType === 'commission_percent'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">原幣實支 + 抽成百分比</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">原幣 × 匯率 × (1 + 抽成%)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCostModal((prev) =>
                        prev ? { ...prev, purchaserPricingType: 'flat_cost' } : null
                      )
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      costModal.purchaserPricingType === 'flat_cost'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">買手一口價進貨成本</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">直接填寫單件實付台幣總額</div>
                  </button>
                </div>
              </div>

              {/* 3. Cost Inputs depending on Pricing Type */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                {costModal.purchaserPricingType !== 'flat_cost' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        專櫃實付原幣標價 ({costModal.country}) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={costModal.actualPurchaseCostOriginal}
                        onChange={(e) =>
                          setCostModal((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  actualPurchaseCostOriginal: parseFloat(e.target.value) || 0,
                                }
                              : null
                          )
                        }
                        placeholder="例: 1500"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        基準匯率: {settings.exchangeRates[costModal.country]?.baseRate || 1}
                      </span>
                    </div>

                    {costModal.purchaserPricingType === 'commission_fixed' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          買手固定抽成/件 (NT$)
                        </label>
                        <input
                          type="number"
                          value={costModal.purchaserCommissionTwd}
                          onChange={(e) =>
                            setCostModal((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    purchaserCommissionTwd: parseFloat(e.target.value) || 0,
                                  }
                                : null
                            )
                          }
                          placeholder="例: 50"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                        />
                      </div>
                    )}

                    {costModal.purchaserPricingType === 'commission_percent' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          買手抽成趴數 (%)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.5"
                            value={costModal.purchaserCommissionTwd}
                            onChange={(e) =>
                              setCostModal((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      purchaserCommissionTwd: parseFloat(e.target.value) || 0,
                                    }
                                  : null
                              )
                            }
                            placeholder="例: 8"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                          />
                          <span className="font-bold text-slate-700">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      單件買手一口價進貨成本 (NT$) *
                    </label>
                    <input
                      type="number"
                      value={costModal.flatCostTwd}
                      onChange={(e) =>
                        setCostModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                flatCostTwd: parseFloat(e.target.value) || 0,
                              }
                            : null
                        )
                      }
                      placeholder="例: 450"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 font-bold"
                    />
                  </div>
                )}

                {/* Real-time Computed Profit Card */}
                {(() => {
                  const computedUnitCost = computeCalculatedUnitCost(costModal);
                  const unitProfit = costModal.unitPriceTwd - computedUnitCost;
                  const totalProfit = unitProfit * costModal.quantity;
                  const marginPct =
                    costModal.unitPriceTwd > 0
                      ? Math.round((unitProfit / costModal.unitPriceTwd) * 100)
                      : 0;

                  return (
                    <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-blue-950 font-bold">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span>即時試算進貨成本與毛利</span>
                        </span>
                        <span className="font-mono text-sm text-blue-800">
                          進貨成本: {formatTwd(computedUnitCost)} / 件
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60 text-[11px]">
                        <div>
                          單件毛利：
                          <strong
                            className={`font-mono ${
                              unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {unitProfit >= 0 ? `+${formatTwd(unitProfit)}` : formatTwd(unitProfit)} ({marginPct}%)
                          </strong>
                        </div>
                        <div className="text-right">
                          本筆總獲利 ({costModal.quantity} 件)：
                          <strong
                            className={`font-mono ${
                              totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {totalProfit >= 0 ? `+${formatTwd(totalProfit)}` : formatTwd(totalProfit)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Purchase Note */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    採購備註說明 (選填)
                  </label>
                  <input
                    type="text"
                    value={costModal.purchaseNote}
                    onChange={(e) =>
                      setCostModal((prev) =>
                        prev ? { ...prev, purchaseNote: e.target.value } : null
                      )
                    }
                    placeholder="例：專櫃小票號碼 #88219，已檢查吊牌完好"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Batch apply option */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="applyAll"
                  checked={costModal.applyToAllInAgg}
                  onChange={(e) =>
                    setCostModal((prev) =>
                      prev ? { ...prev, applyToAllInAgg: e.target.checked } : null
                    )
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="applyAll" className="text-xs text-slate-700 cursor-pointer select-none">
                  同時將此買手與計價成本套用到此商品的所有同品訂單
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setCostModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer font-medium"
              >
                取消
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCostModal('pending')}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  僅儲存成本 (待採購)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCostModal('purchased')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>儲存並標記為已購入</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
