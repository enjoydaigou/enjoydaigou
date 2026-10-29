import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Currency, Order, OrderItem, SystemSettings, CatalogProduct, CatalogSubItem } from '../../types';
import { formatCurrencyAmount, formatTwd, generateCustomerQuoteCopy } from '../../utils/format';
import { ProductImage } from '../common/ProductImage';
import {
  Calculator,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  User,
  ShoppingBag,
  Tags,
  Search,
  X,
  Store,
  ArrowRight,
  Layers,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface QuotingViewProps {
  customers: Customer[];
  settings: SystemSettings;
  catalog: CatalogProduct[];
  preselectedProduct?: CatalogProduct | null;
  preselectedItems?: OrderItem[] | null;
  onClearPreselectedProduct?: () => void;
  onClearPreselectedItems?: () => void;
  onSaveOrder: (newOrder: Order, newCustomer?: Customer) => void;
  onNavigateToOrders: () => void;
}

export const QuotingView: React.FC<QuotingViewProps> = ({
  customers,
  settings,
  catalog,
  preselectedProduct,
  preselectedItems,
  onClearPreselectedProduct,
  onClearPreselectedItems,
  onSaveOrder,
  onNavigateToOrders,
}) => {
  // Active currencies configured in settings
  const activeCurrencies: { currency: Currency; name: string; symbol: string; flag: string; quoteRate: number }[] = useMemo(() => {
    if (settings.customCountries && settings.customCountries.length > 0) {
      return settings.customCountries
        .filter((c) => c.isActive !== false)
        .map((c) => ({
          currency: c.currency,
          name: c.name,
          symbol: c.symbol || '¥',
          flag: c.flag || '🌍',
          quoteRate: c.quoteRate,
        }));
    }
    return [
      { currency: 'JPY', name: '日本專線', symbol: '¥', flag: '🇯🇵', quoteRate: 0.228 },
      { currency: 'KRW', name: '韓國東大門', symbol: '₩', flag: '🇰🇷', quoteRate: 0.0265 },
      { currency: 'CNY', name: '中國專櫃/旗艦店', symbol: '¥', flag: '🇨🇳', quoteRate: 4.85 },
    ];
  }, [settings.customCountries]);

  // Current active country
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    return activeCurrencies[0]?.currency || 'JPY';
  });

  // Customer selection state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustCode, setNewCustCode] = useState(() => `CUST-${String(customers.length + 1).padStart(3, '0')}`);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLine, setNewCustLine] = useState('');
  const [newCustDelivery, setNewCustDelivery] = useState('7-11 賣貨便寄件');

  // Items currently being quoted
  const rateConfig = settings.exchangeRates[selectedCurrency] || settings.exchangeRates.JPY;

  const [items, setItems] = useState<OrderItem[]>([
    {
      id: 'quote-item-1',
      name: '日本藍瓶咖啡 經典原豆 200g',
      category: '食品咖啡',
      country: 'JPY',
      sourceStore: 'Blue Bottle Coffee 清澄白河店',
      originalPrice: 1980,
      exchangeRate: rateConfig.quoteRate,
      serviceFeeTwd: rateConfig.minServiceFeeTwd,
      estWeightKg: 0.3,
      quantity: 2,
      unitPriceTwd: Math.round(1980 * rateConfig.quoteRate + rateConfig.minServiceFeeTwd),
      subtotalTwd: Math.round((1980 * rateConfig.quoteRate + rateConfig.minServiceFeeTwd) * 2),
      spec: '200g 熟豆',
      purchaseStatus: 'pending',
    },
  ]);

  // Catalog picker modal state
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCountry, setPickerCountry] = useState<string>('all');
  const [recentlyAddedSubId, setRecentlyAddedSubId] = useState<string | null>(null);

  // Edit item photo modal
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');

  // Handle preselected items from CatalogView (multi-subitem quick order)
  useEffect(() => {
    if (preselectedItems && preselectedItems.length > 0) {
      setSelectedCurrency(preselectedItems[0].country);
      setItems(preselectedItems);
      if (onClearPreselectedItems) onClearPreselectedItems();
    }
  }, [preselectedItems]);

  // Handle preselected single product from CatalogView (backward compatible)
  useEffect(() => {
    if (preselectedProduct) {
      setSelectedCurrency(preselectedProduct.country);
      const conf = settings.exchangeRates[preselectedProduct.country] || settings.exchangeRates.JPY;
      const rate = conf.quoteRate;

      const sub = preselectedProduct.subItems?.[0];
      const fee = sub?.serviceFeeTwd || preselectedProduct.serviceFeeTwd || conf.minServiceFeeTwd;
      const orig = sub?.originalPrice || preselectedProduct.originalPrice || 1000;
      const unit = Math.round(orig * rate + fee);

      const newItem: OrderItem = {
        id: `quote-item-${Date.now()}`,
        name: sub ? `${preselectedProduct.name} - ${sub.name}` : preselectedProduct.name,
        category: preselectedProduct.category,
        country: preselectedProduct.country,
        sourceStore: preselectedProduct.sourceStore,
        originalPrice: orig,
        exchangeRate: rate,
        serviceFeeTwd: fee,
        estWeightKg: sub?.estWeightKg || preselectedProduct.estWeightKg || 0.3,
        quantity: 1,
        unitPriceTwd: unit,
        subtotalTwd: unit,
        spec: sub?.specOptions?.[0],
        purchaseStatus: 'pending',
        imageUrl: sub?.imageUrl || preselectedProduct.imageUrl,
      };

      setItems([newItem]);
      if (onClearPreselectedProduct) onClearPreselectedProduct();
    }
  }, [preselectedProduct]);

  // Deposit ratio (1.0 = 100% full deposit, 0.5 = 50% deposit)
  const [depositRatio, setDepositRatio] = useState<number>(1.0);
  const [customerNotes, setCustomerNotes] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Recalculate item when inputs change
  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'country') {
        const newConf = settings.exchangeRates[value as Currency] || settings.exchangeRates.JPY;
        target.exchangeRate = newConf.quoteRate;
      }

      if (field === 'unitPriceTwd') {
        const unit = Number(value) || 0;
        target.unitPriceTwd = unit;
        target.subtotalTwd = unit * (target.quantity || 1);
      } else if (field === 'quantity') {
        const qty = Number(value) || 1;
        target.quantity = qty;
        target.subtotalTwd = (target.unitPriceTwd || 0) * qty;
      }

      updated[index] = target;
      return updated;
    });
  };

  // Optional calculation helper to auto-calculate price from original currency if requested
  const handleItemCalcFromOriginal = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const orig = Number(target.originalPrice) || 0;
      const rate = Number(target.exchangeRate) || rateConfig.quoteRate || 1;
      const fee = Number(target.serviceFeeTwd) || rateConfig.minServiceFeeTwd || 120;
      const calculated = Math.round(orig * rate + fee);
      if (calculated > 0) {
        target.unitPriceTwd = calculated;
        target.subtotalTwd = calculated * (target.quantity || 1);
      }
      updated[index] = target;
      return updated;
    });
  };

  const handleAddItem = () => {
    const newConf = settings.exchangeRates[selectedCurrency];
    const newItem: OrderItem = {
      id: `quote-item-${Date.now()}`,
      name: '',
      category: '精品雜貨',
      country: selectedCurrency,
      originalPrice: 1500, // 備註原幣 (選填)
      exchangeRate: newConf.quoteRate,
      serviceFeeTwd: newConf.minServiceFeeTwd,
      estWeightKg: 0.3,
      quantity: 1,
      unitPriceTwd: 490,   // 直接確認售價 (NT$)
      subtotalTwd: 490,
      isSecondStageFreight: false, // 預設一口價免二補 (通常直接上確認的價格)
      purchaseStatus: 'pending',
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Add individual subitem from catalog (with direct confirmed price and freight status)
  const handlePickSubItemFromCatalog = (
    prod: CatalogProduct,
    sub: CatalogSubItem,
    chosenSpec?: string
  ) => {
    const rate = settings.exchangeRates[prod.country]?.quoteRate || 1;
    // Direct confirmed price!
    const unit = Number(sub.suggestedPriceTwd) || 490;

    const displayName =
      prod.name === sub.name ? sub.name : `${prod.name} - ${sub.name}`;

    const newItem: OrderItem = {
      id: `quote-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: displayName,
      category: prod.category,
      country: prod.country,
      sourceStore: prod.sourceStore,
      originalPrice: sub.originalPrice,
      exchangeRate: rate,
      serviceFeeTwd: sub.serviceFeeTwd || 0,
      estWeightKg: sub.estWeightKg || 0.2,
      quantity: 1,
      unitPriceTwd: unit,
      subtotalTwd: unit,
      isSecondStageFreight: !!sub.isSecondStageFreight,
      spec: chosenSpec || sub.specOptions?.[0],
      purchaseStatus: 'pending',
      imageUrl: sub.imageUrl || prod.imageUrl,
    };

    setItems((prev) => {
      // If first item was empty placeholder, replace it; otherwise append
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [newItem];
      }
      return [...prev, newItem];
    });

    setRecentlyAddedSubId(sub.id);
    setTimeout(() => setRecentlyAddedSubId(null), 1500);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadItemImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleItemChange(index, 'imageUrl', result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Totals
  const itemsTotalTwd = items.reduce((sum, it) => sum + it.subtotalTwd, 0);
  const totalEstWeight = items.reduce((sum, it) => sum + (it.estWeightKg || 0) * it.quantity, 0);
  const estAirFreight = Math.round(totalEstWeight * (rateConfig.airFreightPerKg || 240));
  const depositRequiredTwd = Math.round(itemsTotalTwd * depositRatio);
  const estimatedProfitTwd = items.reduce((sum, it) => {
    const feeProfit = (it.serviceFeeTwd || 0) * it.quantity;
    const baseRate = settings.exchangeRates[it.country]?.baseRate || it.exchangeRate || 1;
    const rateDiff = (it.exchangeRate || baseRate) - baseRate;
    const bufferProfit = rateDiff * (it.originalPrice || 0) * it.quantity;
    const defaultProfit = Math.round(it.unitPriceTwd * 0.15 * it.quantity);
    const calculated = feeProfit + Math.max(bufferProfit, 0);
    return sum + (calculated > 0 ? calculated : defaultProfit);
  }, 0);

  // Selected customer info
  const activeCustomer: { customerCode?: string; name: string; phone: string; lineId?: string; delivery: any } = isNewCustomer
    ? {
        customerCode: newCustCode,
        name: newCustName || '新顧客 (未命名)',
        phone: newCustPhone || '0900-000-000',
        lineId: newCustLine || '',
        delivery: newCustDelivery,
      }
    : customers.find((c) => c.id === selectedCustomerId) || {
        customerCode: '',
        name: '未指定客戶',
        phone: '',
        lineId: '',
        delivery: '超商取貨',
      };

  const draftOrder: Order = {
    id: `draft-${Date.now()}`,
    orderNo: `ORD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
      Math.random() * 90 + 10
    )}`,
    customerId: isNewCustomer ? `cust-new-${Date.now()}` : selectedCustomerId,
    customerCode: activeCustomer.customerCode,
    customerName: activeCustomer.name,
    customerPhone: activeCustomer.phone,
    country: selectedCurrency,
    items,
    status: 'pending_deposit',
    createdAt: new Date().toISOString(),
    itemsTotalTwd,
    depositRatio,
    depositRequiredTwd,
    depositPaidTwd: 0,
    depositPaymentStatus: 'unpaid',
    actualAirFreightTwd: 0,
    domesticFreightTwd: 60,
    tariffTwd: 0,
    discountTwd: 0,
    balanceRequiredTwd: 0,
    balancePaidTwd: 0,
    balancePaymentStatus: 'unpaid',
    totalRevenueTwd: itemsTotalTwd + 60,
    estimatedProfitTwd: Math.round(estimatedProfitTwd),
    deliveryMethod:
      typeof activeCustomer.delivery === 'string'
        ? activeCustomer.delivery
        : activeCustomer.delivery?.type === 'home'
        ? '宅配到府'
        : `${activeCustomer.delivery?.type || '7-11'} 取件 (${activeCustomer.delivery?.storeName || ''})`,
    customerNotes,
  };

  const handleCopyQuote = () => {
    const quoteText = generateCustomerQuoteCopy(draftOrder, settings);
    navigator.clipboard.writeText(quoteText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleCreateOrder = () => {
    if (items.some((i) => !i.name.trim())) {
      alert('請為所有商品填寫商品名稱');
      return;
    }

    let createdCust: Customer | undefined;
    if (isNewCustomer) {
      if (!newCustName.trim()) {
        alert('請填寫新顧客姓名');
        return;
      }
      createdCust = {
        id: draftOrder.customerId,
        customerCode: newCustCode.trim() || `CUST-${String(customers.length + 1).padStart(3, '0')}`,
        name: newCustName.trim(),
        lineId: newCustLine.trim() || newCustName.trim(),
        phone: newCustPhone.trim() || '0900-000-000',
        password: 'password123',
        delivery: {
          type: '7-11',
          address: newCustDelivery,
        },
        tag: '新客',
        totalSpentTwd: 0,
        ordersCount: 1,
        createdAt: new Date().toISOString(),
      };
    }

    onSaveOrder(draftOrder, createdCust);
    alert(`代購委託單 ${draftOrder.orderNo} 建立成功！狀態為「待付訂金」。`);
    onNavigateToOrders();
  };

  // Filter products for catalog picker
  const filteredPickerCatalog = catalog.filter((p) => {
    if (pickerCountry !== 'all' && p.country !== pickerCountry) return false;
    if (!pickerSearch.trim()) return true;
    const q = pickerSearch.toLowerCase();
    const matchParent =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.sourceStore.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    const matchSub = p.subItems?.some(
      (sub) =>
        sub.name.toLowerCase().includes(q) ||
        sub.specOptions?.some((sp) => sp.toLowerCase().includes(q))
    );
    return matchParent || matchSub;
  });

  return (
    <div className="space-y-6">
      {/* Country Selector Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">採購目標國家與幣別</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              選擇市場後將自動套用對應的代購換算匯率與國際空運費率
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeCurrencies.map((c) => {
              const cur = c.currency;
              const conf = settings.exchangeRates[cur] || {
                currency: cur,
                name: c.name,
                symbol: c.symbol,
                baseRate: 1,
                quoteRate: c.quoteRate,
                airFreightPerKg: 120,
                serviceFeePercent: 8,
                minServiceFeeTwd: 100,
              };
              const isSelected = selectedCurrency === cur;
              return (
                <button
                  key={cur}
                  onClick={() => {
                    setSelectedCurrency(cur);
                    setItems((prev) =>
                      prev.map((it) => {
                        const newRate = conf.quoteRate;
                        const fee = conf.minServiceFeeTwd;
                        const unit = it.originalPrice
                          ? Math.round(it.originalPrice * newRate + fee)
                          : it.unitPriceTwd;
                        return {
                          ...it,
                          country: cur,
                          exchangeRate: newRate,
                          serviceFeeTwd: fee,
                          unitPriceTwd: unit,
                          subtotalTwd: unit * it.quantity,
                        };
                      })
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span className="font-mono font-bold">{c.symbol}</span>
                  <span>{c.name}</span>
                  <span className="opacity-80 font-mono text-[11px]">({conf.quoteRate})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Item Details & Pricing Formula */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">委託代購商品清單</h3>
                <span className="text-xs text-slate-500 font-mono">({items.length} 項)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCatalogPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>⚡ 從商品庫選取品項 (娃娃/吊飾...)</span>
                </button>

                <button
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>手動新增品項</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>商品品項 #{idx + 1}</span>
                    </span>
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 移除品項
                      </button>
                    )}
                  </div>

                  {/* Row 1: Name, Spec, and Source Store */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Item Image with upload */}
                    <div className="sm:col-span-1">
                      <div className="relative group w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0">
                        <ProductImage
                          src={item.imageUrl}
                          alt={item.name || '商品'}
                          category={item.category}
                          country={item.country}
                          className="w-full h-full"
                        />
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[10px]">
                          <span>換圖</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadItemImage(idx, e)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        商品品項名稱 *
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        placeholder="例：吉卜力 龍貓 30cm 大毛絨玩偶娃娃"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        規格/款式色號
                      </label>
                      <input
                        type="text"
                        value={item.spec || ''}
                        onChange={(e) => handleItemChange(idx, 'spec', e.target.value)}
                        placeholder="例：灰大龍貓 / 貓巴士吊飾"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        來源門市 / 專櫃
                      </label>
                      <input
                        type="text"
                        value={item.sourceStore || ''}
                        onChange={(e) => handleItemChange(idx, 'sourceStore', e.target.value)}
                        placeholder="例：橡子共和國 晴空塔店"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Row 2: Direct Confirmed Price, Quantity, Freight Mode, and Optional Currency Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-start">
                    {/* Confirmed Unit Price NT$ (Primary) */}
                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                          <span>確認單價 (NT$) *</span>
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-normal">直接確認價格</span>
                        </label>
                        {item.originalPrice ? (
                          <button
                            type="button"
                            onClick={() => handleItemCalcFromOriginal(idx)}
                            title="依原幣匯率速算填入"
                            className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>依原幣換算</span>
                          </button>
                        ) : null}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-bold text-blue-600">NT$</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPriceTwd || ''}
                          onChange={(e) =>
                            handleItemChange(idx, 'unitPriceTwd', parseFloat(e.target.value) || 0)
                          }
                          placeholder="490"
                          className="w-full pl-9 pr-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-950 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        委託數量 (件) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Optional Foreign Currency Note */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        備註原幣 ({rateConfig.symbol}，選填)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.originalPrice !== undefined ? item.originalPrice : ''}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'originalPrice',
                            e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="例：1500 (選填)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Freight Mode Toggle (一口價 vs 需二補) */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        運費補款模式
                      </label>
                      <div className="grid grid-cols-2 gap-1 bg-white p-0.5 border border-slate-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleItemChange(idx, 'isSecondStageFreight', false)}
                          className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            !item.isSecondStageFreight
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          一口價免二補
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemChange(idx, 'isSecondStageFreight', true)}
                          className={`py-1 px-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                            item.isSecondStageFreight
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          需二補空運
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calculated summary bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.isSecondStageFreight
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.isSecondStageFreight ? '⚠️ 抵台需二補空運費' : '✅ 一口價免二補 (全款含運)'}
                      </span>
                      {item.originalPrice ? (
                        <span className="text-slate-500 text-[11px]">
                          備註原幣：{rateConfig.symbol}{item.originalPrice}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-xs">
                        單價 {formatTwd(item.unitPriceTwd)} × {item.quantity} 件 =
                      </span>
                      <span className="font-bold text-sm text-blue-700 font-mono tabular-nums">
                        小計 {formatTwd(item.subtotalTwd)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Selection Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">委託客戶資訊</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
              >
                {isNewCustomer ? '← 從現有常客名單選取' : '＋ 不是常客？手動快速建檔'}
              </button>
            </div>

            {isNewCustomer ? (
              <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <span>👤 登記全新顧客資料</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.2 rounded font-normal">
                      成立訂單後自動建檔
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(false)}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    取消，改選現有常客
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      客戶編號 *
                    </label>
                    <input
                      type="text"
                      value={newCustCode}
                      onChange={(e) => setNewCustCode(e.target.value)}
                      placeholder="例：CUST-015"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono bg-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      客戶姓名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="例：林筱婷"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      聯絡手機號碼 *
                    </label>
                    <input
                      type="tel"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="例：0988-654-321"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-blue-700 flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span>提示：送出委託單後，系統將自動將此顧客建檔至「客戶管理」資料庫，往後即可直接秒選！</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      選擇委託客戶（顯示客戶編號與姓名）
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsNewCustomer(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      ＋ 不是常客？點此新增
                    </button>
                  </div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsNewCustomer(true);
                      } else {
                        setSelectedCustomerId(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white font-medium"
                  >
                    <option value="__NEW__">➕ 【不是常客？點此手動快速建檔...】</option>
                    <optgroup label="現有常客名單 (依客戶編號)">
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{c.customerCode || '會員'}] {c.name} ({c.phone || '無電話'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    客戶檔案摘要
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1 truncate">
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                        {activeCustomer.customerCode || '會員'}
                      </span>
                      <span>{activeCustomer.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">
                      {activeCustomer.phone || '尚未填寫電話'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700 mb-1">顧客特別備註需求</label>
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="例如：需留專櫃紙袋、若特定色號缺貨可換其他顏色..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pricing Summary, Deposit Slider & Copy Generator */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">兩階段款項試算</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>商品小計合計</span>
                <span className="font-mono font-medium text-slate-900 text-sm">{formatTwd(itemsTotalTwd)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>預估空運包裹重</span>
                <span className="font-mono">{totalEstWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>預估抵台空運費</span>
                <span className="font-mono">約 {formatTwd(estAirFreight)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600">
                <span>預估代購毛利潤</span>
                <span className="font-mono font-medium">+{formatTwd(estimatedProfitTwd)}</span>
              </div>

              {/* Deposit Ratio */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">一階段訂金收取模式</span>
                  <span className="font-mono font-bold text-blue-600">
                    {depositRatio === 1 ? '100% 全額訂金' : `${Math.round(depositRatio * 100)}% 訂金`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositRatio(1.0)}
                    className={`py-1.5 rounded text-xs font-medium cursor-pointer ${
                      depositRatio === 1.0
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    100% 全額付款
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositRatio(0.5)}
                    className={`py-1.5 rounded text-xs font-medium cursor-pointer ${
                      depositRatio === 0.5
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    50% 採購訂金
                  </button>
                </div>
              </div>

              {/* Deposit Required Big Box */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="text-[11px] text-blue-700 font-medium">第一階段：顧客應付訂金</div>
                <div className="text-xl font-bold font-mono text-blue-900">
                  {formatTwd(depositRequiredTwd)}
                </div>
                <div className="text-[10px] text-blue-600">
                  {depositRatio === 1.0
                    ? '全額收取，抵台後僅需結清實秤空運與國內超取運費'
                    : `先收 50% 訂金即赴當地採購，抵台後付尾款 ${formatTwd(itemsTotalTwd - depositRequiredTwd)} 與運費`}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleCopyQuote}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {copiedNotification ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>已複製報價確認單！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>複製 LINE 報價確認單 (含帳號)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCreateOrder}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" /> 確認建立正式代購委託單
              </button>
            </div>
          </div>

          {/* Quotation Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              LINE 顧客即時預覽
            </span>
            <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-white p-3 rounded-lg border border-slate-200/70">
              {generateCustomerQuoteCopy(draftOrder, settings)}
            </pre>
          </div>
        </div>
      </div>

      {/* Catalog Quick Picker Modal (With Multi-SubItem Support) */}
      {isCatalogPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    從商品庫選入代購品項 (娃娃/吊飾/包袋...)
                  </h3>
                  <p className="text-xs text-slate-500">
                    點擊任何品項旁的「＋加入」，立即帶入目前開單清單中！
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 font-medium">國別：</span>
                {['all', ...activeCurrencies.map((c) => c.currency)].map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setPickerCountry(cur)}
                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      pickerCountry === cur
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cur === 'all' ? '全部' : cur}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="搜尋系列、品項（娃娃/吊飾）、店家..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Products List with SubItems */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredPickerCatalog.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  查無符合商品，請先至「商品庫」建檔或清除搜尋關鍵字
                </div>
              ) : (
                filteredPickerCatalog.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white space-y-2.5 shadow-2xs"
                  >
                    {/* Parent Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                          <ProductImage
                            src={prod.imageUrl}
                            alt={prod.name}
                            category={prod.category}
                            country={prod.country}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800">
                              {prod.country}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {prod.name}
                            </h4>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {prod.sourceStore} · {prod.category} · 包含 {prod.subItems.length} 個品項
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SubItems Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
                      {prod.subItems.map((sub) => {
                        const isJustAdded = recentlyAddedSubId === sub.id;

                        return (
                          <div
                            key={sub.id}
                            className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-blue-50/30 hover:border-blue-300 transition-all flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0 mt-0.5">
                                <ProductImage
                                  src={sub.imageUrl || prod.imageUrl}
                                  alt={sub.name}
                                  category={prod.category}
                                  country={prod.country}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {sub.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {sub.isSecondStageFreight ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                      需二補空運
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                      一口價免二補
                                    </span>
                                  )}
                                  {sub.originalPrice ? (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {formatCurrencyAmount(sub.originalPrice, prod.country)}
                                    </span>
                                  ) : null}
                                </div>
                                {sub.specOptions && sub.specOptions.length > 0 && (
                                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                    規格：{sub.specOptions.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Separated Row for Price & Add Button */}
                            <div className="mt-0.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">建議售價</span>
                                <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                                  {formatTwd(sub.suggestedPriceTwd)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handlePickSubItemFromCatalog(prod, sub)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs ${
                                  isJustAdded
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isJustAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>已加入</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>加入品項</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                目前開單清單已有 <span className="font-bold text-slate-900">{items.length}</span> 項商品
              </span>
              <button
                onClick={() => setIsCatalogPickerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                完成選購並返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
