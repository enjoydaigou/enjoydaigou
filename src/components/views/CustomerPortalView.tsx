import React, { useState } from 'react';
import {
  CatalogProduct,
  CatalogSubItem,
  Customer,
  Order,
  OrderItem,
  PaymentRecord,
  SystemSettings,
  CartItem,
  Currency,
} from '../../types';
import { formatTwd, formatCurrencyAmount, formatDateTime } from '../../utils/format';
import { ProductImage } from '../common/ProductImage';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  CheckCircle,
  Clock,
  Plane,
  Truck,
  Package,
  CreditCard,
  Building2,
  Copy,
  Check,
  ChevronRight,
  X,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  Phone,
  MessageCircle,
  FileText,
  AlertTriangle,
  Send,
  User,
  ShieldCheck,
} from 'lucide-react';

interface CustomerPortalViewProps {
  catalog: CatalogProduct[];
  orders: Order[];
  settings: SystemSettings;
  customers: Customer[];
  currentCustomer: Customer | null;
  onSaveOrder: (newOrder: Order, newCustomer?: Customer) => void;
  onSubmitPayment: (payment: Omit<PaymentRecord, 'id' | 'paymentNo' | 'createdAt'>) => void;
  onSwitchToLogin: () => void;
  onSwitchToAdmin: () => void;
  onLogoutCustomer: () => void;
}

