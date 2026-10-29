import React, { useState, useMemo, useEffect } from 'react';
import {
  CatalogProduct,
  CatalogSubItem,
  Currency,
  Customer,
  Order,
  OrderItem,
  PaymentRecord,
  SystemSettings,
  StaffUser,
  WishRequest,
} from '../../types';
import { formatCurrencyAmount, formatTwd, formatDateTime } from '../../utils/format';
import { ProductImage } from '../common/ProductImage';
import {
  Search,
  ShoppingCart,
  Package,
  Globe2,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  Image as ImageIcon,
  Trash2,
  CreditCard,
  MapPin,
  Phone,
  User,
  MessageCircle,
  Copy,
  Clock,
  Truck,
  Plane,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Key,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  FileText,
  Building2,
  LayoutGrid,
  Grid2X2,
  List,
  Camera,
  Upload,
  Home,
  HelpCircle,
  Edit3,
  BadgeCheck,
  History,
} from 'lucide-react';

export interface CartItem {
  id: string; // unique cart line id
  productId: string;
  productName: string;
  subItemId: string;
  subItemName: string;
  country: Currency;
  sourceStore: string;
  unitPriceTwd: number;
  originalPrice?: number;
  isSecondStageFreight?: boolean;
  spec?: string;
  quantity: number;
  imageUrl?: string;
}

interface StorefrontViewProps {
  catalog: CatalogProduct[];
  settings: SystemSettings;
  orders: Order[];
  customers?: Customer[];
  currentAdmin?: StaffUser | null;
  wishRequests?: WishRequest[];
  onPlaceOrder: (order: Order, customer: Customer, paymentReport?: { last5: string; amount: number; bankName: string }) => void;
  onSaveCustomer?: (customer: Customer) => void;
  onSwitchToAdmin: () => void;
  onReportTransferLast5?: (orderNo: string, last5: string, amount: number) => void;
  onUpdateOrder?: (order: Order) => void;
  onSaveWish?: (wish: WishRequest) => void;
}

