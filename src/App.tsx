import React, { useState, useEffect } from 'react';
import { Customer, Order, OrderItem, Currency, PaymentRecord, PaymentStage, SystemSettings, CatalogProduct, OrderStatus, StaffUser, WishRequest } from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredCustomers,
  saveStoredCustomers,
  getStoredOrders,
  saveStoredOrders,
  getStoredPayments,
  saveStoredPayments,
  getStoredCatalog,
  saveStoredCatalog,
  getStoredStaffUsers,
  getStoredCurrentAdmin,
  saveStoredCurrentAdmin,
  getStoredWishRequests,
  saveStoredWishRequests,
  exportBackupJSON,
} from './utils/storage';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/views/OverviewView';
import { CatalogView } from './components/views/CatalogView';
import { QuotingView } from './components/views/QuotingView';
import { OrdersView } from './components/views/OrdersView';
import { ProcurementView } from './components/views/ProcurementView';
import { ReconciliationView } from './components/views/ReconciliationView';
import { WishesView } from './components/views/WishesView';
import { CustomersView } from './components/views/CustomersView';
import { SettingsView } from './components/views/SettingsView';
import { StorefrontView } from './components/storefront/StorefrontView';
import { AdminLoginView } from './components/auth/AdminLoginView';
import { LayoutDashboard, ShoppingBag, Boxes, CreditCard, Menu } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'admin' | 'storefront'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'shop' || params.get('mode') === 'storefront') {
        return 'storefront';
      }
    }
    return 'admin';
  });

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [settings, setSettings] = useState<SystemSettings>(getStoredSettings());
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers());
  const [orders, setOrders] = useState<Order[]>(getStoredOrders());
  const [payments, setPayments] = useState<PaymentRecord[]>(getStoredPayments());
  const [catalog, setCatalog] = useState<CatalogProduct[]>(getStoredCatalog());
  const [wishRequests, setWishRequests] = useState<WishRequest[]>(getStoredWishRequests());
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(getStoredStaffUsers());
  const [currentAdmin, setCurrentAdmin] = useState<StaffUser | null>(getStoredCurrentAdmin());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reconcileFilterOrderNo, setReconcileFilterOrderNo] = useState<string>('');
  const [preselectedProduct, setPreselectedProduct] = useState<CatalogProduct | null>(null);
  const [preselectedItems, setPreselectedItems] = useState<OrderItem[] | null>(null);
  const [storageError, setStorageError] = useState<{ message: string; isQuota: boolean; timestamp?: string } | null>(null);

  // Listen for local storage write failures (e.g. QuotaExceededError)
  useEffect(() => {
    const handleStorageErr = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; isQuota: boolean; timestamp?: string }>;
      if (customEvent.detail) {
        setStorageError(customEvent.detail);
      }
    };
    window.addEventListener('globalproxy_storage_error', handleStorageErr);
    return () => {
      window.removeEventListener('globalproxy_storage_error', handleStorageErr);
    };
  }, []);

  // Reload data from storage
  const reloadAllData = () => {
    setSettings(getStoredSettings());
    setCustomers(getStoredCustomers());
    setOrders(getStoredOrders());
    setPayments(getStoredPayments());
    setCatalog(getStoredCatalog());
    setWishRequests(getStoredWishRequests());
    setStaffUsers(getStoredStaffUsers());
    setCurrentAdmin(getStoredCurrentAdmin());
  };

  // Badge counts
  const pendingReconcileCount = payments.filter((p) => p.status === 'pending').length;
  const pendingPurchaseCount = orders
    .filter(
      (o) =>
        o.status === 'purchasing' ||
        (o.status === 'pending_deposit' && o.depositPaymentStatus === 'paid')
    )
    .flatMap((o) => o.items)
    .filter((i) => i.purchaseStatus === 'pending')
    .reduce((sum, i) => sum + i.quantity, 0);
  const arrivedPendingBalanceCount = orders.filter(
    (o) => o.status === 'arrived_tw' || o.status === 'pending_balance'
  ).length;

  const pendingWishCount = wishRequests.filter((w) => w.status === 'pending').length;

  // Handlers for Catalog
  const handleSaveProduct = (product: CatalogProduct) => {
    const exists = catalog.some((p) => p.id === product.id);
    let updated: CatalogProduct[];
    if (exists) {
      updated = catalog.map((p) => (p.id === product.id ? product : p));
    } else {
      updated = [product, ...catalog];
    }
    setCatalog(updated);
    saveStoredCatalog(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = catalog.filter((p) => p.id !== productId);
    setCatalog(updated);
    saveStoredCatalog(updated);
  };

  const handleQuickOrderWithItems = (items: OrderItem[], country: Currency) => {
    setPreselectedItems(items);
    setActiveTab('quoting');
  };

  // Wish Requests Handlers
  const handleSaveWish = (newWish: WishRequest) => {
    const updated = [newWish, ...wishRequests];
    setWishRequests(updated);
    saveStoredWishRequests(updated);
  };

  const handleUpdateWish = (updatedWish: WishRequest) => {
    const updated = wishRequests.map((w) => (w.id === updatedWish.id ? updatedWish : w));
    setWishRequests(updated);
    saveStoredWishRequests(updated);
  };

  const handleConvertToQuoteFromWish = (wish: WishRequest, quotedPriceTwd: number) => {
    const item: OrderItem = {
      id: `item-wish-${Date.now()}`,
      name: wish.productName,
      category: '許願代購',
      country: wish.country,
      sourceStore: '專櫃/官網採購',
      originalPrice: 0,
      exchangeRate: 1,
      serviceFeeTwd: Math.round(quotedPriceTwd * 0.1),
      unitPriceTwd: quotedPriceTwd,
      quantity: 1,
      subtotalTwd: quotedPriceTwd,
      spec: wish.specNote,
      imageUrl: wish.imageUrl,
      purchaseStatus: 'pending',
    };
    setPreselectedItems([item]);
    setActiveTab('quoting');
  };

  const handleConvertToCatalogFromWish = (wish: WishRequest, priceTwd: number) => {
    const newProduct: CatalogProduct = {
      id: `prod-${Date.now()}`,
      name: wish.productName,
      sku: `WISH-${Math.floor(Math.random() * 8999 + 1000)}`,
      category: '許願熱銷',
      country: wish.country,
      sourceStore: '連線採購',
      suggestedPriceTwd: priceTwd,
      originalPrice: priceTwd,
      isSecondStageFreight: false,
      description: wish.specNote || '顧客許願熱銷商品',
      imageUrl: wish.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      status: 'active',
      subItems: [
        {
          id: `sub-${Date.now()}`,
          name: '標準規格',
          suggestedPriceTwd: priceTwd,
          originalPrice: priceTwd,
          stockQty: 0,
          isSecondStageFreight: false,
          imageUrl: wish.imageUrl,
          specOptions: ['預設色號/尺寸'],
        },
      ],
      createdAt: new Date().toISOString(),
    };
    handleSaveProduct(newProduct);
    setActiveTab('catalog');
  };

  // Handlers for Orders & Payments
  const handleSaveOrder = (newOrder: Order, newCustomer?: Customer) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);

    if (newCustomer) {
      const existingIndex = customers.findIndex(
        (c) => c.id === newCustomer.id || c.phone === newCustomer.phone
      );
      let updatedCustomers: Customer[];
      if (existingIndex >= 0) {
        updatedCustomers = [...customers];
        const existing = updatedCustomers[existingIndex];
        updatedCustomers[existingIndex] = {
          ...existing,
          ...newCustomer,
          password: newCustomer.password || existing.password || 'password123',
          ordersCount: existing.ordersCount + 1,
          totalSpentTwd: existing.totalSpentTwd + newOrder.itemsTotalTwd,
        };
      } else {
        updatedCustomers = [newCustomer, ...customers];
      }
      setCustomers(updatedCustomers);
      saveStoredCustomers(updatedCustomers);
    } else {
      const updatedCustomers = customers.map((c) =>
        c.id === newOrder.customerId
          ? {
              ...c,
              ordersCount: c.ordersCount + 1,
              totalSpentTwd: c.totalSpentTwd + newOrder.itemsTotalTwd,
            }
          : c
      );
      setCustomers(updatedCustomers);
      saveStoredCustomers(updatedCustomers);
    }
  };

  const handleUpdateOrder = (updated: Order) => {
    const updatedOrders = orders.map((o) => (o.id === updated.id ? updated : o));
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);
  };

  const handleVerifyPayment = (
    paymentId: string,
    orderId: string,
    stage: PaymentStage,
    amount: number
  ) => {
    const updatedPayments = payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            status: 'verified' as const,
            verifiedAt: new Date().toISOString(),
            verifier: '系統管理員',
          }
        : p
    );
    setPayments(updatedPayments);
    saveStoredPayments(updatedPayments);

    const updatedOrders = orders.map((ord) => {
      if (ord.id !== orderId) return ord;

      if (stage === 'deposit') {
        const newPaid = ord.depositPaidTwd + amount;
        return {
          ...ord,
          depositPaidTwd: newPaid,
          depositPaymentStatus: 'paid' as const,
          status: ord.status === 'pending_deposit' ? ('purchasing' as const) : ord.status,
        };
      } else {
        const newPaid = ord.balancePaidTwd + amount;
        return {
          ...ord,
          balancePaidTwd: newPaid,
          balancePaymentStatus: 'paid' as const,
        };
      }
    });
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);

    if (selectedOrder && selectedOrder.id === orderId) {
      const refreshed = updatedOrders.find((o) => o.id === orderId);
      if (refreshed) setSelectedOrder(refreshed);
    }
  };

  const handleRejectPayment = (paymentId: string, reason: string) => {
    const updatedPayments = payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            status: 'rejected' as const,
            notes: `駁回原因: ${reason}`,
          }
        : p
    );
    setPayments(updatedPayments);
    saveStoredPayments(updatedPayments);
  };

  const handleManualRecordPayment = (
    payload: Omit<PaymentRecord, 'id' | 'paymentNo' | 'createdAt'>
  ) => {
    const newRecord: PaymentRecord = {
      ...payload,
      id: `pay-${Date.now()}`,
      paymentNo: `PAY-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
        Math.random() * 90 + 10
      )}`,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [newRecord, ...payments];
    setPayments(updatedPayments);
    saveStoredPayments(updatedPayments);

    handleVerifyPayment(newRecord.id, payload.orderId, payload.stage, payload.amount);
  };

  const handleUpdateOrderItemStatus = (
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
  ) => {
    const updatedOrders = orders.map((o) => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          purchaseStatus: newStatus,
          actualPurchaseCostOriginal: actualCost ?? it.actualPurchaseCostOriginal,
          purchaseNote: note ?? it.purchaseNote,
          assignedPurchaserName: buyerDetails?.assignedPurchaserName ?? it.assignedPurchaserName,
          purchaserPricingType: buyerDetails?.purchaserPricingType ?? it.purchaserPricingType,
          purchaserCommissionTwd: buyerDetails?.purchaserCommissionTwd ?? it.purchaserCommissionTwd,
          actualPurchaseCostTwd: buyerDetails?.actualPurchaseCostTwd ?? it.actualPurchaseCostTwd,
        };
      });

      const allOutOfStock = updatedItems.length > 0 && updatedItems.every((it) => it.purchaseStatus === 'out_of_stock');
      if (allOutOfStock && newStatus === 'out_of_stock') {
        return {
          ...o,
          items: updatedItems,
          status: 'out_of_stock' as OrderStatus,
          isOutOfStock: true,
          outOfStockReason: note || '買手回報專櫃/官網已售罄斷貨',
          outOfStockNotifiedAt: new Date().toISOString(),
          refundStatus: o.depositPaidTwd > 0 ? ('pending_info' as const) : ('none' as const),
          refundAmountTwd: o.depositPaidTwd,
        };
      }

      return { ...o, items: updatedItems };
    });

    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);
  };

  const handleSaveCustomer = (customer: Customer) => {
    const exists = customers.some((c) => c.id === customer.id);
    let updated: Customer[];
    if (exists) {
      updated = customers.map((c) => (c.id === customer.id ? customer : c));
    } else {
      updated = [customer, ...customers];
    }
    setCustomers(updated);
    saveStoredCustomers(updated);
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleOpenReconciliationWithOrder = (orderNo: string) => {
    setReconcileFilterOrderNo(orderNo);
    setActiveTab('reconciliation');
  };

  // Handlers for Storefront Customer Orders
  const handleStorefrontPlaceOrder = (
    newOrder: Order,
    newCustomer: Customer,
    paymentReport?: { last5: string; amount: number; bankName: string }
  ) => {
    handleSaveOrder(newOrder, newCustomer);

    if (paymentReport) {
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        paymentNo: `PAY-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
          Math.random() * 90 + 10
        )}`,
        orderId: newOrder.id,
        orderNo: newOrder.orderNo,
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        stage: 'deposit',
        amount: paymentReport.amount,
        bankName: paymentReport.bankName,
        bankLast5: paymentReport.last5,
        transferTime: new Date().toISOString(),
        proofNote: '顧客於網站下單前台線上結帳時填寫回報',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      const updatedPayments = [newPayment, ...payments];
      setPayments(updatedPayments);
      saveStoredPayments(updatedPayments);
    }
  };

  const handleReportTransferLast5 = (orderNo: string, last5: string, amount: number) => {
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) return;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentNo: `PAY-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
        Math.random() * 90 + 10
      )}`,
      orderId: order.id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      stage: 'deposit',
      amount: amount,
      bankName: settings.receivingBank.bankName,
      bankLast5: last5,
      transferTime: new Date().toISOString(),
      proofNote: '顧客於網站前台訂單進度查詢頁回報',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    saveStoredPayments(updatedPayments);
  };

  const handleAdminLogin = (user: StaffUser) => {
    setCurrentAdmin(user);
    saveStoredCurrentAdmin(user);
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    saveStoredCurrentAdmin(null);
  };

  // Emergency Local Storage Error Notification Banner
  const storageAlertBanner = storageError ? (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-rose-700 text-white px-4 py-2.5 text-xs shadow-2xl flex flex-wrap items-center justify-between gap-3 border-b-2 border-rose-950 animate-slide-down">
      <div className="flex items-center gap-2">
        <span className="text-base animate-bounce">🚨</span>
        <div>
          <span className="font-bold text-rose-100 uppercase">【本機儲存異常警告】</span>
          <span className="text-white font-medium">{storageError.message}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          onClick={() => {
            const json = exportBackupJSON({
              settings,
              customers,
              orders,
              payments,
              catalog,
              staffUsers,
              wishRequests,
            });
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `emergency_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="bg-white text-rose-800 font-bold px-3 py-1 rounded shadow-xs hover:bg-rose-50 transition cursor-pointer"
        >
          立即下載 JSON 備份
        </button>
        <button
          onClick={() => setStorageError(null)}
          className="bg-rose-900/80 hover:bg-rose-900 text-rose-200 px-2 py-1 rounded cursor-pointer"
        >
          關閉提示
        </button>
      </div>
    </div>
  ) : null;

  // If currently in Storefront mode, render StorefrontView
  if (viewMode === 'storefront') {
    return (
      <>
        {storageAlertBanner}
        <StorefrontView
          catalog={catalog}
          settings={settings}
          orders={orders}
          customers={customers}
          currentAdmin={currentAdmin}
          wishRequests={wishRequests}
          onPlaceOrder={handleStorefrontPlaceOrder}
          onSaveCustomer={handleSaveCustomer}
          onSwitchToAdmin={() => setViewMode('admin')}
          onReportTransferLast5={handleReportTransferLast5}
          onUpdateOrder={handleUpdateOrder}
          onSaveWish={handleSaveWish}
        />
      </>
    );
  }

  // Admin access gate: require login if no active admin session
  if (!currentAdmin) {
    return (
      <>
        {storageAlertBanner}
        <AdminLoginView
          settings={settings}
          staffUsers={staffUsers}
          onLoginSuccess={handleAdminLogin}
          onReturnToStorefront={() => setViewMode('storefront')}
        />
      </>
    );
  }

  return (
    <>
      {storageAlertBanner}
      <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans antialiased relative">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'reconciliation') setReconcileFilterOrderNo('');
        }}
        pendingReconcileCount={pendingReconcileCount}
        pendingPurchaseCount={pendingPurchaseCount}
        arrivedPendingBalanceCount={arrivedPendingBalanceCount}
        pendingWishCount={pendingWishCount}
        onSwitchToStorefront={() => setViewMode('storefront')}
        shopName={settings.shopName}
        currentAdmin={currentAdmin}
        onLogoutAdmin={handleAdminLogout}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onNavigateToQuoting={() => setActiveTab('quoting')}
          onDataMutated={reloadAllData}
          onSwitchToStorefront={() => setViewMode('storefront')}
          shopName={settings.shopName}
          currentAdmin={currentAdmin}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogoutAdmin={handleAdminLogout}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewView
                orders={orders}
                payments={payments}
                customers={customers}
                settings={settings}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  if (tab !== 'reconciliation') setReconcileFilterOrderNo('');
                }}
                onSelectOrder={(ord) => setSelectedOrder(ord)}
              />
            )}

            {activeTab === 'catalog' && (
              <CatalogView
                catalog={catalog}
                settings={settings}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onQuickOrderWithItems={handleQuickOrderWithItems}
              />
            )}

            {activeTab === 'quoting' && (
              <QuotingView
                customers={customers}
                settings={settings}
                catalog={catalog}
                preselectedProduct={preselectedProduct}
                preselectedItems={preselectedItems}
                onClearPreselectedProduct={() => setPreselectedProduct(null)}
                onClearPreselectedItems={() => setPreselectedItems(null)}
                onSaveOrder={handleSaveOrder}
                onNavigateToOrders={() => setActiveTab('orders')}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                settings={settings}
                selectedOrder={selectedOrder}
                onSelectOrder={setSelectedOrder}
                onUpdateOrder={handleUpdateOrder}
                onOpenReconciliationWithOrder={handleOpenReconciliationWithOrder}
              />
            )}

            {activeTab === 'procurement' && (
              <ProcurementView
                orders={orders}
                settings={settings}
                onUpdateOrderItemStatus={handleUpdateOrderItemStatus}
              />
            )}

            {activeTab === 'reconciliation' && (
              <ReconciliationView
                orders={orders}
                payments={payments}
                settings={settings}
                onVerifyPayment={handleVerifyPayment}
                onRejectPayment={handleRejectPayment}
                onManualRecordPayment={handleManualRecordPayment}
                initialFilterOrderNo={reconcileFilterOrderNo}
              />
            )}

            {activeTab === 'wishes' && (
              <WishesView
                wishRequests={wishRequests}
                settings={settings}
                onUpdateWish={handleUpdateWish}
                onConvertToQuote={handleConvertToQuoteFromWish}
                onConvertToCatalog={handleConvertToCatalogFromWish}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                orders={orders}
                onSaveCustomer={handleSaveCustomer}
                onSelectOrder={(ord) => setSelectedOrder(ord)}
                onNavigateToOrders={() => setActiveTab('orders')}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onDataMutated={reloadAllData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'overview' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>儀表板</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'orders' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>訂單</span>
          {arrivedPendingBalanceCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-purple-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('procurement')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'procurement' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span>採購</span>
          {pendingPurchaseCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'reconciliation' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-5 h-5 mb-0.5" />
          <span>對帳</span>
          {pendingReconcileCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>更多功能</span>
        </button>
      </div>
    </div>
    </>
  );
}