type CustomerSubTab = 'shop' | 'orders' | 'pay';

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  catalog,
  orders,
  settings,
  customers,
  currentCustomer,
  onSaveOrder,
  onSubmitPayment,
  onSwitchToLogin,
  onSwitchToAdmin,
  onLogoutCustomer,
}) => {
  const [subTab, setSubTab] = useState<CustomerSubTab>('shop');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  // Customer search identity for tracking orders
  const [trackIdentity, setTrackIdentity] = useState<string>(
    currentCustomer?.lineId || currentCustomer?.phone || ''
  );

  // Cart Form fields
  const [checkoutLineId, setCheckoutLineId] = useState(currentCustomer?.lineId || '');
  const [checkoutName, setCheckoutName] = useState(currentCustomer?.name || '');
  const [checkoutPhone, setCheckoutPhone] = useState(currentCustomer?.phone || '');
  const [checkoutDeliveryType, setCheckoutDeliveryType] = useState<'7-11' | 'family' | 'home'>(
    currentCustomer?.delivery.type || '7-11'
  );
  const [checkoutStoreCode, setCheckoutStoreCode] = useState(
    currentCustomer?.delivery.storeCode || ''
  );
  const [checkoutStoreName, setCheckoutStoreName] = useState(
    currentCustomer?.delivery.storeName || ''
  );
  const [checkoutAddress, setCheckoutAddress] = useState(
    currentCustomer?.delivery.address || ''
  );
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [orderSuccessModal, setOrderSuccessModal] = useState<Order | null>(null);

  // Remittance form fields
  const [selectedOrdersForPay, setSelectedOrdersForPay] = useState<string[]>([]);
  const [payBankName, setPayBankName] = useState('玉山銀行');
  const [payBankLast5, setPayBankLast5] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');
  const [paySuccessMsg, setPaySuccessMsg] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Filter products for customer view
  const activeProducts = catalog.filter((p) => {
    if (p.status === 'discontinued') return false;
    if (selectedCountry !== 'all' && p.country !== selectedCountry) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchStore = p.sourceStore.toLowerCase().includes(q);
      const matchSub = p.subItems?.some((s) => s.name.toLowerCase().includes(q));
      if (!matchName && !matchStore && !matchSub) return false;
    }
    return true;
  });

  // Customer orders based on logged in customer or trackIdentity
  const lookupKey = (currentCustomer?.lineId || trackIdentity).trim().toLowerCase();
  const customerOrders = orders.filter((o) => {
    if (!lookupKey) return false;
    return (
      o.customerPhone.toLowerCase().includes(lookupKey) ||
      o.customerName.toLowerCase().includes(lookupKey) ||
      (currentCustomer && o.customerId === currentCustomer.id)
    );
  });

  // Add subitem to cart
  const handleAddToCart = (product: CatalogProduct, subItem: CatalogSubItem) => {
    const defaultSpec = subItem.specOptions?.[0] || '';
    const existingIndex = cart.findIndex(
      (c) => c.productId === product.id && c.subItemId === subItem.id && c.spec === defaultSpec
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        subItemId: subItem.id,
        productName: product.name,
        subItemName: subItem.name,
        country: product.country,
        spec: defaultSpec,
        unitPriceTwd: subItem.suggestedPriceTwd,
        originalPrice: subItem.originalPrice,
        isSecondStageFreight: subItem.isSecondStageFreight,
        quantity: 1,
        imageUrl: subItem.imageUrl || product.imageUrl,
        sourceStore: product.sourceStore,
      };
      setCart([...cart, newItem]);
    }
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCart(updated);
  };

  const handleRemoveFromCart = (index: number) => {
    const updated = cart.filter((_, idx) => idx !== index);
    setCart(updated);
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.unitPriceTwd * item.quantity, 0);
  const cartTotalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Order from Customer Cart
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('購物車是空的');
      return;
    }
    if (!checkoutLineId.trim() || !checkoutName.trim() || !checkoutPhone.trim()) {
      alert('請填寫完整訂購人資訊 (LINE ID、姓名、電話)');
      return;
    }

    const todayDate = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    const primaryCountry = cart[0]?.country || 'JPY';

    const orderItems: OrderItem[] = cart.map((c, idx) => ({
      id: `it-${Date.now()}-${idx}`,
      name: `${c.productName} - ${c.subItemName}`,
      category: '連線代購',
      country: c.country,
      sourceStore: c.sourceStore,
      imageUrl: c.imageUrl,
      spec: c.spec,
      originalPrice: c.originalPrice,
      quantity: c.quantity,
      unitPriceTwd: c.unitPriceTwd,
      subtotalTwd: c.unitPriceTwd * c.quantity,
      isSecondStageFreight: c.isSecondStageFreight,
      purchaseStatus: 'pending',
    }));

    // Find existing customer or register new customer
    let matchedCust = customers.find(
      (c) => c.lineId.toLowerCase() === checkoutLineId.trim().toLowerCase()
    );

    let customerToSave: Customer | undefined;
    if (!matchedCust) {
      matchedCust = {
        id: `cust-${Date.now()}`,
        name: checkoutName.trim(),
        lineId: checkoutLineId.trim(),
        phone: checkoutPhone.trim(),
        delivery: {
          type: checkoutDeliveryType,
          storeCode: checkoutStoreCode.trim(),
          storeName: checkoutStoreName.trim(),
          address: checkoutAddress.trim(),
        },
        tag: '新客',
        totalSpentTwd: 0,
        ordersCount: 1,
        createdAt: new Date().toISOString(),
      };
      customerToSave = matchedCust;
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNo: `TW-${primaryCountry}-${todayDate}-${randomSuffix}`,
      customerId: matchedCust.id,
      customerName: checkoutName.trim(),
      customerPhone: checkoutPhone.trim(),
      country: primaryCountry,
      items: orderItems,
      status: 'pending_deposit',
      createdAt: new Date().toISOString(),

      itemsTotalTwd: cartTotalAmount,
      depositRatio: 1.0, // Default 100% full payment for seamless proxy shopping
      depositRequiredTwd: cartTotalAmount,
      depositPaidTwd: 0,
      depositPaymentStatus: 'unpaid',

      actualAirFreightTwd: 0,
      domesticFreightTwd: checkoutDeliveryType === 'home' ? 100 : 60,
      tariffTwd: 0,
      discountTwd: 0,
      balanceRequiredTwd: checkoutDeliveryType === 'home' ? 100 : 60,
      balancePaidTwd: 0,
      balancePaymentStatus: 'unpaid',

      totalRevenueTwd: 0,
      estimatedProfitTwd: Math.round(cartTotalAmount * 0.15),

      deliveryMethod:
        checkoutDeliveryType === '7-11'
          ? `7-11超取 (${checkoutStoreName || checkoutStoreCode})`
          : checkoutDeliveryType === 'family'
          ? `全家超取 (${checkoutStoreName || checkoutStoreCode})`
          : `宅配到府 (${checkoutAddress})`,
      customerNotes: checkoutNotes.trim(),
    };

    onSaveOrder(newOrder, customerToSave);
    setCart([]);
    setIsCartOpen(false);
    setOrderSuccessModal(newOrder);

    // Auto set remittance default
    setSelectedOrdersForPay([newOrder.id]);
    setPayAmount(newOrder.depositRequiredTwd);
  };

  // Submit Remittance
  const handleRemittanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrdersForPay.length === 0) {
      alert('請至少選擇一張要回報匯款的訂單');
      return;
    }
    if (!payBankLast5.trim() || payBankLast5.trim().length < 5) {
      alert('請填寫轉帳帳號末五碼（至少5碼）');
      return;
    }
    if (payAmount <= 0) {
      alert('轉帳金額必須大於 0');
      return;
    }

    const firstOrder = orders.find((o) => o.id === selectedOrdersForPay[0]);
    if (!firstOrder) return;

    onSubmitPayment({
      orderId: firstOrder.id,
      orderNo: selectedOrdersForPay.length > 1
        ? `${firstOrder.orderNo} 等 ${selectedOrdersForPay.length} 筆合併`
        : firstOrder.orderNo,
      customerId: firstOrder.customerId,
      customerName: firstOrder.customerName,
      stage: 'deposit',
      amount: payAmount,
      bankName: payBankName,
      bankLast5: payBankLast5.trim(),
      transferTime: new Date().toLocaleString(),
      status: 'pending',
      notes: payNotes.trim()
        ? `顧客線上回報: ${payNotes.trim()}`
        : `顧客線上回報 (訂單: ${selectedOrdersForPay.join(', ')})`,
    });

    setPaySuccessMsg(true);
    setPayBankLast5('');
    setPayNotes('');
    setTimeout(() => {
      setPaySuccessMsg(false);
      setSubTab('orders');
    }, 2500);
  };

  const copyBankInfo = () => {
    const text = `${settings.receivingBank.bankCode} ${settings.receivingBank.bankName} 帳號: ${settings.receivingBank.accountNo} 戶名: ${settings.receivingBank.accountHolder}`;
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Customer Hero Banner (Inspired by Tama桑日韓代購) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Tama桑風格 · 日韓連線代購專區</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              開團、下單、對帳，一站搞定 ✨
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl">
              直接挑選開團商品、一口價免二次秤重催補運費！隨時用 LINE ID 查單與回報轉帳末五碼。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Customer identity badge */}
            {currentCustomer ? (
              <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-amber-200" />
                <div>
                  <span className="font-bold">{currentCustomer.name}</span>
                  <span className="text-white/70 ml-1">({currentCustomer.lineId})</span>
                </div>
                <button
                  type="button"
                  onClick={onLogoutCustomer}
                  className="ml-2 text-[10px] text-white/80 hover:text-white underline cursor-pointer"
                >
                  切換帳號
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>顧客登入 / LINE ID 登記</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2 bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md text-white font-bold text-xs rounded-xl border border-white/20 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>代購清單</span>
              {cartTotalQty > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center">
                  {cartTotalQty}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('shop')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'shop'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>開團連線選購</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'orders'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>我的訂單與出貨進度</span>
            {customerOrders.length > 0 && (
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full">
                {customerOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('pay')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'pay'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>線上回報匯款 (末五碼)</span>
          </button>
        </div>

        {/* Back-office Quick Link */}
        <button
          type="button"
          onClick={onSwitchToAdmin}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>切換至團主管理後台</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SHOP TAB: CAMPAIGNS & PRODUCTS */}
      {/* ========================================================================= */}
      {subTab === 'shop' && (
        <div className="space-y-5">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
              <span className="text-slate-500">連線國別：</span>
              {[
                { id: 'all', label: '全部商品' },
                { id: 'JPY', label: '🇯🇵 日本連線' },
                { id: 'KRW', label: '🇰🇷 韓國選品' },
                { id: 'USD', label: '🇺🇸 美國官網' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCountry(c.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    selectedCountry === c.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋連線商品、品項、品牌..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Product Cover Image */}
                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden group">
                  <ProductImage
                    src={prod.imageUrl}
                    alt={prod.name}
                    category={prod.category}
                    country={prod.country}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-2xs">
                      {prod.country === 'JPY'
                        ? '🇯🇵 日本'
                        : prod.country === 'KRW'
                        ? '🇰🇷 韓國'
                        : prod.country === 'USD'
                        ? '🇺🇸 美國'
                        : prod.country}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50/90 text-blue-700 backdrop-blur-md">
                      {prod.category}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[11px] truncate">
                    📍 採購來源：{prod.sourceStore}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                      {prod.name}
                    </h3>
                    {prod.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {prod.description}
                      </p>
                    )}
                  </div>

                  {/* Subitems Selection List */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      選購品項與規格：
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                      {prod.subItems?.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-2.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 truncate">
                              {sub.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-blue-600">
                                {formatTwd(sub.suggestedPriceTwd)}
                              </span>
                              {sub.originalPrice && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({formatCurrencyAmount(sub.originalPrice, prod.country)})
                                </span>
                              )}
                              {sub.isSecondStageFreight ? (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">
                                  需二補
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-semibold">
                                  一口價免二補
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod, sub)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>選購</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ORDERS TRACKING TAB: MY ORDERS */}
      {/* ========================================================================= */}
      {subTab === 'orders' && (
        <div className="space-y-5">
          {/* Track query input */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>查詢我的代購委託單與物流狀態</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="text"
                value={trackIdentity}
                onChange={(e) => setTrackIdentity(e.target.value)}
                placeholder="輸入你的 LINE ID 或手機電話..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors"
              >
                查詢訂單
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 提示：輸入您送出訂單時填寫的 LINE ID 或電話，即可查閱所有相關訂單進度。
            </p>
          </div>

          {/* Orders list */}
          {customerOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <div>
                <div className="font-bold text-slate-700 text-sm">查無您的委託訂單</div>
                <p className="text-xs text-slate-500 mt-1">
                  請確認您輸入的 LINE ID 或電話號碼是否與下單時相同，或前往「開團連線選購」挑選商品！
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('shop')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                前往挑選開團商品
              </button>
            </div>
          ) : (
            customerOrders.map((ord) => {
              const statusText =
                ord.status === 'pending_deposit'
                  ? '待付訂金'
                  : ord.status === 'purchasing'
                  ? '海外採購中'
                  : ord.status === 'shipped_overseas'
                  ? '國際轉運中'
                  : ord.status === 'arrived_tw' || ord.status === 'pending_balance'
                  ? '已抵台待秤重尾款'
                  : ord.status === 'fulfilled'
                  ? '已發貨完成'
                  : '已取消';

              const badgeColor =
                ord.status === 'fulfilled'
                  ? 'bg-emerald-100 text-emerald-800'
                  : ord.status === 'pending_deposit'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800';

              return (
                <div
                  key={ord.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {ord.orderNo}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        下單時間：{formatDateTime(ord.createdAt)} · 配送方式：{ord.deliveryMethod}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">訂單總金額</div>
                      <div className="text-base font-mono font-bold text-slate-900">
                        {formatTwd(ord.itemsTotalTwd)}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700">委託商品明細：</div>
                    <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3 text-xs space-y-2">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                          <div>
                            <span className="font-medium text-slate-900">{it.name}</span>
                            {it.spec && (
                              <span className="text-slate-500 ml-1.5">(規格: {it.spec})</span>
                            )}
                            {it.isSecondStageFreight ? (
                              <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                需二補運費
                              </span>
                            ) : (
                              <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                                一口價免二補
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-slate-700">
                            {formatTwd(it.unitPriceTwd)} × {it.quantity} 件 ={' '}
                            <span className="font-bold text-slate-900">
                              {formatTwd(it.subtotalTwd)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domestic tracking if available */}
                  {ord.domesticTrackingNo && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold">包裹已交寄出貨！</span>
                          <span className="ml-2 font-mono">追蹤單號: {ord.domesticTrackingNo}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-emerald-700">可至超商物流官網查詢配送進度</span>
                    </div>
                  )}

                  {/* Quick Remittance Button if unpaid */}
                  {ord.depositPaymentStatus !== 'paid' && (
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-xs text-amber-700">
                        ⚠️ 尚未完成匯款核銷（應付金額：{formatTwd(ord.depositRequiredTwd)}）
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrdersForPay([ord.id]);
                          setPayAmount(ord.depositRequiredTwd);
                          setSubTab('pay');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>立即回報此單末五碼</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REMITTANCE REPORTING: PAY TAB */}
      {/* ========================================================================= */}
      {subTab === 'pay' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Bank Receiving Info */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>團主匯款帳號資訊</span>
              </h3>
              <button
                type="button"
                onClick={copyBankInfo}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAccount ? '已複製帳號' : '複製帳號'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">收款銀行：</span>
                <span className="font-bold text-slate-900">
                  {settings.receivingBank.bankCode} {settings.receivingBank.bankName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">銀行帳號：</span>
                <span className="font-mono font-bold text-blue-600 text-sm select-all">
                  {settings.receivingBank.accountNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">戶名：</span>
                <span className="font-medium text-slate-800">
                  {settings.receivingBank.accountHolder}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>匯款回報提醒</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                轉帳完成後，請於右側表單填寫「您的轉帳帳號末五碼」與金額，團主後台核銷後訂單即正式成立！
              </p>
            </div>
          </div>

          {/* Right: Remittance Reporting Form */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                線上回報匯款（支援單筆或多筆合併付款）
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                填寫轉帳資訊後，系統會即時通知團主進行對帳核銷。
              </p>
            </div>

            {paySuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">匯款資料已成功送出！</div>
                  <div className="text-[11px] text-emerald-700">
                    團主正在查帳核銷中，核對無誤後將自動變更訂單狀態為「海外採購中」。
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleRemittanceSubmit} className="space-y-4">
              {/* Select Orders to Pay */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  選擇要回報的委託訂單：
                </label>
                {customerOrders.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                    請先於上方「我的訂單」輸入 LINE ID 查詢您的訂單。
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {customerOrders.map((ord) => {
                      const isSelected = selectedOrdersForPay.includes(ord.id);
                      return (
                        <div
                          key={ord.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedOrdersForPay(selectedOrdersForPay.filter((id) => id !== ord.id));
                            } else {
                              setSelectedOrdersForPay([...selectedOrdersForPay, ord.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded text-emerald-600"
                            />
                            <div>
                              <span className="font-mono font-bold text-slate-900">
                                {ord.orderNo}
                              </span>
                              <span className="text-slate-500 ml-2">
                                ({ord.items.length} 件商品)
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {formatTwd(ord.depositRequiredTwd)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Remittance Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    轉出銀行名稱
                  </label>
                  <input
                    type="text"
                    value={payBankName}
                    onChange={(e) => setPayBankName(e.target.value)}
                    placeholder="例：國泰世華、中信、郵局"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    匯款帳號末五碼 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={payBankLast5}
                    onChange={(e) => setPayBankLast5(e.target.value)}
                    placeholder="例如：58902"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  轉帳金額 (NT$) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">NT$</span>
                  <input
                    type="number"
                    min="1"
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    placeholder="1350"
                    required
                    className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  轉帳備註 / 截圖說明（選填）
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="例：下午3點使用網銀轉出"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>確認送出匯款末五碼回報</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHOPPING CART & CHECKOUT DRAWER */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  連線代購委託清單 ({cartTotalQty} 件)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">您的代購清單是空的</p>
                  <p className="text-[11px] text-slate-400 mt-1">快去開團列表挑選喜愛的商品吧！</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 text-xs"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.subItemName}
                        category="連線代購"
                        country={item.country}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {item.productName}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        {item.subItemName} {item.spec ? `· 款式: ${item.spec}` : ''}
                      </div>
                      <div className="font-mono font-bold text-blue-600 mt-0.5">
                        {formatTwd(item.unitPriceTwd)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 rounded-lg px-1.5 py-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(index, -1)}
                        className="p-0.5 text-slate-500 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(index, 1)}
                        className="p-0.5 text-slate-500 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {/* Checkout Form (Only if cart not empty) */}
              {cart.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>填寫訂購與超商取件資訊</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      LINE ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={checkoutLineId}
                      onChange={(e) => setCheckoutLineId(e.target.value)}
                      placeholder="例: jessica_lin88 (方便對帳與通知出貨)"
                      required
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        收件人姓名 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        placeholder="真實中文姓名"
                        required
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        手機號碼 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        placeholder="0912-345-678"
                        required
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      取件超商門市 / 配送方式
                    </label>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {[
                        { id: '7-11', label: '7-11 超取' },
                        { id: 'family', label: '全家 超取' },
                        { id: 'home', label: '黑貓 宅配' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCheckoutDeliveryType(t.id as any)}
                          className={`py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                            checkoutDeliveryType === t.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {checkoutDeliveryType !== 'home' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={checkoutStoreCode}
                          onChange={(e) => setCheckoutStoreCode(e.target.value)}
                          placeholder="超商門市代碼 (例: 991182)"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={checkoutStoreName}
                          onChange={(e) => setCheckoutStoreName(e.target.value)}
                          placeholder="超商門市名稱 (例: 信義威秀門市)"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={checkoutAddress}
                        onChange={(e) => setCheckoutAddress(e.target.value)}
                        placeholder="宅配收件地址 (含縣市區與門牌)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      顧客備註 / 許願備註（選填）
                    </label>
                    <input
                      type="text"
                      value={checkoutNotes}
                      onChange={(e) => setCheckoutNotes(e.target.value)}
                      placeholder="例：若缺貨請先通知更換顏色"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Summary & Submit */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">商品總計 ({cartTotalQty} 件)：</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {formatTwd(cartTotalAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>確認送出委託單（免先刷卡，結單後匯款）</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER SUCCESS MODAL */}
      {/* ========================================================================= */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                🎉 代購委託單已成功送出！
              </h3>
              <p className="font-mono text-xs font-bold text-blue-600">
                委託單號：{orderSuccessModal.orderNo}
              </p>
              <p className="text-xs text-slate-500">
                應付金額：{formatTwd(orderSuccessModal.depositRequiredTwd)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800">玉山銀行 (808)</div>
              <div className="font-mono text-blue-600 font-bold select-all">
                {settings.receivingBank.accountNo}
              </div>
              <div className="text-slate-500">戶名：{settings.receivingBank.accountHolder}</div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessModal(null);
                  setSubTab('pay');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                前往回報匯款末五碼
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessModal(null);
                  setSubTab('orders');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                查派出貨進度
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