const TAIWAN_BANKS: { code: string; name: string }[] = [
  { code: '013', name: '國泰世華商業銀行' },
  { code: '822', name: '中國信託商業銀行' },
  { code: '812', name: '台新國際商業銀行' },
  { code: '012', name: '台北富邦商業銀行' },
  { code: '700', name: '中華郵政 (郵局)' },
  { code: '808', name: '玉山商業銀行' },
  { code: '004', name: '臺灣銀行' },
  { code: '007', name: '第一商業銀行' },
  { code: '008', name: '華南商業銀行' },
  { code: '017', name: '兆豐國際商業銀行' },
  { code: '807', name: '永豐商業銀行' },
  { code: '824', name: '連線商業銀行 (LINE Bank)' },
  { code: 'other', name: '其他銀行 / 信用合作社 / 農會' },
];

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  catalog,
  settings,
  orders,
  customers = [],
  currentAdmin,
  wishRequests = [],
  onPlaceOrder,
  onSaveCustomer,
  onSwitchToAdmin,
  onReportTransferLast5,
  onUpdateOrder,
  onSaveWish,
}) => {
  // Dynamic Country Options from settings
  const countryOptions = useMemo(() => {
    const list: { id: string; label: string; flag: string }[] = [
      { id: 'all', label: '全部國家', flag: '🌍' },
    ];
    if (settings.customCountries && settings.customCountries.length > 0) {
      settings.customCountries
        .filter((c) => c.isActive !== false)
        .forEach((c) => {
          list.push({
            id: c.currency,
            label: c.name,
            flag: c.flag || '🌍',
          });
        });
    } else {
      list.push(
        { id: 'JPY', label: '日本連線', flag: '🇯🇵' },
        { id: 'KRW', label: '韓國東大門', flag: '🇰🇷' },
        { id: 'CNY', label: '中國專櫃/旗艦店', flag: '🇨🇳' }
      );
    }
    return list;
  }, [settings.customCountries]);

  // Navigation / Search / Filters
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customer Authentication Session
  const [loggedCustomer, setLoggedCustomer] = useState<Customer | null>(() => {
    try {
      const savedPhone = localStorage.getItem('globalproxy_logged_customer_phone');
      if (savedPhone && customers) {
        const clean = savedPhone.replace(/[^0-9]/g, '');
        return customers.find((c) => c.phone.replace(/[^0-9]/g, '') === clean) || null;
      }
    } catch {}
    return null;
  });

  // Auth Modal (Login / Register)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authToast, setAuthToast] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLine, setRegLine] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regDeliveryType, setRegDeliveryType] = useState<'7-11' | 'family' | 'home'>('7-11');
  const [regStoreName, setRegStoreName] = useState('');
  const [regStoreCode, setRegStoreCode] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regError, setRegError] = useState('');

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Product Detail Modal
  const [activeProductModal, setActiveProductModal] = useState<CatalogProduct | null>(null);
  const [selectedSubItemIndex, setSelectedSubItemIndex] = useState<number>(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [addedToast, setAddedToast] = useState(false);

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'success'>('info');
  const [newCreatedOrder, setNewCreatedOrder] = useState<Order | null>(null);
  const [copiedOrderCopy, setCopiedOrderCopy] = useState(false);

  // Checkout Form fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custLine, setCustLine] = useState('');
  const [custIg, setCustIg] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custPasswordConfirm, setCustPasswordConfirm] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [checkoutPassError, setCheckoutPassError] = useState('');
  const [deliveryType, setDeliveryType] = useState<'7-11' | 'family' | 'home'>('7-11');
  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [depositChoice, setDepositChoice] = useState<number>(1); // 1 = 100% full, 0.5 = 50%
  const [reportBankLast5, setReportBankLast5] = useState('');

  // Order Tracking Modal
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingTab, setTrackingTab] = useState<'my_orders' | 'quick_search'>('my_orders');
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingSubmitted, setTrackingSubmitted] = useState(false);
  const [myOrdersFilter, setMyOrdersFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [reportLast5ModalOrder, setReportLast5ModalOrder] = useState<Order | null>(null);
  const [inputLast5, setInputLast5] = useState('');
  const [last5SubmittedToast, setLast5SubmittedToast] = useState(false);

  // Customer Out-of-Stock Refund Form State
  const [editingRefundOrderId, setEditingRefundOrderId] = useState<string | null>(null);
  const [refundBankSelect, setRefundBankSelect] = useState<string>('013');
  const [refundBankCode, setRefundBankCode] = useState<string>('013');
  const [refundBankName, setRefundBankName] = useState<string>('國泰世華商業銀行');
  const [refundAccountNo, setRefundAccountNo] = useState<string>('');
  const [refundAccountHolder, setRefundAccountHolder] = useState<string>('');
  const [refundNote, setRefundNote] = useState<string>('');
  const [refundSuccessToast, setRefundSuccessToast] = useState<string>('');

  // Wish / Photo Quote Request State
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [wishProductName, setWishProductName] = useState('');
  const [wishCountry, setWishCountry] = useState<Currency>('JPY');
  const [wishImageUrl, setWishImageUrl] = useState('');
  const [wishRefUrl, setWishRefUrl] = useState('');
  const [wishSpecNote, setWishSpecNote] = useState('');
  const [wishBudget, setWishBudget] = useState<number | ''>('');
  const [wishCustName, setWishCustName] = useState('');
  const [wishCustPhone, setWishCustPhone] = useState('');
  const [wishCommunityName, setWishCommunityName] = useState('');
  const [wishSubmittedToast, setWishSubmittedToast] = useState('');

  // Extra Custom Community Field state
  const [regCommunityName, setRegCommunityName] = useState('');
  const [custCommunityName, setCustCommunityName] = useState('');

  // Mobile Bottom Navigation State
  const [activeMobileNav, setActiveMobileNav] = useState<'home' | 'products' | 'orders' | 'wish' | 'profile'>('home');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [wishModalTab, setWishModalTab] = useState<'submit' | 'history'>('submit');
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Delivery Edit State in Profile
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [editDeliveryType, setEditDeliveryType] = useState<'7-11' | 'family' | 'home'>('7-11');
  const [editStoreCode, setEditStoreCode] = useState('');
  const [editStoreName, setEditStoreName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [deliverySavedToast, setDeliverySavedToast] = useState(false);

  // FAQ Accordion State in Profile
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Open Wish Modal
  const handleOpenWishModal = () => {
    setIsWishModalOpen(true);
    if (loggedCustomer) {
      setWishCustName(loggedCustomer.name);
      setWishCustPhone(loggedCustomer.phone);
      setWishCommunityName(loggedCustomer.communityName || '');
    }
  };

  // Submit Wish Request
  const handleSubmitWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishProductName.trim() || !wishCustName.trim() || !wishCustPhone.trim()) {
      alert('請填寫欲許願商品名稱、您的姓名與手機號碼！');
      return;
    }

    const wishNo = `WISH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
      Math.random() * 90 + 10
    )}`;

    const newWish: WishRequest = {
      id: `wish-${Date.now()}`,
      wishNo,
      customerId: loggedCustomer?.id,
      customerName: wishCustName.trim(),
      customerPhone: wishCustPhone.trim(),
      communityName: wishCommunityName.trim() || undefined,
      productName: wishProductName.trim(),
      country: wishCountry,
      referenceUrl: wishRefUrl.trim() || undefined,
      imageUrl: wishImageUrl.trim() || undefined,
      specNote: wishSpecNote.trim() || undefined,
      budgetTwd: wishBudget ? Number(wishBudget) : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (onSaveWish) {
      onSaveWish(newWish);
    }

    setIsWishModalOpen(false);
    setWishSubmittedToast(`許願成功！單號 ${wishNo}，小幫手將於專櫃採購時專人回覆專屬報價！`);
    setTimeout(() => setWishSubmittedToast(''), 4500);

    // Reset form
    setWishProductName('');
    setWishImageUrl('');
    setWishRefUrl('');
    setWishSpecNote('');
    setWishBudget('');
  };

  // Categories list derived from catalog
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [catalog]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return catalog.filter((p) => {
      if (p.status === 'discontinued') return false;
      if (selectedCountry !== 'all' && p.country !== selectedCountry) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchStore = p.sourceStore?.toLowerCase().includes(q);
        const matchCategory = p.category?.toLowerCase().includes(q);
        const matchSub = p.subItems?.some((s) => s.name.toLowerCase().includes(q));
        if (!matchName && !matchStore && !matchCategory && !matchSub) return false;
      }
      return true;
    });
  }, [catalog, selectedCountry, selectedCategory, searchQuery]);

  // Product display mode: 'compact' (手機雙欄小圖), 'large' (大圖卡片), 'list' (精簡清單)
  const [displayMode, setDisplayMode] = useState<'compact' | 'large' | 'list'>('compact');

  // Step 2 Post-Order payment reporting
  const [step2Last5, setStep2Last5] = useState('');
  const [step2ReportedToast, setStep2ReportedToast] = useState('');
  const [copiedBankNo, setCopiedBankNo] = useState(false);

  // Cart total counts & calculations
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const cartSubtotalTwd = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPriceTwd * item.quantity, 0);
  }, [cartItems]);

  // 店家一律使用 7-11 賣貨便寄件，客人免填門市，運費於抵台後由 7-11 取件付款
  const domesticShippingFee = 0;

  // 由後台設定統一決定訂金或全款成數，不讓客人自由選擇
  const effectiveDepositRatio = useMemo(() => {
    const policy = settings.depositPaymentPolicy || 'deposit_50';
    if (policy === 'full') return 1.0;
    if (policy === 'deposit_custom') return settings.customDepositRatio ?? 0.5;
    return 0.5;
  }, [settings.depositPaymentPolicy, settings.customDepositRatio]);

  const depositPayAmount = useMemo(() => {
    return Math.round(cartSubtotalTwd * effectiveDepositRatio);
  }, [cartSubtotalTwd, effectiveDepositRatio]);

  // Active Photos for the currently selected product/subitem (Up to 5 Photos)
  const activePhotos: string[] = useMemo(() => {
    if (!activeProductModal) return [];
    const curSub = activeProductModal.subItems?.[selectedSubItemIndex];
    if (curSub?.images && curSub.images.length > 0) {
      return curSub.images;
    }
    if (curSub?.imageUrl) {
      return [curSub.imageUrl];
    }
    if (activeProductModal.images && activeProductModal.images.length > 0) {
      return activeProductModal.images;
    }
    if (activeProductModal.imageUrl) {
      return [activeProductModal.imageUrl];
    }
    return [];
  }, [activeProductModal, selectedSubItemIndex]);

  // Open product detail
  const handleOpenProduct = (product: CatalogProduct) => {
    setActiveProductModal(product);
    setSelectedSubItemIndex(0);
    setActivePhotoIndex(0);
    const firstSub = product.subItems?.[0];
    setSelectedSpec(firstSub?.specOptions?.[0] || '');
    setSelectedQty(1);
  };

  // Add to cart from modal
  const handleAddToCart = () => {
    if (!activeProductModal) return;
    const sub = activeProductModal.subItems?.[selectedSubItemIndex] || {
      id: `${activeProductModal.id}-sub`,
      name: activeProductModal.name,
      suggestedPriceTwd: activeProductModal.suggestedPriceTwd || 0,
      originalPrice: activeProductModal.originalPrice,
      isSecondStageFreight: activeProductModal.isSecondStageFreight,
      imageUrl: activeProductModal.imageUrl,
    };

    const cartLineId = `${activeProductModal.id}-${sub.id}-${selectedSpec || 'default'}`;
    const existingIndex = cartItems.findIndex((it) => it.id === cartLineId);

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += selectedQty;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        id: cartLineId,
        productId: activeProductModal.id,
        productName: activeProductModal.name,
        subItemId: sub.id,
        subItemName: sub.name,
        country: activeProductModal.country,
        sourceStore: activeProductModal.sourceStore,
        unitPriceTwd: sub.suggestedPriceTwd,
        originalPrice: sub.originalPrice,
        isSecondStageFreight: sub.isSecondStageFreight,
        spec: selectedSpec || undefined,
        quantity: selectedQty,
        imageUrl: activePhotos[0] || sub.imageUrl || activeProductModal.imageUrl,
      };
      setCartItems([...cartItems, newItem]);
    }

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
    setActiveProductModal(null);
  };

  // Auto-sync logged-in customer info to checkout fields
  useEffect(() => {
    if (loggedCustomer) {
      setCustName(loggedCustomer.name);
      setCustPhone(loggedCustomer.phone);
      setCustLine(loggedCustomer.lineId || '');
      setCustIg(loggedCustomer.igHandle || '');
      if (loggedCustomer.delivery) {
        setDeliveryType(loggedCustomer.delivery.type || '7-11');
        setStoreCode(loggedCustomer.delivery.storeCode || '');
        setStoreName(loggedCustomer.delivery.storeName || '');
        setHomeAddress(loggedCustomer.delivery.address || '');
      }
    }
  }, [loggedCustomer]);

  // Logged-in customer orders
  const myCustomerOrders = useMemo(() => {
    if (!loggedCustomer) return [];
    const cleanPhone = loggedCustomer.phone.replace(/[^0-9]/g, '');
    return orders.filter(
      (o) =>
        o.customerId === loggedCustomer.id ||
        o.customerPhone.replace(/[^0-9]/g, '') === cleanPhone ||
        o.customerName === loggedCustomer.name
    );
  }, [orders, loggedCustomer]);

  const activeMyOrders = useMemo(() => {
    return myCustomerOrders.filter((o) => o.status !== 'fulfilled' && o.status !== 'cancelled');
  }, [myCustomerOrders]);

  const completedMyOrders = useMemo(() => {
    return myCustomerOrders.filter((o) => o.status === 'fulfilled' || o.status === 'cancelled');
  }, [myCustomerOrders]);

  // Logged-in customer wishes
  const myCustomerWishes = useMemo(() => {
    if (!loggedCustomer) return [];
    const cleanPhone = loggedCustomer.phone.replace(/[^0-9]/g, '');
    return wishRequests.filter(
      (w) =>
        (w.customerId && w.customerId === loggedCustomer.id) ||
        w.customerPhone.replace(/[^0-9]/g, '') === cleanPhone ||
        w.customerName === loggedCustomer.name
    );
  }, [wishRequests, loggedCustomer]);

  const pendingWishesCount = useMemo(() => {
    return myCustomerWishes.filter((w) => w.status === 'pending' || w.status === 'quoted').length;
  }, [myCustomerWishes]);

  // Mobile Bottom Navigation Handlers
  const handleMobileNavHome = () => {
    setActiveMobileNav('home');
    setIsProfileModalOpen(false);
    setIsTrackingModalOpen(false);
    setIsWishModalOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMobileNavProducts = () => {
    setActiveMobileNav('products');
    setIsProfileModalOpen(false);
    setIsTrackingModalOpen(false);
    setIsWishModalOpen(false);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('product-catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
    }
  };

  const handleMobileNavOrders = () => {
    setActiveMobileNav('orders');
    setIsProfileModalOpen(false);
    setIsWishModalOpen(false);
    setIsTrackingModalOpen(true);
    setTrackingTab('my_orders');
  };

  const handleMobileNavWish = () => {
    setActiveMobileNav('wish');
    setIsProfileModalOpen(false);
    setIsTrackingModalOpen(false);
    handleOpenWishModal();
  };

  const handleMobileNavProfile = () => {
    setActiveMobileNav('profile');
    setIsTrackingModalOpen(false);
    setIsWishModalOpen(false);
    setIsProfileModalOpen(true);
    if (loggedCustomer) {
      setEditDeliveryType(loggedCustomer.delivery?.type || '7-11');
      setEditStoreCode(loggedCustomer.delivery?.storeCode || '');
      setEditStoreName(loggedCustomer.delivery?.storeName || '');
      setEditAddress(loggedCustomer.delivery?.address || '');
    }
  };

  const handleSaveDeliveryInfo = () => {
    if (!loggedCustomer) return;
    const updatedCustomer: Customer = {
      ...loggedCustomer,
      delivery: {
        type: editDeliveryType,
        storeCode: editStoreCode.trim() || undefined,
        storeName: editStoreName.trim() || undefined,
        address: editAddress.trim() || undefined,
      },
    };
    setLoggedCustomer(updatedCustomer);
    if (onSaveCustomer) {
      onSaveCustomer(updatedCustomer);
    }
    setIsEditingDelivery(false);
    setDeliverySavedToast(true);
    setTimeout(() => setDeliverySavedToast(false), 3000);
  };

  // Customer Login Handler
  const handleCustomerLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    if (!loginPhone.trim()) {
      setLoginError('請輸入手機號碼');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('請輸入登入密碼');
      return;
    }

    const cleanInputPhone = loginPhone.replace(/[^0-9]/g, '');
    const found = customers.find(
      (c) => c.phone.replace(/[^0-9]/g, '') === cleanInputPhone
    );

    if (!found) {
      setLoginError('查無此手機號碼的會員。若為新客，請切換至【註冊新帳號】或下單結帳時設置密碼！');
      return;
    }

    if (found.password && found.password !== loginPassword.trim()) {
      setLoginError('密碼輸入錯誤，請重新確認 (示範帳號密碼為: password123)');
      return;
    }

    setLoggedCustomer(found);
    localStorage.setItem('globalproxy_logged_customer_phone', found.phone);
    setAuthToast(`歡迎回來，${found.name}！已成功登入會員。`);
    setTimeout(() => setAuthToast(''), 3000);
    setIsAuthModalOpen(false);
    setLoginPassword('');
    // Open tracking modal to show their orders immediately
    setIsTrackingModalOpen(true);
    setTrackingTab('my_orders');
  };

  // Customer Register Handler
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regPhone.trim()) {
      setRegError('請填寫收件人姓名與手機號碼');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('密碼長度至少需 4 碼以上');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setRegError('兩次輸入的密碼不一致，請再次確認');
      return;
    }

    const cleanInputPhone = regPhone.replace(/[^0-9]/g, '');
    const existing = customers.find(
      (c) => c.phone.replace(/[^0-9]/g, '') === cleanInputPhone
    );
    if (existing) {
      setRegError('此手機號碼已註冊過會員，請切換至【會員登入】');
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: regName.trim(),
      phone: regPhone.trim(),
      lineId: regLine.trim() || regName.trim(),
      password: regPassword.trim(),
      delivery: {
        type: '7-11',
      },
      tag: '新客',
      totalSpentTwd: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (onSaveCustomer) {
      onSaveCustomer(newCust);
    }

    setLoggedCustomer(newCust);
    localStorage.setItem('globalproxy_logged_customer_phone', newCust.phone);
    setAuthToast(`註冊成功！歡迎加入 GlobalProxy 會員，${newCust.name}！`);
    setTimeout(() => setAuthToast(''), 3000);
    setIsAuthModalOpen(false);
    setRegPassword('');
    setRegPasswordConfirm('');
    setIsTrackingModalOpen(true);
    setTrackingTab('my_orders');
  };

  const handleCustomerLogout = () => {
    setLoggedCustomer(null);
    localStorage.removeItem('globalproxy_logged_customer_phone');

    // 清空結帳表單暫存個資與憑證
    setCustName('');
    setCustPhone('');
    setCustLine('');
    setCustIg('');
    setCustCommunityName('');
    setCustPassword('');
    setCustPasswordConfirm('');
    setShowCustPassword(false);
    setCheckoutPassError('');
    setStoreCode('');
    setStoreName('');
    setHomeAddress('');
    setOrderNotes('');
    setReportBankLast5('');

    // 清空個人中心收件地址編輯暫存
    setEditStoreCode('');
    setEditStoreName('');
    setEditAddress('');
    setIsEditingDelivery(false);

    // 清空許願單預填資料與退款表單暫存
    setWishCustName('');
    setWishCustPhone('');
    setWishCommunityName('');
    setRefundAccountNo('');
    setRefundAccountHolder('');
    setRefundNote('');
    setEditingRefundOrderId(null);

    setAuthToast('已安全登出會員帳號');
    setTimeout(() => setAuthToast(''), 2500);
  };


  const handleQuickFillDemoAccount = (phone = '0912-345-678') => {
    setLoginPhone(phone);
    setLoginPassword('password123');
  };

  const handleBankSelectChange = (val: string) => {
    setRefundBankSelect(val);
    if (val === 'other') {
      setRefundBankCode('');
      setRefundBankName('');
    } else {
      const b = TAIWAN_BANKS.find((item) => item.code === val);
      if (b) {
        setRefundBankCode(b.code);
        setRefundBankName(b.name);
      }
    }
  };

  const handleStartEditRefund = (ord: Order) => {
    setEditingRefundOrderId(ord.id);
    if (ord.refundBankInfo) {
      const match = TAIWAN_BANKS.find((b) => b.code === ord.refundBankInfo?.bankCode);
      if (match) {
        setRefundBankSelect(match.code);
        setRefundBankCode(match.code);
        setRefundBankName(match.name);
      } else {
        setRefundBankSelect('other');
        setRefundBankCode(ord.refundBankInfo.bankCode || '');
        setRefundBankName(ord.refundBankInfo.bankName || '');
      }
      setRefundAccountNo(ord.refundBankInfo.accountNo || '');
      setRefundAccountHolder(ord.refundBankInfo.accountHolder || '');
      setRefundNote(ord.refundBankInfo.note || '');
    } else {
      setRefundBankSelect('013');
      setRefundBankCode('013');
      setRefundBankName('國泰世華商業銀行');
      setRefundAccountNo('');
      setRefundAccountHolder(ord.customerName || loggedCustomer?.name || '');
      setRefundNote('');
    }
  };

  const handleSubmitCustomerRefundInfo = (ord: Order) => {
    if (!refundAccountNo.trim()) {
      alert('請填寫退款銀行帳號！');
      return;
    }
    if (!refundAccountHolder.trim()) {
      alert('請填寫退款帳戶戶名！');
      return;
    }
    const finalBankCode = refundBankSelect === 'other' ? (refundBankCode.trim() || '其他') : refundBankCode;
    const finalBankName = refundBankSelect === 'other' ? (refundBankName.trim() || '自訂銀行') : refundBankName;

    const updatedOrder: Order = {
      ...ord,
      refundStatus: 'ready_to_refund',
      refundAmountTwd: ord.refundAmountTwd || ord.depositPaidTwd,
      refundBankInfo: {
        bankCode: finalBankCode,
        bankName: finalBankName,
        accountNo: refundAccountNo.trim(),
        accountHolder: refundAccountHolder.trim(),
        submittedAt: new Date().toISOString(),
        note: refundNote.trim() || undefined,
      },
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }
    setEditingRefundOrderId(null);
    setRefundSuccessToast('已成功送出退款帳戶資料！小幫手正安排匯款退費，預計 1 個工作天內入帳。');
    setTimeout(() => setRefundSuccessToast(''), 4000);
  };

  // Modify cart quantities
  const handleUpdateCartQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter((it): it is CartItem => it !== null)
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

    // Submit checkout
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutPassError('');
    if (!custName.trim() || !custPhone.trim()) {
      alert('請填寫收件人姓名與聯絡電話');
      return;
    }

    // Customer resolution and password validation
    let resolvedCustomer: Customer;
    const cleanPhone = custPhone.replace(/[^0-9]/g, '');
    const matchedExisting = customers.find(
      (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone
    );

    if (loggedCustomer) {
      resolvedCustomer = {
        ...loggedCustomer,
        name: custName.trim(),
        lineId: custLine.trim() || loggedCustomer.lineId,
        igHandle: custIg.trim() || loggedCustomer.igHandle,
        delivery: {
          type: '7-11',
        },
      };
    } else {
      // Must set password if not logged in
      if (!custPassword || custPassword.length < 4) {
        setCheckoutPassError('為了方便您往後隨時登入查詢訂單狀況，請設置至少 4 碼登入密碼！');
        alert('請設置至少 4 碼的會員登入密碼，以利往後登入查詢訂單狀況');
        return;
      }
      if (custPassword !== custPasswordConfirm) {
        setCheckoutPassError('兩次輸入的密碼不一致，請再次確認');
        alert('兩次輸入的密碼不一致，請再次確認');
        return;
      }

      if (matchedExisting) {
        if (matchedExisting.password && matchedExisting.password !== custPassword.trim()) {
          alert('檢測到此手機號碼已註冊過會員，但輸入的密碼不正確，請輸入原密碼 (預設: password123) 或點右上角登入！');
          return;
        }
        resolvedCustomer = {
          ...matchedExisting,
          name: custName.trim(),
          lineId: custLine.trim() || matchedExisting.lineId,
          password: custPassword.trim() || matchedExisting.password || 'password123',
          delivery: {
            type: '7-11',
          },
        };
      } else {
        resolvedCustomer = {
          id: `cust-${Date.now()}`,
          name: custName.trim(),
          phone: custPhone.trim(),
          lineId: custLine.trim() || custName.trim(),
          igHandle: custIg.trim() || undefined,
          password: custPassword.trim(),
          delivery: {
            type: '7-11',
          },
          tag: '新客',
          totalSpentTwd: cartSubtotalTwd,
          ordersCount: 1,
          createdAt: new Date().toISOString(),
        };
      }

      // Auto login customer
      setLoggedCustomer(resolvedCustomer);
      localStorage.setItem('globalproxy_logged_customer_phone', resolvedCustomer.phone);
    }

    // Determine primary country of order
    const primaryCountry = cartItems[0]?.country || 'JPY';

    // Map cart to OrderItems
    const orderItems: OrderItem[] = cartItems.map((c, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: c.subItemName !== c.productName ? `${c.productName} - ${c.subItemName}` : c.productName,
      category: '顧客商城下單',
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

    const orderNo = `GP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
      Math.random() * 900 + 100
    )}`;

    const balanceReq = Math.max(0, cartSubtotalTwd - depositPayAmount);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNo,
      customerId: resolvedCustomer.id,
      customerName: resolvedCustomer.name,
      customerPhone: resolvedCustomer.phone,
      country: primaryCountry,
      items: orderItems,
      status: 'pending_deposit',
      createdAt: new Date().toISOString(),
      itemsTotalTwd: cartSubtotalTwd,
      depositRatio: effectiveDepositRatio,
      depositRequiredTwd: depositPayAmount,
      depositPaidTwd: 0,
      depositPaymentStatus: 'unpaid',
      actualAirFreightTwd: 0,
      domesticFreightTwd: 0,
      tariffTwd: 0,
      discountTwd: 0,
      balanceRequiredTwd: balanceReq,
      balancePaidTwd: 0,
      balancePaymentStatus: 'unpaid',
      totalRevenueTwd: depositPayAmount,
      estimatedProfitTwd: Math.round(cartSubtotalTwd * 0.15),
      deliveryMethod: '7-11 賣貨便 (抵台後由店主開設專屬賣場)',
      customerNotes: orderNotes.trim() || undefined,
      adminNotes: '由顧客網站下單前台線上提交',
    };

    setStep2Last5('');
    setStep2ReportedToast('');
    onPlaceOrder(newOrder, resolvedCustomer);
    setNewCreatedOrder(newOrder);
    setCheckoutStep('success');
    setCartItems([]);
  };

  // Copy order summary for LINE
  const handleCopyOrderSummary = () => {
    if (!newCreatedOrder) return;
    const bank = settings.receivingBank;
    const text = `📦【GlobalProxy 連線代購 - 下單確認】
委託單號：${newCreatedOrder.orderNo}
訂購人：${newCreatedOrder.customerName} (${newCreatedOrder.customerPhone})
商品總額：${formatTwd(newCreatedOrder.itemsTotalTwd)}
本次應轉帳金額：${formatTwd(newCreatedOrder.depositRequiredTwd)}

🏦【匯款帳號】
銀行：${bank.bankCode} ${bank.bankName}
帳號：${bank.accountNo}
戶名：${bank.accountHolder}

寄送方式：${newCreatedOrder.deliveryMethod}
轉帳後請告知後五碼，小幫手將立即為您安排海外採購！謝謝您 ❤️`;

    navigator.clipboard.writeText(text);
    setCopiedOrderCopy(true);
    setTimeout(() => setCopiedOrderCopy(false), 2000);
  };

  // Search orders for tracking
  const trackingResults = useMemo(() => {
    if (!trackingQuery.trim()) return [];
    const q = trackingQuery.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.customerName.toLowerCase().includes(q)
    );
  }, [orders, trackingQuery]);

  // Handle report last 5 from tracking modal
  const handleReportFromTracking = () => {
    if (!reportLast5ModalOrder || !inputLast5.trim()) return;
    if (onReportTransferLast5) {
      onReportTransferLast5(reportLast5ModalOrder.orderNo, inputLast5.trim(), reportLast5ModalOrder.depositRequiredTwd);
    }
    setLast5SubmittedToast(true);
    setTimeout(() => {
      setLast5SubmittedToast(false);
      setReportLast5ModalOrder(null);
      setInputLast5('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Admin Mode Switcher Banner (Only visible when staff member is logged in) */}
      {currentAdmin && (
        <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">
              👑 正在以管理員 ({currentAdmin.name}) 身份預覽前台
            </span>
          </div>
          <button
            onClick={onSwitchToAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md transition-colors cursor-pointer text-xs shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回代購管理後台</span>
          </button>
        </div>
      )}

      {/* Store Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-sm tracking-wider">
              {settings.shopName ? settings.shopName.trim().slice(0, 2).toUpperCase() : 'GP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  {settings.shopName || 'GlobalProxy 連線代購'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  海外連線代購
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {settings.shopSubtitle || '日本 · 韓國 · 美國 · 歐洲專櫃正品代購直寄'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {loggedCustomer ? (
              <>
                {/* Logged in member badge */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTrackingModalOpen(true);
                    setTrackingTab('my_orders');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  title="點擊進入會員中心查看我的訂單"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[85px]">{loggedCustomer.name}</span>
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                    {loggedCustomer.tag}
                  </span>
                </button>

                {/* My Orders Button */}
                <button
                  onClick={() => {
                    setIsTrackingModalOpen(true);
                    setTrackingTab('my_orders');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 rounded-xl transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>我的訂單 ({myCustomerOrders.length})</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleCustomerLogout}
                  title="登出會員帳號"
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {/* Login / Register Button */}
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setAuthTab('login');
                    setLoginError('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>會員登入 / 註冊</span>
                </button>

                {/* Order Tracking button */}
                <button
                  onClick={() => {
                    setIsTrackingModalOpen(true);
                    setTrackingTab('quick_search');
                    setTrackingSubmitted(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4 text-stone-500" />
                  <span className="hidden sm:inline">免登入查單</span>
                </button>
              </>
            )}

            {/* Wish / Photo Quote Request button */}
            {settings.enableWishlistArea !== false && (
              <button
                type="button"
                onClick={handleOpenWishModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                title="商品傳圖許願/估價"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">傳圖許願區</span>
                <span className="sm:hidden">許願</span>
              </button>
            )}

            {/* Shopping Cart button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">委託購物車</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-mono font-bold flex items-center justify-center -ml-0.5">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Auth Notification Toast */}
      {authToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{authToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-8 space-y-6">
        {/* Connection Notice / Hero Announcement */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded text-blue-200">
                {settings.heroBadgeText || '本期現場連線中'}
              </span>
              <span>· 專櫃直購 · 保證真品正貨</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {settings.heroTitle || '日本吉卜力、Chiikawa、韓國東大門服飾現場連線中！'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {settings.heroDescription || '✨ 價格透明化：商品皆標示「一口價（已含國際空運，免二補）」，直接確認台幣售價！ 下單後專人於海外專櫃/官網採購，抵台直接超商取貨或宅配到府。'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{settings.heroFeature1 || '一口價免二次催補款'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{settings.heroFeature2 || '支援 7-11 / 全家超取'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{settings.heroFeature3 || '全程訂單進度即時追蹤'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div id="product-catalog-section" className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3.5 scroll-mt-20">
          {/* Country Selection */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {countryOptions.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCountry(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCountry === c.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Category & Search row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {cat === 'all' ? '全部種類' : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋商品、娃娃、服飾..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid & Display Mode Switcher */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>現正好評連線中</span>
                <span className="text-xs font-normal text-stone-500 font-mono">
                  ({filteredProducts.length} 款商品)
                </span>
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5 hidden sm:block">
                點擊商品卡片即可自由挑選品項色號加入委託車
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 p-1 rounded-xl border border-stone-200/80">
              <span className="text-[10px] text-stone-500 font-medium pl-1 pr-0.5">顯示方式:</span>
              <button
                type="button"
                onClick={() => setDisplayMode('compact')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  displayMode === 'compact'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
                title="小圖雙欄顯示（適合手機快速瀏覽）"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                <span>小圖</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('large')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  displayMode === 'large'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
                title="大圖詳細卡片"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>大圖</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('list')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  displayMode === 'list'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-stone-600 hover:text-slate-900'
                }`}
                title="精簡清單"
              >
                <List className="w-3.5 h-3.5" />
                <span>清單</span>
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">查無符合的連線商品</p>
              <p className="text-xs text-stone-400 mt-1">請嘗試變更國家或搜尋條件</p>
            </div>
          ) : displayMode === 'compact' ? (
            /* Mode 1: Compact Grid (2 columns on mobile, neat and not oversized!) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredProducts.map((prod) => {
                const subItems = prod.subItems || [];
                const prices = subItems.map((s) => s.suggestedPriceTwd).filter(Boolean);
                const minPrice = prices.length ? Math.min(...prices) : prod.suggestedPriceTwd || 0;
                const maxPrice = prices.length ? Math.max(...prices) : prod.suggestedPriceTwd || 0;
                const priceDisplay =
                  minPrice === maxPrice
                    ? formatTwd(minPrice)
                    : `${formatTwd(minPrice)}~`;

                const hasSecondFreight = subItems.some((s) => s.isSecondStageFreight);

                // Determine Sale Mode badge
                const hasStock = subItems.some((s) => s.saleMode === 'in_stock' || (s.stockQty ?? 0) > 0);
                const hasPreorder = subItems.some((s) => s.saleMode === 'preorder' || (s.stockQty ?? 0) === 0);
                const saleBadge =
                  hasStock && hasPreorder
                    ? { label: '⚡ 現貨+預購', cls: 'bg-sky-600 text-white' }
                    : hasStock
                    ? { label: '⚡ 現貨', cls: 'bg-emerald-600 text-white' }
                    : { label: '📦 預購', cls: 'bg-indigo-600 text-white' };

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleOpenProduct(prod)}
                    className="group bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col cursor-pointer"
                  >
                    {/* Compact Square Image */}
                    <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                      <ProductImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        category={prod.category}
                        country={prod.country}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Country badge */}
                      <span className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                        <span>{prod.country === 'JPY' ? '🇯🇵' : prod.country === 'KRW' ? '🇰🇷' : prod.country === 'USD' ? '🇺🇸' : prod.country === 'CNY' ? '🇨🇳' : '🇪🇺'}</span>
                        <span className="max-w-[70px] truncate">{prod.sourceStore || prod.country}</span>
                      </span>

                      {/* Badges container */}
                      <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs ${saleBadge.cls}`}>
                          {saleBadge.label}
                        </span>
                        {hasSecondFreight ? (
                          <span className="bg-amber-500/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            需二補
                          </span>
                        ) : (
                          <span className="bg-emerald-600/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            一口價
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2">
                      <div>
                        <div className="text-[10px] text-stone-500 truncate mb-0.5">
                          {prod.category}
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {prod.name}
                        </h3>
                      </div>

                      <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <div className="text-[9px] text-stone-400">到手價</div>
                          <div className="text-xs sm:text-sm font-extrabold font-mono text-blue-900">
                            {priceDisplay}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md text-[11px] font-semibold transition-colors"
                        >
                          挑選
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : displayMode === 'large' ? (
            /* Mode 2: Large Cards (Single col on phone, wide preview) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
              {filteredProducts.map((prod) => {
                const subItems = prod.subItems || [];
                const prices = subItems.map((s) => s.suggestedPriceTwd).filter(Boolean);
                const minPrice = prices.length ? Math.min(...prices) : prod.suggestedPriceTwd || 0;
                const maxPrice = prices.length ? Math.max(...prices) : prod.suggestedPriceTwd || 0;
                const priceDisplay =
                  minPrice === maxPrice
                    ? formatTwd(minPrice)
                    : `${formatTwd(minPrice)} ~ ${formatTwd(maxPrice)}`;

                const hasSecondFreight = subItems.some((s) => s.isSecondStageFreight);

                // Determine Sale Mode badge
                const hasStock = subItems.some((s) => s.saleMode === 'in_stock' || (s.stockQty ?? 0) > 0);
                const hasPreorder = subItems.some((s) => s.saleMode === 'preorder' || (s.stockQty ?? 0) === 0);
                const saleBadge =
                  hasStock && hasPreorder
                    ? { label: '⚡ 現貨+預購', cls: 'bg-sky-600 text-white' }
                    : hasStock
                    ? { label: '⚡ 現貨', cls: 'bg-emerald-600 text-white' }
                    : { label: '📦 預購', cls: 'bg-indigo-600 text-white' };

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleOpenProduct(prod)}
                    className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col cursor-pointer"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
                      <ProductImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        category={prod.category}
                        country={prod.country}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Country badge */}
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <span>{prod.country === 'JPY' ? '🇯🇵' : prod.country === 'KRW' ? '🇰🇷' : prod.country === 'USD' ? '🇺🇸' : prod.country === 'CNY' ? '🇨🇳' : '🇪🇺'}</span>
                        <span>{prod.sourceStore || prod.country}</span>
                      </span>

                      {/* Badges container */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${saleBadge.cls}`}>
                          {saleBadge.label}
                        </span>
                        {hasSecondFreight ? (
                          <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                            需二補運費
                          </span>
                        ) : (
                          <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                            一口價免二補
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-1">
                          <span>{prod.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[10px]">{prod.sku}</span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {prod.name}
                        </h3>

                        {subItems.length > 1 && (
                          <div className="mt-2 text-[11px] text-stone-500 line-clamp-1">
                            包含：{subItems.map((s) => s.name).join('、')}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-stone-500">委託到手價</div>
                          <div className="text-base font-extrabold font-mono text-blue-900">
                            {priceDisplay}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>選購品項</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Mode 3: Compact List View */
            <div className="space-y-2.5">
              {filteredProducts.map((prod) => {
                const subItems = prod.subItems || [];
                const prices = subItems.map((s) => s.suggestedPriceTwd).filter(Boolean);
                const minPrice = prices.length ? Math.min(...prices) : prod.suggestedPriceTwd || 0;
                const maxPrice = prices.length ? Math.max(...prices) : prod.suggestedPriceTwd || 0;
                const priceDisplay =
                  minPrice === maxPrice
                    ? formatTwd(minPrice)
                    : `${formatTwd(minPrice)} ~ ${formatTwd(maxPrice)}`;

                const hasSecondFreight = subItems.some((s) => s.isSecondStageFreight);

                const hasStock = subItems.some((s) => s.saleMode === 'in_stock' || (s.stockQty ?? 0) > 0);
                const hasPreorder = subItems.some((s) => s.saleMode === 'preorder' || (s.stockQty ?? 0) === 0);
                const saleBadge =
                  hasStock && hasPreorder
                    ? { label: '⚡ 現貨+預購', cls: 'bg-sky-600 text-white' }
                    : hasStock
                    ? { label: '⚡ 現貨', cls: 'bg-emerald-600 text-white' }
                    : { label: '📦 預購', cls: 'bg-indigo-600 text-white' };

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleOpenProduct(prod)}
                    className="group bg-white rounded-xl border border-stone-200/90 p-2.5 sm:p-3 hover:border-blue-300 hover:shadow-xs transition-all flex items-center gap-3 sm:gap-4 cursor-pointer"
                  >
                    <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-lg bg-stone-100 overflow-hidden shrink-0 relative">
                      <ProductImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        category={prod.category}
                        country={prod.country}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                        {prod.country === 'JPY' ? '🇯🇵' : prod.country === 'KRW' ? '🇰🇷' : prod.country === 'USD' ? '🇺🇸' : prod.country === 'CNY' ? '🇨🇳' : '🇪🇺'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 mb-0.5 flex-wrap">
                        <span className="font-medium text-slate-700">{prod.sourceStore || prod.country}</span>
                        <span>·</span>
                        <span>{prod.category}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${saleBadge.cls}`}>
                          {saleBadge.label}
                        </span>
                        {hasSecondFreight ? (
                          <span className="text-amber-600 bg-amber-50 px-1 py-0.2 rounded font-medium">二補運費</span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-medium">一口價</span>
                        )}
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {prod.name}
                      </h3>
                      {subItems.length > 1 && (
                        <div className="text-[11px] text-stone-400 truncate mt-0.5">
                          {subItems.length} 種款式規格可選
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[9px] text-stone-400">委託價</div>
                      <div className="text-xs sm:text-sm font-extrabold font-mono text-blue-900">
                        {priceDisplay}
                      </div>
                      <button
                        type="button"
                        className="mt-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md text-[11px] font-semibold transition-colors"
                      >
                        選購
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Product Detail & Variant Selection Modal */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {activeProductModal.country} 代購
                </span>
                <span className="text-xs text-stone-500">{activeProductModal.category}</span>
              </div>
              <button
                onClick={() => setActiveProductModal(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 flex-1">
              {/* Product 5-Photo Gallery Viewer */}
              <div className="space-y-2">
                <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200 flex items-center justify-center group">
                  <ProductImage
                    src={activePhotos[activePhotoIndex] || activePhotos[0] || activeProductModal.imageUrl}
                    alt={activeProductModal.name}
                    category={activeProductModal.category}
                    country={activeProductModal.country}
                    className="w-full h-full object-contain bg-white"
                  />

                  {/* Multiple photos navigation arrows & indicator */}
                  {activePhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) => (prev - 1 + activePhotos.length) % activePhotos.length);
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
                        title="上一張"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) => (prev + 1) % activePhotos.length);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
                        title="下一張"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Photo counter badge */}
                      <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 shadow-xs">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{activePhotoIndex + 1} / {activePhotos.length}</span>
                      </div>

                      {/* Cover label if index 0 */}
                      {activePhotoIndex === 0 && (
                        <div className="absolute bottom-3 left-3 bg-blue-600/90 text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-xs">
                          品項首圖
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Thumbnail strip when multiple photos are present (up to 5 photos) */}
                {activePhotos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                    {activePhotos.map((photoUrl, pIdx) => {
                      const isCurrent = pIdx === activePhotoIndex;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setActivePhotoIndex(pIdx)}
                          className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            isCurrent
                              ? 'border-blue-600 ring-2 ring-blue-600/30 scale-102'
                              : 'border-stone-200 opacity-65 hover:opacity-100 hover:border-stone-400'
                          }`}
                        >
                          <ProductImage
                            src={photoUrl}
                            alt={`第 ${pIdx + 1} 張照`}
                            category={activeProductModal.category}
                            country={activeProductModal.country}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                            {pIdx + 1}
                          </span>
                        </button>
                      );
                    })}
                    <span className="text-[11px] text-stone-400 pl-1 shrink-0 font-medium">
                      共 {activePhotos.length} 張細節照 (上限5張)
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {activeProductModal.country} 連線
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    貨號：{activeProductModal.sku}
                  </span>
                  <span className="text-xs text-stone-500">
                    採購地：{activeProductModal.sourceStore}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {activeProductModal.name}
                </h3>
                {activeProductModal.description && (
                  <p className="text-xs text-stone-600 leading-relaxed pt-1 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                    {activeProductModal.description}
                  </p>
                )}
              </div>

              {/* Current Selected Variant Sale Mode Notice Banner */}
              {activeProductModal.subItems?.[selectedSubItemIndex] && (() => {
                const currentSub = activeProductModal.subItems[selectedSubItemIndex];
                const isStock = currentSub.saleMode === 'in_stock' || (currentSub.stockQty ?? 0) > 0;
                return isStock ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-800">⚡ 現貨供應中</span>
                      <span className="text-emerald-700 ml-1.5">
                        剩餘現貨庫存 {currentSub.stockQty || 1} 件，完成訂購轉帳後立即排單寄出！
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2.5 shadow-2xs">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-indigo-950">📦 海外專櫃連線預購</div>
                      <div className="text-indigo-800 mt-0.5">
                        {currentSub.preorderNotice || '海外買手現場專櫃採購，下單後約 7-14 個工作天抵台出貨！'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-item Variants List */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    選擇欲購買的品項款式：
                  </label>
                  <span className="text-[11px] text-stone-400">點選品項即刻切換該款照片</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(activeProductModal.subItems || []).map((sub, idx) => {
                    const isSelected = selectedSubItemIndex === idx;
                    const subPhotoCount = sub.images?.length || (sub.imageUrl ? 1 : 0);
                    const isSubInStock = sub.saleMode === 'in_stock' || (sub.stockQty ?? 0) > 0;
                    return (
                      <div
                        key={sub.id || idx}
                        onClick={() => {
                          setSelectedSubItemIndex(idx);
                          setSelectedSpec(sub.specOptions?.[0] || '');
                          setActivePhotoIndex(0);
                        }}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>

                          {/* Sub-item Thumbnail */}
                          <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                            <ProductImage
                              src={sub.imageUrl || (sub.images && sub.images[0]) || activeProductModal.imageUrl}
                              alt={sub.name}
                              category={activeProductModal.category}
                              country={activeProductModal.country}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">{sub.name}</span>
                              {subPhotoCount > 1 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  {subPhotoCount}張圖
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                              {sub.isSecondStageFreight ? (
                                <span className="text-amber-700 font-medium">⚠️ 需二補運費</span>
                              ) : (
                                <span className="text-emerald-700 font-medium">✅ 一口價免二補</span>
                              )}
                              {sub.originalPrice ? (
                                <span>· 原幣約 {formatCurrencyAmount(sub.originalPrice, activeProductModal.country)}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-sm text-blue-900">
                            {formatTwd(sub.suggestedPriceTwd)}
                          </div>
                          <div className="text-[10px] font-semibold mt-0.5">
                            {isSubInStock ? (
                              <span className="text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                                ⚡ 現貨 ({sub.stockQty})
                              </span>
                            ) : (
                              <span className="text-indigo-800 bg-indigo-100/90 px-1.5 py-0.5 rounded">
                                📦 預購
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specs / Options if any */}
              {activeProductModal.subItems?.[selectedSubItemIndex]?.specOptions &&
                activeProductModal.subItems[selectedSubItemIndex].specOptions!.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    <label className="block text-xs font-bold text-slate-900">規格 / 款式色號：</label>
                    <div className="flex flex-wrap gap-2">
                      {activeProductModal.subItems[selectedSubItemIndex].specOptions!.map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => setSelectedSpec(sp)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            selectedSpec === sp
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quantity Stepper */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">委託數量：</span>
                <div className="flex items-center gap-3 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    disabled={selectedQty <= 1}
                    className="p-1 text-stone-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-sm w-6 text-center text-slate-900">
                    {selectedQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedQty((q) => q + 1)}
                    className="p-1 text-stone-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-stone-500">單品小計</div>
                <div className="font-mono font-extrabold text-base text-blue-900">
                  {formatTwd(
                    (activeProductModal.subItems?.[selectedSubItemIndex]?.suggestedPriceTwd ||
                      activeProductModal.suggestedPriceTwd ||
                      0) * selectedQty
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 max-w-xs py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>加入委託購物車</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            {/* Cart Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  代購委託清單 ({totalCartCount} 件)
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-8">
                  <ShoppingCart className="w-12 h-12 stroke-1 mb-2 text-stone-300" />
                  <p className="text-sm font-semibold text-stone-600">購物車目前是空的</p>
                  <p className="text-xs text-stone-400 mt-1">快去商場挑選心儀的海外商品吧！</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex gap-3 items-center"
                  >
                    <div className="w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0 border border-stone-200">
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.subItemName}
                        category="購物車"
                        country={item.country}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">
                        品項：{item.subItemName}
                        {item.spec && ` (${item.spec})`}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-xs text-blue-900">
                          {formatTwd(item.unitPriceTwd)}
                        </span>
                        {item.isSecondStageFreight ? (
                          <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-medium">
                            需二補運費
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-medium">
                            一口價免二補
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper & Trash */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRemoveCartItem(item.id)}
                        className="text-stone-400 hover:text-rose-500 cursor-pointer p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-md px-1 py-0.5">
                        <button
                          onClick={() => handleUpdateCartQty(item.id, -1)}
                          className="text-stone-500 hover:text-slate-900 px-1 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold text-slate-800 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateCartQty(item.id, 1)}
                          className="text-stone-500 hover:text-slate-900 px-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>商品總金額</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatTwd(cartSubtotalTwd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>台灣本地運費 (超取)</span>
                    <span className="font-mono">NT$ 60 (結帳時確認)</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 font-medium pt-1 border-t border-stone-200">
                    <span>國際空運費</span>
                    <span>多數品項已含一口價免二補</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                    setCheckoutStep('info');
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>前往填寫收件資料與結帳</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  {checkoutStep === 'info' ? '填寫委託單收件資料' : '委託單成立成功！'}
                </h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Info Form */}
            {checkoutStep === 'info' ? (
              <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4 flex-1">
                {loggedCustomer ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-blue-950 flex items-center gap-1.5">
                          <span>已登入會員：{loggedCustomer.name}</span>
                          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">{loggedCustomer.tag}</span>
                        </div>
                        <div className="text-[11px] text-blue-700">
                          帳號電話：{loggedCustomer.phone} · 收件資料已自動帶入，訂單將歸入您的會員專區
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCustomerLogout}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer shrink-0"
                    >
                      切換帳號
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-amber-900">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>已有會員帳號？點此登入可自動帶入常用收件門市</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setAuthTab('login');
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      會員登入
                    </button>
                  </div>
                )}

                {/* Customer Contact */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>訂購人聯絡資訊</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        收件人真實姓名 *
                      </label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="例：林欣宜"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        聯絡手機電話 *
                      </label>
                      <input
                        type="tel"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="例：0912-345-678"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        LINE ID (方便客服即時對帳)
                      </label>
                      <input
                        type="text"
                        value={custLine}
                        onChange={(e) => setCustLine(e.target.value)}
                        placeholder="例：jessica_lin"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        IG 帳號 (選填)
                      </label>
                      <input
                        type="text"
                        value={custIg}
                        onChange={(e) => setCustIg(e.target.value)}
                        placeholder="例：@jess_tokyo"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Account & Password Setup */}
                {!loggedCustomer && (
                  <div className="space-y-2.5 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-blue-600" />
                        <span>設置會員登入密碼 *</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                          查詢訂單必備
                        </span>
                      </h4>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2.5">
                      <p className="text-[11px] text-blue-900 leading-relaxed">
                        🔐 <strong>帳號登入密碼設定：</strong>
                        設置至少 4 碼密碼後，往後憑<strong>手機號碼與此密碼</strong>即可登入前台，一覽所有海外採購進度與訂單明細，免重複填寫收件地址！
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            設定登入密碼 * (至少 4 碼)
                          </label>
                          <div className="relative">
                            <input
                              type={showCustPassword ? 'text' : 'password'}
                              required
                              value={custPassword}
                              onChange={(e) => setCustPassword(e.target.value)}
                              placeholder="請設定登入密碼"
                              className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCustPassword(!showCustPassword)}
                              className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                            >
                              {showCustPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            再次確認密碼 *
                          </label>
                          <input
                            type={showCustPassword ? 'text' : 'password'}
                            required
                            value={custPasswordConfirm}
                            onChange={(e) => setCustPasswordConfirm(e.target.value)}
                            placeholder="再次輸入相同密碼"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {custPassword && custPasswordConfirm && custPassword !== custPasswordConfirm && (
                        <div className="text-[11px] text-rose-600 font-medium">
                          ⚠️ 兩次輸入的密碼不一致，請再次確認。
                        </div>
                      )}

                      {checkoutPassError && (
                        <div className="text-[11px] text-rose-600 font-bold">
                          ⚠️ {checkoutPassError}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Method Banner: 7-11 賣貨便 */}
                <div className="space-y-1.5 pt-3 border-t border-stone-100">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>寄件配送方式</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      免填門市
                    </span>
                  </h4>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>📦 抵台後一律開設「7-11 賣貨便」專屬免手續費賣場安排出貨</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      {settings.deliveryNotice || '商品採購抵台理貨完成後，小幫手將主動傳送專屬 7-11 賣貨便下單連結給您填寫取件門市，屆時超商取件付款運費即可，下單委託免預先填寫門市！'}
                    </p>
                  </div>
                </div>

                {/* Payment & Deposit Rules (Managed by Admin) */}
                <div className="space-y-2.5 pt-3 border-t border-stone-100">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>付款規範與金額</span>
                  </h4>

                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950">
                        {effectiveDepositRatio === 1
                          ? '💳 本賣場結帳規範：100% 全額結清'
                          : `💳 本賣場結帳規範：${Math.round(effectiveDepositRatio * 100)}% 採購訂金`}
                      </span>
                      <span className="text-[10px] bg-blue-600 text-white font-semibold px-2 py-0.5 rounded-full">
                        店家統一規範
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      {settings.depositPolicyNote || '下單成立後將立即顯示官方專屬收款帳戶，轉帳後回報末五碼即刻為您由海外買手專櫃採購！'}
                    </p>
                    <div className="pt-1.5 border-t border-blue-200 flex justify-between items-center text-xs">
                      <span className="text-blue-900">本次下單應匯款金額：</span>
                      <span className="font-mono font-black text-sm text-blue-950">
                        {formatTwd(depositPayAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Post-order payment notice */}
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>💡 收款銀行與匯款帳號將於點擊下方「送出委託單」後正式提供，送出後再行轉帳即可。</span>
                  </div>

                  {/* Order Notes */}
                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      備註需求 (選填)
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="例：希望附專櫃紙袋、若特定色號缺貨可換灰色..."
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs space-y-1">
                  <div className="flex justify-between text-stone-600">
                    <span>商品總金額 ({cartItems.length} 種品項)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatTwd(cartSubtotalTwd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>台灣本地寄件方式</span>
                    <span className="text-emerald-700 font-semibold">7-11 賣貨便 (抵台後另開賣場取件付款)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200 font-bold text-sm text-blue-950">
                    <span>本次下單應匯款 ({effectiveDepositRatio === 1 ? '全款' : `${Math.round(effectiveDepositRatio * 100)}% 訂金`})</span>
                    <span className="font-mono text-base text-blue-700">
                      {formatTwd(depositPayAmount)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>確認送出代購委託單</span>
                </button>
              </form>
            ) : (
              /* Step 2: Success Confirmation & Bank Payment Info */
              <div className="p-5 sm:p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-7 h-7 stroke-3" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">委託單已成功送出！</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    系統已建立您的專屬代購單，請於 24 小時內完成匯款以利專櫃搶購！
                  </p>
                </div>

                {newCreatedOrder && (
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                      <span className="text-stone-500">委託單號</span>
                      <strong className="font-mono text-blue-900 text-sm">
                        {newCreatedOrder.orderNo}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">訂購人</span>
                      <span className="font-medium text-slate-800">
                        {newCreatedOrder.customerName} ({newCreatedOrder.customerPhone})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">配送方式</span>
                      <span className="text-emerald-700 font-semibold">{newCreatedOrder.deliveryMethod}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-stone-200 font-bold">
                      <span className="text-slate-900">本次應轉帳金額</span>
                      <span className="font-mono text-blue-700 text-base">
                        {formatTwd(newCreatedOrder.depositRequiredTwd)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bank Account Details with Copy Button */}
                <div className="bg-amber-50/90 rounded-xl border border-amber-200 p-4 text-left text-xs text-amber-950 space-y-2 max-w-md mx-auto">
                  <div className="font-bold flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900">
                      <Building2 className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold">請匯款至官方專屬收款帳戶</span>
                    </div>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                      24 小時內完成
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white/80 p-3 rounded-lg border border-amber-200/60 text-[11px]">
                    <div>
                      銀行：<strong className="text-slate-900">{settings.receivingBank.bankCode} {settings.receivingBank.bankName}</strong>
                    </div>
                    <div>
                      戶名：<strong className="text-slate-900">{settings.receivingBank.accountHolder}</strong>
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-amber-100">
                      <div>
                        匯款帳號：<strong className="font-mono text-sm text-blue-900 tracking-wider">{settings.receivingBank.accountNo}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.receivingBank.accountNo);
                          setCopiedBankNo(true);
                          setTimeout(() => setCopiedBankNo(false), 2000);
                        }}
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedBankNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBankNo ? '已複製' : '複製帳號'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-800 leading-tight">
                    🚚 商品抵台後，店長將傳送「7-11 賣貨便」取件下單賣場給您，屆時超商取貨付款運費即可！
                  </p>
                </div>

                {/* Inline Fast Last 5 Reporting Form */}
                <div className="bg-blue-50/80 rounded-xl border border-blue-200/80 p-3.5 text-left max-w-md mx-auto space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>已完成轉帳？請填寫末五碼快速對帳：</span>
                    </label>
                  </div>

                  {step2ReportedToast ? (
                    <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{step2ReportedToast}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={5}
                        value={step2Last5}
                        onChange={(e) => setStep2Last5(e.target.value)}
                        placeholder="請填入轉帳帳號末五碼"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCreatedOrder) return;
                          if (!step2Last5.trim() || step2Last5.trim().length < 4) {
                            alert('請輸入正確的帳號末五碼 (至少 4-5 碼)');
                            return;
                          }
                          if (onReportTransferLast5) {
                            onReportTransferLast5(newCreatedOrder.orderNo, step2Last5.trim(), newCreatedOrder.depositRequiredTwd);
                          }
                          setStep2ReportedToast(`已成功回報帳號末五碼 (${step2Last5.trim()})！小幫手將在 10 分鐘內核對。`);
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        送出末五碼
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-blue-700">
                    若稍後才轉帳，亦可隨時登入前台「會員中心 / 訂單查詢」填寫回報。
                  </p>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center pt-2">
                  <button
                    onClick={handleCopyOrderSummary}
                    className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedOrderCopy ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOrderCopy ? '已複製訂單明細' : '複製訂單摘要傳 LINE'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setNewCreatedOrder(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>完成，回到商城</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal: Login & Registration */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Key className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {authTab === 'login' ? '顧客會員登入' : '註冊代購新會員'}
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate">
                    {authTab === 'login'
                      ? '輸入手機號碼與密碼，即刻一覽所有委託訂單'
                      : '設定手機號碼與專屬密碼，隨時追蹤海外採購動態'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-stone-100 bg-stone-50/50 p-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                🔐 會員密碼登入
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setRegError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'register'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                📝 註冊新帳號
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Quick Demo Autofill Banner */}
              {authTab === 'login' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-blue-950 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>快速體驗測試 (密碼: password123)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleQuickFillDemoAccount('0912-345-678')}
                      className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded text-[10px] font-bold cursor-pointer"
                    >
                      ⚡ 林欣宜 (0912-345-678)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFillDemoAccount('0933-456-789')}
                      className="px-2 py-0.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded text-[10px] font-bold cursor-pointer"
                    >
                      ⚡ 陳雅筑 (0933-456-789)
                    </button>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {authTab === 'login' ? (
                <form onSubmit={handleCustomerLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      手機電話號碼 (帳號) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="例：0912-345-678"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        會員登入密碼 *
                      </label>
                      <span className="text-[10px] text-stone-400">
                        (預設: password123)
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="請輸入您的密碼"
                        className="w-full pl-9 pr-9 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                      ⚠️ {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>登入會員並查看我的訂單</span>
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleCustomerRegister} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        收件人姓名 *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="例：王小美"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        手機號碼 (登入帳號) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="例：0988-123-456"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      LINE ID (選填，方便對帳)
                    </label>
                    <input
                      type="text"
                      value={regLine}
                      onChange={(e) => setRegLine(e.target.value)}
                      placeholder="例：xiaomei_line"
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        設定登入密碼 * (至少4碼)
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="請設定密碼"
                          className="w-full pl-3 pr-8 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        再次確認密碼 *
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPasswordConfirm}
                        onChange={(e) => setRegPasswordConfirm(e.target.value)}
                        placeholder="請再次輸入密碼"
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs flex items-center gap-2 text-emerald-900">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] leading-relaxed">
                      📦 本賣場一律開立 7-11 賣貨便寄出，註冊免填寫門市地址，抵台後小幫手將主動提供專屬取件連結！
                    </span>
                  </div>

                  {regError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                      ⚠️ {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>註冊會員並登入</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking & Member Center Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {loggedCustomer ? `會員專區 · ${loggedCustomer.name} 的委託訂單` : '顧客代購訂單進度查詢'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {loggedCustomer
                      ? `電話: ${loggedCustomer.phone} · 會員等級: ${loggedCustomer.tag}`
                      : '輸入手機與密碼登入一覽訂單，或憑單號快速查詢'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTrackingModalOpen(false);
                  if (activeMobileNav === 'orders') setActiveMobileNav('home');
                }}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 flex-1">
              {loggedCustomer ? (
                /* Logged In Customer View */
                <div className="space-y-4">
                  {/* Member Stat Strip */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-blue-950 font-bold">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>{loggedCustomer.name}</span>
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                          {loggedCustomer.tag}
                        </span>
                      </div>
                      <span className="text-stone-300">|</span>
                      <span className="text-stone-600 font-mono text-[11px]">{loggedCustomer.phone}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCustomerLogout}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>登出</span>
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setMyOrdersFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        myOrdersFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      全部訂單 ({myCustomerOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyOrdersFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        myOrdersFilter === 'active'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      進行中採購 ({activeMyOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyOrdersFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        myOrdersFilter === 'completed'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      已完成發貨 ({completedMyOrders.length})
                    </button>
                  </div>

                  {/* Orders List */}
                  {(() => {
                    const displayed =
                      myOrdersFilter === 'all'
                        ? myCustomerOrders
                        : myOrdersFilter === 'active'
                        ? activeMyOrders
                        : completedMyOrders;

                    if (displayed.length === 0) {
                      return (
                        <div className="text-center py-12 text-stone-400 space-y-2">
                          <Package className="w-10 h-10 mx-auto opacity-40 text-stone-500" />
                          <div className="font-bold text-sm text-slate-700">目前尚無相關訂單紀錄</div>
                          <p className="text-xs text-stone-400">
                            快挑選喜歡的日本、韓國或歐美連線商品加入委託購物車吧！
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {displayed.map((ord) => {
                          const statusMap: Record<string, { label: string; color: string; desc: string; step: number }> = {
                            draft: { label: '報價審核中', color: 'bg-stone-100 text-stone-700', desc: '小幫手正在核對官方庫存與定價', step: 1 },
                            pending_deposit: { label: '待付訂金', color: 'bg-amber-100 text-amber-800', desc: '等待買家轉帳訂金並回報匯款末五碼', step: 1 },
                            purchasing: { label: '海外採購中', color: 'bg-blue-100 text-blue-800', desc: '訂金已確認！買手已赴專櫃或官網下單採購', step: 3 },
                            shipped_overseas: { label: '國際空運中', color: 'bg-indigo-100 text-indigo-800', desc: '商品已完成海外集貨打包，搭乘國際航班回台', step: 4 },
                            arrived_tw: { label: '已抵台待秤重/結尾款', color: 'bg-purple-100 text-purple-800', desc: '包裹順利抵台！轉運倉正在過秤並通知收取運費尾款', step: 5 },
                            pending_balance: { label: '待付尾款運費', color: 'bg-purple-100 text-purple-800', desc: '請結清尾款與超取運費以便當日出貨寄出', step: 5 },
                            fulfilled: { label: '已發貨完成', color: 'bg-emerald-100 text-emerald-800', desc: '商品已寄出或超商待領取，感謝您的委託！', step: 6 },
                            out_of_stock: { label: '專櫃已斷貨 (辦理退款)', color: 'bg-rose-100 text-rose-800 border border-rose-300', desc: '採購小幫手巡訪專櫃確認已無庫存斷貨，已付訂金將全額退款', step: 0 },
                            cancelled: { label: '已取消', color: 'bg-rose-100 text-rose-800', desc: '本筆委託單已取消', step: 0 },
                          };

                          const cur = statusMap[ord.status] || {
                            label: ord.status,
                            color: 'bg-stone-100 text-stone-700',
                            desc: '',
                            step: 1,
                          };

                          const steps = [
                            { label: '下單建立', num: 1 },
                            { label: '訂金確認', num: 2 },
                            { label: '海外採購', num: 3 },
                            { label: '國際空運', num: 4 },
                            { label: '抵台過秤', num: 5 },
                            { label: '發貨取件', num: 6 },
                          ];

                          const activeStep = ord.status === 'pending_deposit' && ord.depositPaymentStatus === 'paid'
                            ? 2
                            : cur.step;

                          return (
                            <div
                              key={ord.id}
                              className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3.5 transition-all hover:border-stone-300"
                            >
                              {/* Order Card Header */}
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-extrabold text-sm text-blue-900">
                                      {ord.orderNo}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                      {ord.country} 專線
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-stone-400 mt-0.5">
                                    委託時間：{formatDateTime(ord.createdAt)} · 寄送：{ord.deliveryMethod}
                                  </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${cur.color}`}>
                                  {cur.label}
                                </span>
                              </div>

                              {/* 6-Step Visual Timeline (Hide if cancelled or out of stock) */}
                              {ord.status !== 'cancelled' && ord.status !== 'out_of_stock' && !ord.isOutOfStock && (
                                <div className="py-1">
                                  <div className="grid grid-cols-6 gap-1 text-center">
                                    {steps.map((st) => {
                                      const isPassed = activeStep >= st.num;
                                      const isCurrent = activeStep === st.num;
                                      return (
                                        <div key={st.num} className="flex flex-col items-center">
                                          <div
                                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                                              isCurrent
                                                ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                                                : isPassed
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-stone-100 text-stone-400'
                                            }`}
                                          >
                                            {isPassed && !isCurrent ? '✓' : st.num}
                                          </div>
                                          <span
                                            className={`text-[9px] mt-1 font-medium ${
                                              isCurrent
                                                ? 'text-blue-700 font-bold'
                                                : isPassed
                                                ? 'text-emerald-700'
                                                : 'text-stone-400'
                                            }`}
                                          >
                                            {st.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Status Explanation Card */}
                              <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                                <div className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span>即時進度說明：</span>
                                </div>
                                <div className="text-[11px] leading-relaxed text-stone-600">{cur.desc}</div>
                              </div>

                              {/* Merged Shipment Banner (Requirement 2) */}
                              {(ord.mergedShipmentNo || (ord.mergedWithOrderNos && ord.mergedWithOrderNos.length > 0)) && (
                                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
                                  <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-blue-950 text-xs">📦 已合併同箱出貨</span>
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded">
                                        合箱發貨單號：{ord.mergedShipmentNo || ord.orderNo}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-blue-800 leading-relaxed">
                                      為替您節省國內運費與包裝，小幫手已為您將此單與您的訂單
                                      {ord.mergedWithOrderNos && ord.mergedWithOrderNos.length > 0 && (
                                        <strong className="font-mono text-blue-950 mx-1">
                                          【{ord.mergedWithOrderNos.join(', ')}】
                                        </strong>
                                      )}
                                      合併同一包裹安排出貨！
                                    </p>
                                    {ord.domesticTrackingNo && (
                                      <div className="text-[11px] font-mono font-bold text-blue-900 bg-white/90 px-2 py-1 rounded inline-flex items-center gap-1.5 border border-blue-200 mt-0.5">
                                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                                        <span>台灣物流追蹤單號：{ord.domesticTrackingNo}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Out of Stock & Refund Section (Requirement 3) */}
                              {(ord.status === 'out_of_stock' || ord.isOutOfStock || (ord.refundStatus && ord.refundStatus !== 'none')) && (
                                <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5">
                                  <div className="flex items-start gap-2 text-rose-950">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-xs text-rose-950">⚠️ 商品專櫃已斷貨通知</span>
                                        {ord.refundStatus === 'refunded' ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            ✅ 已完成全額退款入帳
                                          </span>
                                        ) : ord.refundStatus === 'ready_to_refund' ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                            ⏳ 已登記退款帳號，小幫手匯款中
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                            需填寫退款銀行帳號
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                                        {ord.outOfStockReason || '很抱歉！採購小幫手前往當地專櫃採購時確認此商品已全數斷貨。若您已支付訂金將無條件全額退還給您。'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Refund Account Area for Paid Deposit */}
                                  {ord.depositPaidTwd > 0 ? (
                                    <div className="pt-2 border-t border-rose-200/80 space-y-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-rose-900 font-medium">已付訂金退款金額：</span>
                                        <span className="font-mono font-bold text-sm text-rose-700">
                                          {formatTwd(ord.refundAmountTwd || ord.depositPaidTwd)}
                                        </span>
                                      </div>

                                      {/* Case 1: Refund Already Completed */}
                                      {ord.refundStatus === 'refunded' ? (
                                        <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1">
                                          <div className="font-bold flex items-center gap-1 text-emerald-800 text-[11px]">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>全額退款已入帳完成</span>
                                          </div>
                                          <div className="text-[11px] text-stone-600">
                                            入帳銀行：{ord.refundBankInfo?.bankCode} {ord.refundBankInfo?.bankName} ({ord.refundBankInfo?.accountNo})
                                          </div>
                                          <div className="text-[11px] text-stone-600">
                                            戶名：{ord.refundBankInfo?.accountHolder}
                                            {ord.refundTransferRef && (
                                              <span className="ml-2 font-mono font-bold text-emerald-700">
                                                · 匯款序號: {ord.refundTransferRef}
                                              </span>
                                            )}
                                          </div>
                                          {ord.refundCompletedAt && (
                                            <div className="text-[10px] text-stone-400">
                                              入帳時間：{formatDateTime(ord.refundCompletedAt)}
                                            </div>
                                          )}
                                        </div>
                                      ) : ord.refundStatus === 'ready_to_refund' && editingRefundOrderId !== ord.id ? (
                                        /* Case 2: Refund Info Submitted, awaiting admin payout */
                                        <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold flex items-center gap-1 text-amber-800 text-[11px]">
                                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                                              <span>已收到您的退款銀行帳號</span>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleStartEditRefund(ord)}
                                              className="text-blue-600 hover:text-blue-800 text-[11px] font-bold underline cursor-pointer"
                                            >
                                              修改帳號
                                            </button>
                                          </div>
                                          <div className="text-[11px] text-stone-700 font-mono">
                                            {ord.refundBankInfo?.bankCode} {ord.refundBankInfo?.bankName} / 帳號: {ord.refundBankInfo?.accountNo} (戶名: {ord.refundBankInfo?.accountHolder})
                                          </div>
                                          <div className="text-[10px] text-stone-500">
                                            ⏳ 小幫手將於 1 個工作天內依序為您辦理退款轉帳，款項將全額入帳至上述帳戶。
                                          </div>
                                        </div>
                                      ) : (
                                        /* Case 3: Need to Fill in Refund Bank Info (or currently editing) */
                                        <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2.5 shadow-2xs">
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs font-bold text-rose-950 flex items-center gap-1">
                                              <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                                              <span>填寫退款銀行帳號 (全額退款 {formatTwd(ord.refundAmountTwd || ord.depositPaidTwd)})</span>
                                            </div>
                                            {editingRefundOrderId === ord.id && (
                                              <button
                                                type="button"
                                                onClick={() => setEditingRefundOrderId(null)}
                                                className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                                              >
                                                ✕ 取消修改
                                              </button>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div>
                                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                                退款銀行代碼或機構 *
                                              </label>
                                              <select
                                                value={refundBankSelect}
                                                onChange={(e) => handleBankSelectChange(e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900"
                                              >
                                                {TAIWAN_BANKS.map((b) => (
                                                  <option key={b.code} value={b.code}>
                                                    {b.code === 'other' ? b.name : `${b.code} ${b.name}`}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>

                                            {refundBankSelect === 'other' && (
                                              <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                                  自訂銀行/農會名稱與代號 *
                                                </label>
                                                <input
                                                  type="text"
                                                  required
                                                  value={refundBankName}
                                                  onChange={(e) => setRefundBankName(e.target.value)}
                                                  placeholder="例：954 草屯農會 或 006 合作金庫"
                                                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900"
                                                />
                                              </div>
                                            )}

                                            <div>
                                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                                銀行帳號 (勿填信用卡號) *
                                              </label>
                                              <input
                                                type="text"
                                                required
                                                value={refundAccountNo}
                                                onChange={(e) => setRefundAccountNo(e.target.value)}
                                                placeholder="請輸入純數字銀行帳號"
                                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono text-slate-900"
                                              />
                                            </div>

                                            <div>
                                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                                戶名 (需與銀行開戶完全相符) *
                                              </label>
                                              <input
                                                type="text"
                                                required
                                                value={refundAccountHolder}
                                                onChange={(e) => setRefundAccountHolder(e.target.value)}
                                                placeholder="例：王小明"
                                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900"
                                              />
                                            </div>

                                            <div className="sm:col-span-2">
                                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                                退款備註 (選填)
                                              </label>
                                              <input
                                                type="text"
                                                value={refundNote}
                                                onChange={(e) => setRefundNote(e.target.value)}
                                                placeholder="例：跨行手續費由賣方負擔"
                                                className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex justify-end pt-1">
                                            <button
                                              type="button"
                                              onClick={() => handleSubmitCustomerRefundInfo(ord)}
                                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                              <span>送出退款銀行帳號</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-stone-500 pt-1">
                                      💡 此筆委託單尚未支付訂金，因此不需填寫退款帳戶，歡迎挑選其他連線商品重新下單。
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Order Items list */}
                              <div className="space-y-1.5 pt-1">
                                <div className="text-[11px] font-bold text-slate-800">商品清單：</div>
                                <div className="space-y-1.5 bg-stone-50/50 p-2.5 rounded-xl border border-stone-200/60">
                                  {ord.items.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs gap-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0">
                                          <ProductImage
                                            src={it.imageUrl || (it.images && it.images[0])}
                                            alt={it.name}
                                            country={it.country}
                                            category={it.category}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-slate-900 truncate text-[11px]">
                                            {it.name}
                                          </div>
                                          <div className="text-[10px] text-stone-400 flex items-center gap-1.5 flex-wrap">
                                            {it.spec && <span>規格: {it.spec}</span>}
                                            <span>數量: {it.quantity}</span>
                                            {it.purchaseStatus === 'out_of_stock' ? (
                                              <span className="text-rose-700 bg-rose-100 font-bold px-1.5 py-0.2 rounded text-[10px]">
                                                ⚠️ 專櫃已斷貨
                                              </span>
                                            ) : it.isSecondStageFreight ? (
                                              <span className="text-amber-700">需二補</span>
                                            ) : (
                                              <span className="text-emerald-700">一口價免二補</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="font-mono font-bold text-slate-900 text-xs shrink-0">
                                        {formatTwd(it.subtotalTwd)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Amounts & Payment Status */}
                              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200/60">
                                  <div className="text-[10px] text-stone-500">
                                    第一階段訂金 / 一口價
                                  </div>
                                  <div className="font-mono font-bold text-sm text-blue-900 mt-0.5">
                                    {formatTwd(ord.depositRequiredTwd)}
                                  </div>
                                  <div className="mt-1">
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                        ord.depositPaymentStatus === 'paid'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : ord.depositPaymentStatus === 'verifying'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {ord.depositPaymentStatus === 'paid'
                                        ? '✅ 已付清'
                                        : ord.depositPaymentStatus === 'verifying'
                                        ? '⏳ 核銷對帳中'
                                        : '⚠️ 待轉帳'}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                                  <div className="text-[10px] text-stone-500">
                                    第二階段尾款與運費
                                  </div>
                                  <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">
                                    {formatTwd(ord.balanceRequiredTwd || 0)}
                                  </div>
                                  <div className="mt-1">
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                        ord.balancePaymentStatus === 'paid'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : ord.balancePaymentStatus === 'verifying'
                                          ? 'bg-amber-100 text-amber-800'
                                          : ord.balanceRequiredTwd > 0
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-stone-100 text-stone-500'
                                      }`}
                                    >
                                      {ord.balancePaymentStatus === 'paid'
                                        ? '✅ 已結清'
                                        : ord.balancePaymentStatus === 'verifying'
                                        ? '⏳ 核銷中'
                                        : ord.balanceRequiredTwd > 0
                                        ? '待結尾款'
                                        : '無尾款 (已結清)'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Logistics tracking codes if available */}
                              {(ord.overseasTrackingNo || ord.domesticTrackingNo) && (
                                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-200/80 text-xs space-y-1">
                                  {ord.overseasTrackingNo && (
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-indigo-900 font-medium">✈️ 國際物流提單：</span>
                                      <strong className="font-mono text-indigo-950 font-bold">
                                        {ord.overseasTrackingNo}
                                      </strong>
                                    </div>
                                  )}
                                  {ord.domesticTrackingNo && (
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-blue-900 font-medium">📦 台灣物流單號：</span>
                                      <strong className="font-mono text-blue-950 font-bold">
                                        {ord.domesticTrackingNo}
                                      </strong>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Bar: Report Bank Last 5 & Copy summary */}
                              <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                                {(ord.depositPaymentStatus === 'unpaid' ||
                                  ord.balancePaymentStatus === 'unpaid') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReportLast5ModalOrder(ord);
                                      setInputLast5('');
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>回報匯款後五碼</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const bank = settings.receivingBank;
                                    const text = `📦【GlobalProxy 連線代購 - 訂單查詢】\n單號：${ord.orderNo}\n訂購人：${ord.customerName} (${ord.customerPhone})\n目前狀態：${cur.label}\n應付金額：${formatTwd(ord.depositRequiredTwd)}\n匯款銀行：${bank.bankCode} ${bank.bankName}\n帳號：${bank.accountNo} (${bank.accountHolder})`;
                                    navigator.clipboard.writeText(text);
                                    alert('已複製訂單狀態摘要，可直接傳送給 LINE 小幫手！');
                                  }}
                                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>複製摘要傳 LINE</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Not Logged In View - Tabs for Login or Quick Search */
                <div className="space-y-4">
                  <div className="flex border-b border-stone-200 p-1 bg-stone-50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTrackingTab('my_orders')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        trackingTab === 'my_orders'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      🔐 會員密碼登入查單
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingTab('quick_search');
                        setTrackingSubmitted(false);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        trackingTab === 'quick_search'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      🔍 免密碼快速查單
                    </button>
                  </div>

                  {trackingTab === 'my_orders' ? (
                    /* Inline Login for tracking */
                    <div className="space-y-4 pt-1">
                      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-blue-950 font-bold text-[11px]">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>示範帳號一鍵登入 (密碼: password123)</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleQuickFillDemoAccount('0912-345-678')}
                            className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <span>⚡ 林欣宜</span>
                            <span className="text-[10px] text-blue-600 font-normal">(多筆抵台/合併出貨)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickFillDemoAccount('0933-456-789')}
                            className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <span>⚡ 陳雅筑</span>
                            <span className="text-[10px] text-rose-600 font-normal">(商品斷貨/填寫退款)</span>
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleCustomerLogin} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            手機電話 (登入帳號) *
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                            <input
                              type="tel"
                              required
                              value={loginPhone}
                              onChange={(e) => setLoginPhone(e.target.value)}
                              placeholder="例：0912-345-678"
                              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-800">
                              會員登入密碼 *
                            </label>
                            <span className="text-[10px] text-stone-400">(預設: password123)</span>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                            <input
                              type={showLoginPassword ? 'text' : 'password'}
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="請輸入您的密碼"
                              className="w-full pl-9 pr-9 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                            >
                              {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {loginError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                            ⚠️ {loginError}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>登入並顯示我的所有訂單</span>
                          </button>
                        </div>
                      </form>

                      <div className="text-center pt-2 border-t border-stone-100 text-xs text-stone-500">
                        還沒有會員帳號？{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAuthModalOpen(true);
                            setAuthTab('register');
                            setIsTrackingModalOpen(false);
                          }}
                          className="text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          立即免費註冊
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Quick Search by Order Number / Phone */
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={trackingQuery}
                            onChange={(e) => setTrackingQuery(e.target.value)}
                            placeholder="輸入手機號碼 (例：0912...) 或委託單號 (GP-...)"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setTrackingSubmitted(true)}
                          className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          查詢
                        </button>
                      </div>

                      {/* Results */}
                      {trackingSubmitted && (
                        <div className="space-y-3 pt-2 border-t border-stone-100">
                          {trackingResults.length === 0 ? (
                            <div className="text-center py-8 text-stone-400">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs font-medium text-stone-600">查無相關訂單資料</p>
                              <p className="text-[11px] text-stone-400 mt-0.5">
                                請確認輸入的手機電話或委託單號是否正確
                              </p>
                            </div>
                          ) : (
                            trackingResults.map((ord) => (
                              <div
                                key={ord.id}
                                className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-mono font-bold text-xs text-blue-900">
                                      {ord.orderNo}
                                    </div>
                                    <div className="text-[10px] text-stone-500">
                                      下單時間：{formatDateTime(ord.createdAt)} · 訂購人: {ord.customerName}
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                      ord.status === 'out_of_stock'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : ord.status === 'fulfilled'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ord.status === 'arrived_tw'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {ord.status === 'out_of_stock'
                                      ? '專櫃已斷貨'
                                      : ord.status === 'arrived_tw'
                                      ? '已抵台待出貨'
                                      : ord.status === 'fulfilled'
                                      ? '已完成出貨'
                                      : ord.status === 'purchasing'
                                      ? '海外採購中'
                                      : ord.status === 'shipped_overseas'
                                      ? '國際空運中'
                                      : ord.status === 'pending_deposit'
                                      ? '待付訂金'
                                      : ord.status}
                                  </span>
                                </div>

                                {/* Merged shipment tag if applicable */}
                                {(ord.mergedShipmentNo || (ord.mergedWithOrderNos && ord.mergedWithOrderNos.length > 0)) && (
                                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-950 flex items-center justify-between">
                                    <span className="font-bold">📦 已合併同箱出貨</span>
                                    <span className="font-mono text-blue-800">
                                      合箱單號: {ord.mergedShipmentNo || ord.orderNo}
                                    </span>
                                  </div>
                                )}

                                {/* Out of stock alert in quick search */}
                                {(ord.status === 'out_of_stock' || ord.isOutOfStock) && (
                                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-950 space-y-1">
                                    <div className="font-bold flex items-center gap-1 text-rose-800">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>專櫃已確認無庫存斷貨</span>
                                    </div>
                                    <p className="text-rose-700 text-[10px]">
                                      {ord.outOfStockReason || '海外專櫃與通路現貨已售罄，無法採購此商品。'}
                                    </p>
                                    {ord.depositPaidTwd > 0 && (
                                      <div className="pt-1 text-slate-800 font-medium">
                                        {ord.refundStatus === 'refunded' ? (
                                          <span className="text-emerald-700 font-bold">✅ 訂金 {formatTwd(ord.refundAmountTwd || ord.depositPaidTwd)} 已全額退回入帳</span>
                                        ) : ord.refundStatus === 'ready_to_refund' ? (
                                          <span className="text-amber-800 font-bold">⏳ 已登記退款帳號，小幫手正安排匯款退還 {formatTwd(ord.refundAmountTwd || ord.depositPaidTwd)}</span>
                                        ) : (
                                          <div className="flex items-center justify-between gap-2 pt-1">
                                            <span className="text-rose-800 font-bold text-[10px]">
                                              可全額退款 {formatTwd(ord.refundAmountTwd || ord.depositPaidTwd)}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setTrackingTab('my_orders');
                                                setLoginPhone(ord.customerPhone);
                                              }}
                                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                            >
                                              登入填寫退款帳號
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Items summary */}
                                <div className="space-y-1 text-xs bg-white p-2.5 rounded-lg border border-stone-200">
                                  {ord.items.map((it, i) => (
                                    <div key={i} className="flex justify-between text-slate-700 text-[11px]">
                                      <span className="truncate max-w-[240px]">
                                        • {it.name} {it.spec ? `(${it.spec})` : ''} × {it.quantity}
                                        {it.purchaseStatus === 'out_of_stock' && (
                                          <span className="text-rose-600 font-bold ml-1">· 已斷貨</span>
                                        )}
                                      </span>
                                      <span className="font-mono">{formatTwd(it.subtotalTwd)}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Report button */}
                                {(ord.depositPaymentStatus === 'unpaid' || ord.status === 'pending_deposit') && (
                                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                                    <span className="text-[11px] text-amber-800">
                                      應轉帳金額：<strong>{formatTwd(ord.depositRequiredTwd)}</strong>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReportLast5ModalOrder(ord);
                                        setInputLast5('');
                                      }}
                                      className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                      填寫匯款末五碼
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-modal: Report Bank Last 5 */}
              {reportLast5ModalOrder && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-blue-950 flex items-center gap-1">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>回報單號【{reportLast5ModalOrder.orderNo}】匯款末五碼</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReportLast5ModalOrder(null)}
                      className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-[11px] text-blue-900 space-y-0.5">
                    <div>銀行：{settings.receivingBank.bankCode} {settings.receivingBank.bankName}</div>
                    <div>帳號：<strong className="font-mono font-bold text-blue-950">{settings.receivingBank.accountNo}</strong></div>
                    <div>戶名：{settings.receivingBank.accountHolder}</div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      maxLength={5}
                      value={inputLast5}
                      onChange={(e) => setInputLast5(e.target.value)}
                      placeholder="請輸入轉帳銀行末五碼 (5 位數字)"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleReportFromTracking}
                      className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      送出對帳
                    </button>
                  </div>
                  {last5SubmittedToast && (
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>已成功送出末五碼！管理員將立即查帳核銷。</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button for Mobile (Shows if cart has items) */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-20 right-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg font-bold text-xs cursor-pointer animate-bounce"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>購物車 ({totalCartCount})</span>
            <span className="font-mono">{formatTwd(cartSubtotalTwd)}</span>
          </button>
        </div>
      )}

      {/* Refund Success Toast */}
      {refundSuccessToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-5 py-3 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 border border-emerald-400/40 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{refundSuccessToast}</span>
        </div>
      )}

      {/* Added Toast */}
      {addedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>已成功加入委託購物車！</span>
        </div>
      )}

      {/* Wish Submitted Toast */}
      {wishSubmittedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-amber-950 text-amber-100 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-amber-500/40 animate-fade-in max-w-md text-center">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{wishSubmittedToast}</span>
        </div>
      )}

      {/* Wish / Photo Quote Request Modal */}
      {isWishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">✨ 許願池 · 傳圖估價與尋貨委託</h3>
                  <p className="text-[11px] text-amber-800">
                    貼上想找的海外商品圖片或官網網址，小幫手專人採購為您連線報價
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWishModalOpen(false);
                  if (activeMobileNav === 'wish') setActiveMobileNav('home');
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-amber-100/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wish Modal Tabs */}
            <div className="flex items-center border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setWishModalTab('submit')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  wishModalTab === 'submit'
                    ? 'border-amber-600 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>我要填單許願</span>
              </button>
              <button
                type="button"
                onClick={() => setWishModalTab('history')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  wishModalTab === 'history'
                    ? 'border-amber-600 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>我的許願紀錄 ({myCustomerWishes.length})</span>
                {pendingWishesCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>

            {wishModalTab === 'history' ? (
              <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
                {!loggedCustomer ? (
                  <div className="text-center py-8 space-y-3">
                    <User className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-600">請先登入會員，即可查看您的專屬許願與店家報價進度</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWishModalOpen(false);
                        setIsAuthModalOpen(true);
                        setAuthTab('login');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      立即登入會員帳號
                    </button>
                  </div>
                ) : myCustomerWishes.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-stone-700 font-bold">您目前尚無許願尋貨紀錄</p>
                    <p className="text-[11px] text-stone-500">貼上想找的海外商品圖片與說明，小幫手將為您連線估價！</p>
                    <button
                      type="button"
                      onClick={() => setWishModalTab('submit')}
                      className="px-4 py-1.5 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs mt-2 cursor-pointer hover:bg-amber-600 transition-colors"
                    >
                      立即填寫許願單
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myCustomerWishes.map((w) => (
                      <div key={w.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 text-sm">{w.productName}</div>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap ${
                              w.status === 'quoted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : w.status === 'converted'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : w.status === 'rejected'
                                ? 'bg-stone-200 text-stone-700'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {w.status === 'quoted'
                              ? '已專人報價'
                              : w.status === 'converted'
                              ? '已轉正式代購'
                              : w.status === 'rejected'
                              ? '專櫃斷貨未購得'
                              : '專人尋貨估價中'}
                          </span>
                        </div>

                        {w.imageUrl && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 bg-white">
                            <img src={w.imageUrl} alt={w.productName} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                          <div>採購國家：<span className="font-bold text-slate-800">{w.country}</span></div>
                          {w.budgetTwd && <div>期望預算：<span className="font-mono font-bold text-slate-800">{formatTwd(w.budgetTwd)}</span></div>}
                          <div>提單時間：<span className="text-stone-400">{formatDateTime(w.createdAt)}</span></div>
                          {w.quotedPriceTwd && (
                            <div className="text-emerald-700 font-bold">
                              專人報價：<span className="font-mono text-sm">{formatTwd(w.quotedPriceTwd)}</span>
                            </div>
                          )}
                        </div>

                        {w.specNote && (
                          <div className="text-[11px] text-stone-600 bg-white p-2 rounded-lg border border-stone-200/80">
                            規格需求：{w.specNote}
                          </div>
                        )}

                        {w.adminNote && (
                          <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                            店家回覆：{w.adminNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitWish} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                  {settings.wishlistNotice || '💡 溫馨提示：請儘量提供清晰圖片與商品名稱/色號，我們會在專櫃現場巡查時以特惠甜甜價回覆您的許願！'}
                </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  欲尋找的商品名稱 / 品牌描述 *
                </label>
                <input
                  type="text"
                  required
                  value={wishProductName}
                  onChange={(e) => setWishProductName(e.target.value)}
                  placeholder="例：Chiikawa 魔法少女娃娃 (小八貓)"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    欲代購國家
                  </label>
                  <select
                    value={wishCountry}
                    onChange={(e) => setWishCountry(e.target.value as Currency)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-bold"
                  >
                    <option value="JPY">🇯🇵 日本</option>
                    <option value="KRW">🇰🇷 韓國</option>
                    <option value="CNY">🇨🇳 中國</option>
                    <option value="USD">🇺🇸 美國</option>
                    <option value="EUR">🇪🇺 歐洲</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    希望預算 (台幣 TWD, 選填)
                  </label>
                  <input
                    type="number"
                    value={wishBudget}
                    onChange={(e) => setWishBudget(e.target.value ? Number(e.target.value) : '')}
                    placeholder="例：1200"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  商品圖片網址 (貼上圖片網址，或用免費圖床)
                </label>
                <div className="relative">
                  <Camera className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={wishImageUrl}
                    onChange={(e) => setWishImageUrl(e.target.value)}
                    placeholder="例：https://images.unsplash.com/... 或 IG/小紅書圖連結"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                {wishImageUrl && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-amber-200 bg-stone-100 relative">
                    <img src={wishImageUrl} alt="預覽" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  參考網址 (官網或商品頁連結)
                </label>
                <input
                  type="url"
                  value={wishRefUrl}
                  onChange={(e) => setWishRefUrl(e.target.value)}
                  placeholder="例：https://store.example.com/item/123"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  規格與備註需求 (色號/尺寸/數量)
                </label>
                <textarea
                  rows={2}
                  value={wishSpecNote}
                  onChange={(e) => setWishSpecNote(e.target.value)}
                  placeholder="例：藍色 M 號 * 1，如果是粉色也可以代購"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="text-xs font-bold text-slate-900">聯絡資訊 (以便管理員提供甜甜價報價)</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      您的稱呼/姓名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={wishCustName}
                      onChange={(e) => setWishCustName(e.target.value)}
                      placeholder="例：王小美"
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      手機號碼 *
                    </label>
                    <input
                      type="tel"
                      required
                      value={wishCustPhone}
                      onChange={(e) => setWishCustPhone(e.target.value)}
                      placeholder="例：0988-123-456"
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {settings.customRegFieldLabel || 'LINE 社群/社團顯示暱稱'}
                  </label>
                  <input
                    type="text"
                    value={wishCommunityName}
                    onChange={(e) => setWishCommunityName(e.target.value)}
                    placeholder={settings.customRegFieldPlaceholder || '例：小美 (LINE 社團暱稱)'}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>確認送出許願尋貨單</span>
                </button>
              </div>
            </form>
          )}
          </div>
        </div>
      )}

      {/* Customer Personal Center Modal ("我的" 個人中心) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Profile Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md text-base">
                  {loggedCustomer ? loggedCustomer.name.slice(0, 1) : <User className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      {loggedCustomer ? loggedCustomer.name : '顧客個人中心'}
                    </h3>
                    {loggedCustomer ? (
                      <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                        {loggedCustomer.tag}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-stone-700 text-stone-300 px-2 py-0.5 rounded-full font-medium">
                        尚未登入
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {loggedCustomer ? (
                      <span className="font-mono">{loggedCustomer.phone}</span>
                    ) : (
                      '登入即可隨時查詢訂單進度、付款紀錄與專屬優惠'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  if (activeMobileNav === 'profile') setActiveMobileNav('home');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Stats Ribbon */}
            {loggedCustomer && (
              <div className="grid grid-cols-3 bg-blue-950/90 text-white border-t border-blue-900/40 divide-x divide-blue-800/50 py-2.5 px-3 text-center shrink-0">
                <div>
                  <div className="text-[10px] text-blue-200">委託訂單數</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {myCustomerOrders.length} <span className="text-[10px] font-normal text-blue-200">筆</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-blue-200">進行中採購</div>
                  <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                    {activeMyOrders.length} <span className="text-[10px] font-normal text-blue-200">筆</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-blue-200">累計代購額</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {formatTwd(loggedCustomer.totalSpentTwd || 0)}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* If Not Logged In Notice Card */}
              {!loggedCustomer && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col items-center text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">歡迎登入 Enjoy 代購會員</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 max-w-xs">
                      登入後可隨時查看委託單採購進度、二補運費、回報轉帳後五碼與許願紀錄
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsAuthModalOpen(true);
                      setAuthTab('login');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>立即登入 / 註冊新會員</span>
                  </button>
                </div>
              )}

              {/* 1. 個人資料 (Profile Details) */}
              {loggedCustomer && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>會員個人資料</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      編號: {loggedCustomer.customerCode || loggedCustomer.id.slice(0, 10)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                      <div className="text-[10px] text-stone-500">真實姓名</div>
                      <div className="font-bold text-slate-900 mt-0.5">{loggedCustomer.name}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                      <div className="text-[10px] text-stone-500">聯絡電話</div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">{loggedCustomer.phone}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                      <div className="text-[10px] text-stone-500">LINE ID</div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">{loggedCustomer.lineId || '未設定'}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                      <div className="text-[10px] text-stone-500">{settings.customRegFieldLabel || '社群顯示名稱'}</div>
                      <div className="font-bold text-blue-900 mt-0.5">{loggedCustomer.communityName || '未填寫'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 收件資料 (Delivery info) */}
              {loggedCustomer && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>預設收件資料</span>
                    </div>
                    {!isEditingDelivery ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingDelivery(true)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>修改</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingDelivery(false)}
                        className="text-[11px] text-stone-500 hover:text-stone-700 font-medium cursor-pointer"
                      >
                        取消
                      </button>
                    )}
                  </div>

                  {deliverySavedToast && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>收件資料已成功更新儲存！</span>
                    </div>
                  )}

                  {!isEditingDelivery ? (
                    <div className="bg-white p-3 rounded-xl border border-stone-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {loggedCustomer.delivery?.type === '7-11'
                            ? '7-11 超商取貨'
                            : loggedCustomer.delivery?.type === 'family'
                            ? '全家便利商店'
                            : '黑貓/郵局宅配到府'}
                        </span>
                        {loggedCustomer.delivery?.storeName && (
                          <span className="font-bold text-slate-900">{loggedCustomer.delivery.storeName}</span>
                        )}
                        {loggedCustomer.delivery?.storeCode && (
                          <span className="font-mono text-stone-500">({loggedCustomer.delivery.storeCode})</span>
                        )}
                      </div>
                      {loggedCustomer.delivery?.address && (
                        <div className="text-stone-600 pt-1 text-[11px]">
                          地址：{loggedCustomer.delivery.address}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">取件方式</label>
                        <select
                          value={editDeliveryType}
                          onChange={(e) => setEditDeliveryType(e.target.value as '7-11' | 'family' | 'home')}
                          className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-slate-900 font-bold"
                        >
                          <option value="7-11">7-11 超商取貨</option>
                          <option value="family">全家 超商取貨</option>
                          <option value="home">宅配到府</option>
                        </select>
                      </div>
                      {editDeliveryType !== 'home' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">門市名稱</label>
                            <input
                              type="text"
                              value={editStoreName}
                              onChange={(e) => setEditStoreName(e.target.value)}
                              placeholder="例：敦南門市"
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">門市店號 (6碼)</label>
                            <input
                              type="text"
                              value={editStoreCode}
                              onChange={(e) => setEditStoreCode(e.target.value)}
                              placeholder="例：991182"
                              className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">宅配收件地址</label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="請填寫完整收件地址"
                            className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingDelivery(false)}
                          className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDeliveryInfo}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                        >
                          儲存收件設定
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. 我的訂單 (Quick Portal) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>我的代購訂單</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsTrackingModalOpen(true);
                      setTrackingTab(loggedCustomer ? 'my_orders' : 'quick_search');
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{loggedCustomer ? '查看全部訂單' : '免登入查單'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200/80 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-stone-500 text-[11px]">目前進行中代購</div>
                    <div className="font-bold text-slate-900">
                      {activeMyOrders.length > 0 ? (
                        <span className="text-amber-600">{activeMyOrders.length} 筆訂單採購/轉運中</span>
                      ) : (
                        <span className="text-stone-500">目前無進行中訂單</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsTrackingModalOpen(true);
                      setTrackingTab(loggedCustomer ? 'my_orders' : 'quick_search');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    開啟訂單進度
                  </button>
                </div>
              </div>

              {/* 4. 付款紀錄 (Payment Summary) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>付款紀錄與匯款資訊</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] border-b border-stone-100 pb-2">
                    <span className="text-stone-500">已付訂金總額</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatTwd(myCustomerOrders.reduce((acc, o) => acc + (o.depositPaidTwd || 0), 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">已結清尾款總額</span>
                    <span className="font-mono font-bold text-blue-600">
                      {formatTwd(myCustomerOrders.reduce((acc, o) => acc + (o.balancePaidTwd || 0), 0))}
                    </span>
                  </div>
                  {settings.receivingBank && (
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <div className="text-stone-600">
                        收款：{settings.receivingBank.bankName} (<span className="font-mono">{settings.receivingBank.accountNo}</span>)
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.receivingBank.accountNo);
                          alert('已複製收款帳號！');
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>複製</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. 商品許願紀錄 (Wish History) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>商品許願與尋貨紀錄</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      handleOpenWishModal();
                      setWishModalTab('submit');
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ 新增許願</span>
                  </button>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200/80 text-xs space-y-2">
                  {myCustomerWishes.length > 0 ? (
                    <div className="space-y-2">
                      {myCustomerWishes.slice(0, 3).map((w) => (
                        <div key={w.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate max-w-[200px]">{w.productName}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                w.status === 'quoted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : w.status === 'converted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {w.status === 'quoted'
                                ? `已報價 ${formatTwd(w.quotedPriceTwd || 0)}`
                                : w.status === 'converted'
                                ? '已轉代購'
                                : '專人尋貨中'}
                            </span>
                          </div>
                          {w.adminNote && (
                            <div className="text-[11px] text-stone-600 bg-white p-2 rounded border border-stone-200/60 mt-1">
                              店家回覆：{w.adminNote}
                            </div>
                          )}
                        </div>
                      ))}
                      {myCustomerWishes.length > 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileModalOpen(false);
                            handleOpenWishModal();
                            setWishModalTab('history');
                          }}
                          className="w-full text-center text-xs text-amber-700 font-bold hover:underline pt-1 cursor-pointer"
                        >
                          查看全部 {myCustomerWishes.length} 筆許願紀錄 →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-stone-400 text-xs">
                      尚無許願紀錄，有想買的商品歡迎傳圖給我們報價！
                    </div>
                  )}
                </div>
              </div>

              {/* 6. 客服／常見問題 (FAQ) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>常見問題與客服協助</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {[
                    {
                      q: '什麼是「一口價」？後續還需要補繳二補費用嗎？',
                      a: '本站標示之一口價已全額包含海外專櫃商品售價與國際空運費，絕大部分商品無須二次補款！少數體積過大特大件商品如有特別標註「需二補」，才會在抵台後秤重計算。',
                    },
                    {
                      q: '下單海外代購後，大約需要多久收到包裹？',
                      a: '現貨商品約 2~3 個工作天出貨；海外預購商品下單後，專人採購安排空運抵台約 7~14 個工作天，抵台後立即開設賣貨便或安排宅配寄送。',
                    },
                    {
                      q: '專櫃缺貨斷貨時，該如何申請退款？',
                      a: '若專櫃或官網斷貨未購得，小幫手將主動將訂單標記斷貨，顧客可在訂單詳情填寫退款銀行帳號，我們將在 1 個工作天內 100% 全額匯款退款，免扣手續費！',
                    },
                  ].map((faq, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-stone-200/80 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                        className="w-full p-2.5 text-left font-bold text-slate-800 text-[11px] flex items-center justify-between cursor-pointer hover:bg-stone-50"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${expandedFaqIndex === idx ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedFaqIndex === idx && (
                        <div className="p-2.5 bg-stone-50/70 border-t border-stone-100 text-[11px] text-stone-600 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. 登入／登出 (Login / Logout Action) */}
              <div className="pt-2">
                {loggedCustomer ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleCustomerLogout();
                      setIsProfileModalOpen(false);
                      setActiveMobileNav('home');
                    }}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>登出會員帳號</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsAuthModalOpen(true);
                      setAuthTab('login');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>會員登入 / 免費註冊</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storefront Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-8 pb-28 md:pb-8 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{settings.shopName || 'GlobalProxy 連線代購'}</span>
            <span>· {settings.shopSubtitle || '專櫃直購 · 正品保證'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsTrackingModalOpen(true);
                setTrackingSubmitted(false);
              }}
              className="hover:text-blue-600 cursor-pointer"
            >
              訂單進度查詢
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={onSwitchToAdmin}
              className="text-blue-600 hover:underline cursor-pointer font-medium"
            >
              登入管理工作台
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (5 Shortcuts: 首頁, 找商品, 我的訂單, 商品許願, 我的) */}
      <nav
        aria-label="手機端快捷導覽列"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 transition-all"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* 1. 首頁 */}
          <button
            type="button"
            onClick={handleMobileNavHome}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              activeMobileNav === 'home' && !isProfileModalOpen && !isTrackingModalOpen && !isWishModalOpen
                ? 'text-blue-600 font-bold'
                : 'text-stone-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Home className={`w-5 h-5 transition-transform ${activeMobileNav === 'home' && !isProfileModalOpen && !isTrackingModalOpen && !isWishModalOpen ? 'scale-110' : ''}`} />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">首頁</span>
            {activeMobileNav === 'home' && !isProfileModalOpen && !isTrackingModalOpen && !isWishModalOpen && (
              <span className="w-5 h-0.5 bg-blue-600 rounded-full mt-0.5" />
            )}
          </button>

          {/* 2. 找商品 */}
          <button
            type="button"
            onClick={handleMobileNavProducts}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              activeMobileNav === 'products' && !isProfileModalOpen && !isTrackingModalOpen && !isWishModalOpen
                ? 'text-blue-600 font-bold'
                : 'text-stone-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Search className={`w-5 h-5 transition-transform ${activeMobileNav === 'products' && !isProfileModalOpen && !isTrackingModalOpen && !isWishModalOpen ? 'scale-110' : ''}`} />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">找商品</span>
            {activeMobileNav === 'products' && !isProfileModalOpen && !isTrackingModalOpen && !isWishModalOpen && (
              <span className="w-5 h-0.5 bg-blue-600 rounded-full mt-0.5" />
            )}
          </button>

          {/* 3. 我的訂單 */}
          <button
            type="button"
            onClick={handleMobileNavOrders}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              isTrackingModalOpen || activeMobileNav === 'orders'
                ? 'text-blue-600 font-bold'
                : 'text-stone-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Package className={`w-5 h-5 transition-transform ${isTrackingModalOpen || activeMobileNav === 'orders' ? 'scale-110' : ''}`} />
              {activeMyOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {activeMyOrders.length > 99 ? '99+' : activeMyOrders.length}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">我的訂單</span>
            {(isTrackingModalOpen || activeMobileNav === 'orders') && (
              <span className="w-5 h-0.5 bg-blue-600 rounded-full mt-0.5" />
            )}
          </button>

          {/* 4. 商品許願 */}
          <button
            type="button"
            onClick={handleMobileNavWish}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              isWishModalOpen || activeMobileNav === 'wish'
                ? 'text-amber-600 font-bold'
                : 'text-stone-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Sparkles className={`w-5 h-5 transition-transform ${isWishModalOpen || activeMobileNav === 'wish' ? 'scale-110 text-amber-500' : ''}`} />
              {pendingWishesCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {pendingWishesCount > 99 ? '99+' : pendingWishesCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">商品許願</span>
            {(isWishModalOpen || activeMobileNav === 'wish') && (
              <span className="w-5 h-0.5 bg-amber-600 rounded-full mt-0.5" />
            )}
          </button>

          {/* 5. 我的 */}
          <button
            type="button"
            onClick={handleMobileNavProfile}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
              isProfileModalOpen || activeMobileNav === 'profile'
                ? 'text-blue-600 font-bold'
                : 'text-stone-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <User className={`w-5 h-5 transition-transform ${isProfileModalOpen || activeMobileNav === 'profile' ? 'scale-110' : ''}`} />
              {loggedCustomer && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">我的</span>
            {(isProfileModalOpen || activeMobileNav === 'profile') && (
              <span className="w-5 h-0.5 bg-blue-600 rounded-full mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};
