import {
  Currency,
  Customer,
  Order,
  PaymentRecord,
  SystemSettings,
  CatalogProduct,
  StaffUser,
  WishRequest,
} from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  shopName: 'GlobalProxy 連線代購',
  shopSubtitle: '日本・韓國・歐美 專櫃直購 正品保證',
  customRegFieldLabel: 'LINE 社群/社團顯示暱稱',
  isCustomRegFieldRequired: false,
  customRegFieldPlaceholder: '例如：威廉-台北VIP群、Jessica (社團暱稱)',
  enableWishlistArea: true,
  wishlistNotice: '貼上想要代購的商品照片、官網或小紅書連結，小幫手將於專櫃現場為您即時算價與回覆專屬報價！',
  heroBadgeText: '本期現場連線中',
  heroTitle: '日本吉卜力、Chiikawa、韓國東大門服飾現場連線中！',
  heroDescription: '✨ 價格透明化：商品皆標示「一口價（已含國際空運，免二補）」，直接確認台幣售價！ 下單後專人於海外專櫃/官網採購，抵台直接超商取貨或宅配到府。',
  heroFeature1: '一口價免二次催補款',
  heroFeature2: '支援 7-11 / 全家超取',
  heroFeature3: '全程訂單進度即時追蹤',
  depositPaymentPolicy: 'deposit_50',
  customDepositRatio: 0.5,
  depositPolicyNote: '全館代購委託採『兩階段付款』收取 50% 訂金，抵台後開立「7-11 賣貨便」賣場收取尾款與安排寄出。',
  deliveryNotice: '商品抵台後，店主將主動透過 LINE / 手機簡訊為您開設專屬「7-11 賣貨便」賣場完成下單寄出，結帳時不需填寫超商門市。',
  customCountries: [
    {
      currency: 'JPY',
      name: '日本連線',
      symbol: '¥',
      flag: '🇯🇵',
      baseRate: 0.212,
      quoteRate: 0.228,
      airFreightPerKg: 240,
      serviceFeePercent: 8,
      minServiceFeeTwd: 100,
      isActive: true,
    },
    {
      currency: 'KRW',
      name: '韓國東大門',
      symbol: '₩',
      flag: '🇰🇷',
      baseRate: 0.024,
      quoteRate: 0.0265,
      airFreightPerKg: 200,
      serviceFeePercent: 10,
      minServiceFeeTwd: 120,
      isActive: true,
    },
    {
      currency: 'CNY',
      name: '中國專櫃/旗艦店',
      symbol: '¥',
      flag: '🇨🇳',
      baseRate: 4.45,
      quoteRate: 4.85,
      airFreightPerKg: 120,
      serviceFeePercent: 8,
      minServiceFeeTwd: 100,
      isActive: true,
    },
    {
      currency: 'USD',
      name: '美國官網/Outlet',
      symbol: '$',
      flag: '🇺🇸',
      baseRate: 31.8,
      quoteRate: 33.2,
      airFreightPerKg: 280,
      serviceFeePercent: 8,
      minServiceFeeTwd: 150,
      isActive: false,
    },
    {
      currency: 'EUR',
      name: '歐洲專櫃精品',
      symbol: '€',
      flag: '🇪🇺',
      baseRate: 34.2,
      quoteRate: 35.8,
      airFreightPerKg: 350,
      serviceFeePercent: 7,
      minServiceFeeTwd: 200,
      isActive: false,
    },
  ],
  exchangeRates: {
    JPY: {
      currency: 'JPY',
      name: '日幣 (日本專線)',
      symbol: '¥',
      flag: '🇯🇵',
      baseRate: 0.212,
      quoteRate: 0.228,
      airFreightPerKg: 240,
      serviceFeePercent: 8,
      minServiceFeeTwd: 100,
      isActive: true,
    },
    KRW: {
      currency: 'KRW',
      name: '韓元 (韓國東大門/品牌)',
      symbol: '₩',
      flag: '🇰🇷',
      baseRate: 0.024,
      quoteRate: 0.0265,
      airFreightPerKg: 200,
      serviceFeePercent: 10,
      minServiceFeeTwd: 120,
      isActive: true,
    },
    CNY: {
      currency: 'CNY',
      name: '人民幣 (中國專櫃/旗艦店)',
      symbol: '¥',
      flag: '🇨🇳',
      baseRate: 4.45,
      quoteRate: 4.85,
      airFreightPerKg: 120,
      serviceFeePercent: 8,
      minServiceFeeTwd: 100,
      isActive: true,
    },
    USD: {
      currency: 'USD',
      name: '美金 (美國官網/Outlet)',
      symbol: '$',
      flag: '🇺🇸',
      baseRate: 31.8,
      quoteRate: 33.2,
      airFreightPerKg: 280,
      serviceFeePercent: 8,
      minServiceFeeTwd: 150,
      isActive: false,
    },
    EUR: {
      currency: 'EUR',
      name: '歐元 (歐洲專櫃精品)',
      symbol: '€',
      flag: '🇪🇺',
      baseRate: 34.2,
      quoteRate: 35.8,
      airFreightPerKg: 350,
      serviceFeePercent: 7,
      minServiceFeeTwd: 200,
      isActive: false,
    },
    TWD: {
      currency: 'TWD',
      name: '新台幣基準',
      symbol: 'NT$',
      flag: '🇹🇼',
      baseRate: 1,
      quoteRate: 1,
      airFreightPerKg: 0,
      serviceFeePercent: 0,
      minServiceFeeTwd: 0,
      isActive: false,
    },
  },
  receivingBank: {
    bankName: '玉山銀行 (808)',
    bankCode: '808',
    accountNo: '1388-979-018264',
    accountHolder: '全球代購工作室（王品妍）',
    note: '轉帳完成後請至系統或 LINE 回報匯款帳號末五碼與轉帳金額，以利即時對帳採購。',
  },
  shopNotice: '【代購委託須知】\n1. 報價已包含當地消費稅與代購服務費，第一階段需先支付商品全額或 50% 訂金始進行採購。\n2. 國際空運依實際包裹秤重計費（以 0.5kg 為單位計算），抵台後收取國際運費與尾款後放行寄出。\n3. 海外代購屬客製化給付，下單確認後恕不接受隨意取消或退換貨。',
  domesticShippingRates: {
    convenienceStore: 60,
    homeDelivery: 100,
  },
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    customerCode: 'CUST-001',
    name: '林欣宜 (Jessica)',
    lineId: 'jessica_lin88',
    igHandle: '@jess_lifestyle',
    phone: '0912-345-678',
    password: 'password123',
    delivery: {
      type: '7-11',
      storeCode: '991182',
      storeName: '7-ELEVEN 信義威秀門市',
      address: '台北市信義區松壽路20號',
    },
    tag: 'VIP',
    notes: '日系專櫃常客，喜歡隨箱附品牌紙袋',
    totalSpentTwd: 46800,
    ordersCount: 8,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'cust-02',
    customerCode: 'CUST-002',
    name: '張庭瑋 (David)',
    lineId: 'david_chang_tw',
    phone: '0928-112-334',
    password: 'password123',
    delivery: {
      type: 'home',
      address: '新北市板橋區縣民大道二段180號9樓',
    },
    tag: '常客',
    notes: '美線潮流球鞋、露營裝備為主',
    totalSpentTwd: 28400,
    ordersCount: 4,
    createdAt: '2026-04-12T14:30:00Z',
  },
  {
    id: 'cust-03',
    customerCode: 'CUST-003',
    name: '陳雅筑 (Emily)',
    lineId: 'emily_chen_kr',
    igHandle: '@emily.closet',
    phone: '0975-667-889',
    password: 'password123',
    delivery: {
      type: 'family',
      storeCode: '018823',
      storeName: '全家便利商店 忠孝敦南店',
      address: '台北市大安區敦化南路一段160巷5號',
    },
    tag: '新客',
    notes: '韓系設計師女裝代購連線',
    totalSpentTwd: 5850,
    ordersCount: 1,
    createdAt: '2026-10-10T16:15:00Z',
  },
  {
    id: 'cust-04',
    customerCode: 'CUST-004',
    name: '黃柏翰 (Brian)',
    lineId: 'brian_h1990',
    phone: '0933-889-900',
    password: 'password123',
    delivery: {
      type: '7-11',
      storeCode: '184920',
      storeName: '7-ELEVEN 台中逢甲門市',
      address: '台中市西屯區文華路100號',
    },
    tag: '常客',
    notes: '日本露營用品 Snow Peak、Coleman 代買',
    totalSpentTwd: 32900,
    ordersCount: 5,
    createdAt: '2026-05-18T09:20:00Z',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-20261016-01',
    orderNo: 'ORD-261016-01',
    customerId: 'cust-01',
    customerName: '林欣宜 (Jessica)',
    customerPhone: '0912-345-678',
    country: 'JPY',
    items: [
      {
        id: 'item-101',
        name: 'PORTER TANKER 2WAY 斜背包 鼠尾草綠',
        category: '精品包袋',
        country: 'JPY',
        sourceStore: 'PORTER 吉田包 官方直營店',
        originalPrice: 28600,
        exchangeRate: 0.228,
        serviceFeeTwd: 520,
        estWeightKg: 0.65,
        quantity: 1,
        unitPriceTwd: 7041,
        subtotalTwd: 7041,
        purchaseStatus: 'pending',
      },
      {
        id: 'item-102',
        name: 'SHIRO 經典白茶淡香水 40ml',
        category: '美妝香氛',
        country: 'JPY',
        sourceStore: 'SHIRO 表參道旗艦店',
        originalPrice: 4180,
        exchangeRate: 0.228,
        serviceFeeTwd: 150,
        estWeightKg: 0.25,
        quantity: 2,
        unitPriceTwd: 1103,
        subtotalTwd: 2206,
        purchaseStatus: 'pending',
      },
    ],
    status: 'pending_deposit',
    createdAt: '2026-10-16T08:30:00Z',
    itemsTotalTwd: 9247,
    depositRatio: 1.0,
    depositRequiredTwd: 9247,
    depositPaidTwd: 0,
    depositPaymentStatus: 'verifying', // 客戶剛剛回報匯款，待對帳審核！
    actualWeightKg: undefined,
    actualAirFreightTwd: 0,
    domesticFreightTwd: 60,
    tariffTwd: 0,
    discountTwd: 0,
    balanceRequiredTwd: 0,
    balancePaidTwd: 0,
    balancePaymentStatus: 'unpaid',
    totalRevenueTwd: 9307,
    estimatedProfitTwd: 820,
    deliveryMethod: '7-11 取貨 (門市：991182)',
    customerNotes: '希望香水外盒不要壓到，謝謝小幫手！',
  },
  {
    id: 'ord-20261015-02',
    orderNo: 'ORD-261015-02',
    customerId: 'cust-03',
    customerName: '陳雅筑 (Emily)',
    customerPhone: '0975-667-889',
    country: 'KRW',
    items: [
      {
        id: 'item-201',
        name: 'Mardi Mercredi 經典小雛菊刺繡針織衫 藏青',
        category: '流行服飾',
        country: 'KRW',
        sourceStore: '漢南洞 Mardi Mercredi 旗艦專賣',
        originalPrice: 138000,
        exchangeRate: 0.0265,
        serviceFeeTwd: 360,
        estWeightKg: 0.55,
        quantity: 1,
        unitPriceTwd: 4017,
        subtotalTwd: 4017,
        purchaseStatus: 'pending',
      },
      {
        id: 'item-202',
        name: 'TAMBURINS 固體香膏 PUMKINI 30ml',
        category: '美妝香氛',
        country: 'KRW',
        sourceStore: '新沙洞 Tamburins 旗艦店',
        originalPrice: 46500,
        exchangeRate: 0.0265,
        serviceFeeTwd: 150,
        estWeightKg: 0.2,
        quantity: 1,
        unitPriceTwd: 1382,
        subtotalTwd: 1382,
        purchaseStatus: 'pending',
      },
    ],
    status: 'purchasing',
    createdAt: '2026-10-15T11:20:00Z',
    itemsTotalTwd: 5399,
    depositRatio: 1.0,
    depositRequiredTwd: 5399,
    depositPaidTwd: 5399,
    depositPaymentStatus: 'paid',
    actualWeightKg: undefined,
    actualAirFreightTwd: 0,
    domesticFreightTwd: 60,
    tariffTwd: 0,
    discountTwd: 0,
    balanceRequiredTwd: 0,
    balancePaidTwd: 0,
    balancePaymentStatus: 'unpaid',
    totalRevenueTwd: 5459,
    estimatedProfitTwd: 510,
    deliveryMethod: '全家取貨 (門市：018823)',
    adminNotes: '首爾買手預計今日下午赴漢南洞現場採購',
  },
  {
    id: 'ord-20261012-03',
    orderNo: 'ORD-261012-03',
    customerId: 'cust-02',
    customerName: '張庭瑋 (David)',
    customerPhone: '0928-112-334',
    country: 'USD',
    items: [
      {
        id: 'item-301',
        name: 'Ralph Lauren 絞花針織小馬毛衣 燕麥色 M',
        category: '精品服飾',
        country: 'USD',
        sourceStore: 'Ralph Lauren 美國官方旗艦店',
        originalPrice: 198,
        exchangeRate: 33.2,
        serviceFeeTwd: 520,
        estWeightKg: 0.7,
        quantity: 1,
        unitPriceTwd: 7094,
        subtotalTwd: 7094,
        purchaseStatus: 'purchased',
        actualPurchaseCostOriginal: 198,
        purchaseNote: '官網已下單，包裹已發出轉運倉',
      },
      {
        id: 'item-302',
        name: 'New Balance 990v6 Made in USA 灰色 US10.5',
        category: '鞋履球鞋',
        country: 'USD',
        sourceStore: 'Kith US 門市',
        originalPrice: 219.99,
        exchangeRate: 33.2,
        serviceFeeTwd: 580,
        estWeightKg: 1.4,
        quantity: 1,
        unitPriceTwd: 7884,
        subtotalTwd: 7884,
        purchaseStatus: 'purchased',
        actualPurchaseCostOriginal: 219.99,
      },
    ],
    status: 'arrived_tw',
    createdAt: '2026-10-12T09:10:00Z',
    itemsTotalTwd: 14978,
    depositRatio: 1.0,
    depositRequiredTwd: 14978,
    depositPaidTwd: 14978,
    depositPaymentStatus: 'paid',
    actualWeightKg: 2.15,
    actualAirFreightTwd: 602, // 2.15kg * 280
    domesticFreightTwd: 100,  // 宅配
    tariffTwd: 0,
    discountTwd: 100,
    balanceRequiredTwd: 602,  // 運費與尾款
    balancePaidTwd: 0,
    balancePaymentStatus: 'verifying', // 客戶回報已轉帳尾款 602 元，待核銷！
    totalRevenueTwd: 15580,
    estimatedProfitTwd: 1100,
    deliveryMethod: '黑貓宅配到府 (新北市板橋區)',
    overseasTrackingNo: 'FEDEX-992819827USA',
    adminNotes: '物品已入台灣新北轉運倉過秤完成，待尾款入帳即出貨',
  },
  {
    id: 'ord-20261010-04',
    orderNo: 'ORD-261010-04',
    customerId: 'cust-04',
    customerName: '黃柏翰 (Brian)',
    customerPhone: '0933-889-900',
    country: 'JPY',
    items: [
      {
        id: 'item-401',
        name: 'Snow Peak 鈦金屬雙層折疊杯 450ml',
        category: '戶外露營',
        country: 'JPY',
        sourceStore: 'L-Breath 新宿旗艦店',
        originalPrice: 5940,
        exchangeRate: 0.228,
        serviceFeeTwd: 180,
        estWeightKg: 0.3,
        quantity: 2,
        unitPriceTwd: 1534,
        subtotalTwd: 3068,
        purchaseStatus: 'purchased',
        actualPurchaseCostOriginal: 11880,
      },
    ],
    status: 'fulfilled',
    createdAt: '2026-10-10T15:00:00Z',
    itemsTotalTwd: 3068,
    depositRatio: 1.0,
    depositRequiredTwd: 3068,
    depositPaidTwd: 3068,
    depositPaymentStatus: 'paid',
    actualWeightKg: 0.6,
    actualAirFreightTwd: 144,
    domesticFreightTwd: 60,
    tariffTwd: 0,
    discountTwd: 0,
    balanceRequiredTwd: 204,
    balancePaidTwd: 204,
    balancePaymentStatus: 'paid',
    totalRevenueTwd: 3272,
    estimatedProfitTwd: 360,
    deliveryMethod: '7-11 取貨 (門市：184920)',
    domesticTrackingNo: '711-299381829',
    adminNotes: '已由 7-11 物流配送並完成取件',
  },
  {
    id: 'ord-20261014-05',
    orderNo: 'ORD-261014-05',
    customerId: 'cust-01',
    customerName: '林欣宜 (Jessica)',
    customerPhone: '0912-345-678',
    country: 'JPY',
    items: [
      {
        id: 'item-501',
        name: '東京海洋迪士尼 達菲熊秋季限定絨毛吊飾',
        category: '公仔周邊',
        country: 'JPY',
        sourceStore: '東京迪士尼海洋園區專賣店',
        originalPrice: 2400,
        exchangeRate: 0.228,
        serviceFeeTwd: 120,
        estWeightKg: 0.2,
        quantity: 1,
        unitPriceTwd: 667,
        subtotalTwd: 667,
        purchaseStatus: 'purchased',
        actualPurchaseCostOriginal: 2400,
      },
    ],
    status: 'arrived_tw',
    createdAt: '2026-10-14T10:00:00Z',
    itemsTotalTwd: 667,
    depositRatio: 1.0,
    depositRequiredTwd: 667,
    depositPaidTwd: 667,
    depositPaymentStatus: 'paid',
    actualWeightKg: 0.35,
    actualAirFreightTwd: 84,
    domesticFreightTwd: 60,
    tariffTwd: 0,
    discountTwd: 0,
    balanceRequiredTwd: 144,
    balancePaidTwd: 144,
    balancePaymentStatus: 'paid',
    totalRevenueTwd: 811,
    estimatedProfitTwd: 180,
    deliveryMethod: '7-11 取貨 (門市：991182)',
    overseasTrackingNo: 'JP-AIR-88291024',
    adminNotes: '商品已抵達台灣轉運倉，待安排台灣出貨 (可與其他抵台單合併出貨)',
  },
  {
    id: 'ord-20261013-06',
    orderNo: 'ORD-261013-06',
    customerId: 'cust-01',
    customerName: '林欣宜 (Jessica)',
    customerPhone: '0912-345-678',
    country: 'JPY',
    items: [
      {
        id: 'item-601',
        name: '吉卜力工作室 龍貓刺繡帆布托特包 經典綠',
        category: '精品包袋',
        country: 'JPY',
        sourceStore: '橡子共和國 晴空塔店',
        originalPrice: 4400,
        exchangeRate: 0.228,
        serviceFeeTwd: 160,
        estWeightKg: 0.4,
        quantity: 1,
        unitPriceTwd: 1163,
        subtotalTwd: 1163,
        purchaseStatus: 'purchased',
        actualPurchaseCostOriginal: 4400,
      },
    ],
    status: 'arrived_tw',
    createdAt: '2026-10-13T14:30:00Z',
    itemsTotalTwd: 1163,
    depositRatio: 1.0,
    depositRequiredTwd: 1163,
    depositPaidTwd: 1163,
    depositPaymentStatus: 'paid',
    actualWeightKg: 0.45,
    actualAirFreightTwd: 108,
    domesticFreightTwd: 60,
    tariffTwd: 0,
    discountTwd: 0,
    balanceRequiredTwd: 168,
    balancePaidTwd: 168,
    balancePaymentStatus: 'paid',
    totalRevenueTwd: 1331,
    estimatedProfitTwd: 220,
    deliveryMethod: '7-11 取貨 (門市：991182)',
    overseasTrackingNo: 'JP-AIR-9912033',
    adminNotes: '商品已抵達台灣轉運倉，尾款已結清，待出貨 (可與其他抵台單合併出貨)',
  },
  {
    id: 'ord-20261011-07',
    orderNo: 'ORD-261011-07',
    customerId: 'cust-03',
    customerName: '陳雅筑 (Emily)',
    customerPhone: '0975-667-889',
    country: 'KRW',
    items: [
      {
        id: 'item-701',
        name: 'Mardi Mercredi 聯名限量小雛菊長版風衣 卡其色 F',
        category: '流行服飾',
        country: 'KRW',
        sourceStore: '漢南洞 Mardi Mercredi 旗艦專賣',
        originalPrice: 218000,
        exchangeRate: 0.0265,
        serviceFeeTwd: 450,
        estWeightKg: 0.9,
        quantity: 1,
        unitPriceTwd: 6227,
        subtotalTwd: 6227,
        purchaseStatus: 'out_of_stock',
        purchaseNote: '首爾專櫃門市與官方官網庫存全數售罄，已無補貨預告',
      },
    ],
    status: 'out_of_stock',
    isOutOfStock: true,
    outOfStockReason: '首爾專櫃門市與官方官網庫存全數售罄，已無補貨預告',
    outOfStockNotifiedAt: '2026-10-15T16:00:00Z',
    refundStatus: 'pending_info',
    refundAmountTwd: 3000,
    createdAt: '2026-10-11T12:00:00Z',
    itemsTotalTwd: 6227,
    depositRatio: 0.5,
    depositRequiredTwd: 3000,
    depositPaidTwd: 3000,
    depositPaymentStatus: 'paid',
    actualWeightKg: undefined,
    actualAirFreightTwd: 0,
    domesticFreightTwd: 60,
    tariffTwd: 0,
    discountTwd: 0,
    balanceRequiredTwd: 0,
    balancePaidTwd: 0,
    balancePaymentStatus: 'unpaid',
    totalRevenueTwd: 3000,
    estimatedProfitTwd: 0,
    deliveryMethod: '全家取貨 (門市：018823)',
    adminNotes: '買手回報專櫃已斷貨，已發 LINE 通知客人，等待客人回填銀行帳戶以利全額退款 3000 元',
  },
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-20261016-01',
    paymentNo: 'PAY-261016-01',
    orderId: 'ord-20261016-01',
    orderNo: 'ORD-261016-01',
    customerId: 'cust-01',
    customerName: '林欣宜 (Jessica)',
    stage: 'deposit',
    amount: 9247,
    bankName: '國泰世華銀行 (013)',
    bankLast5: '88392',
    transferTime: '2026-10-16 09:15',
    proofNote: '已網銀轉入玉山帳戶，附上轉帳明細截圖',
    status: 'pending',
    createdAt: '2026-10-16T09:16:00Z',
  },
  {
    id: 'pay-20261015-02',
    paymentNo: 'PAY-261015-02',
    orderId: 'ord-20261012-03',
    orderNo: 'ORD-261012-03',
    customerId: 'cust-02',
    customerName: '張庭瑋 (David)',
    stage: 'balance',
    amount: 602,
    bankName: '台新銀行 (812)',
    bankLast5: '40192',
    transferTime: '2026-10-16 08:45',
    proofNote: '尾款 602 已轉，請查核後儘速黑貓寄出',
    status: 'pending',
    createdAt: '2026-10-16T08:50:00Z',
  },
  {
    id: 'pay-20261015-03',
    paymentNo: 'PAY-261015-03',
    orderId: 'ord-20261015-02',
    orderNo: 'ORD-261015-02',
    customerId: 'cust-03',
    customerName: '陳雅筑 (Emily)',
    stage: 'deposit',
    amount: 5399,
    bankName: '中國信託 (822)',
    bankLast5: '61902',
    transferTime: '2026-10-15 13:00',
    proofNote: 'ATM 跨行轉帳',
    status: 'verified',
    verifiedAt: '2026-10-15 13:20',
    verifier: '小幫手 Wendy',
    createdAt: '2026-10-15T13:05:00Z',
  },
  {
    id: 'pay-20261010-04',
    paymentNo: 'PAY-261010-04',
    orderId: 'ord-20261010-04',
    orderNo: 'ORD-261010-04',
    customerId: 'cust-04',
    customerName: '黃柏翰 (Brian)',
    stage: 'balance',
    amount: 204,
    bankName: '玉山銀行 (808)',
    bankLast5: '99201',
    transferTime: '2026-10-11 10:12',
    proofNote: '玉山同行免手續費轉帳',
    status: 'verified',
    verifiedAt: '2026-10-11 10:30',
    verifier: '小幫手 Wendy',
    createdAt: '2026-10-11T10:15:00Z',
  },
];

export const INITIAL_CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod-01',
    sku: 'JP-GHIBLI-001',
    name: '吉卜力 橡子共和國 龍貓周邊系列',
    category: '動漫周邊',
    country: 'JPY',
    sourceStore: 'どんぐり共和國 (橡子共和國 晴空塔店)',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558679908-541bcf1249ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    ],
    status: 'active',
    description: '宮崎駿吉卜力正版周邊，日本專門店連線代購，包含人氣大玩偶、隨身吊飾與托特包',
    createdAt: '2026-10-01T10:00:00Z',
    subItems: [
      {
        id: 'sub-01-1',
        name: '龍貓 30cm 大毛絨玩偶娃娃',
        imageUrl: 'https://images.unsplash.com/photo-1558679908-541bcf1249ff?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1558679908-541bcf1249ff?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
        ],
        suggestedPriceTwd: 1350, // 直接確認售價
        originalPrice: 4800,     // 備註原幣 (¥)
        isSecondStageFreight: false, // 一口價免二補 (通常直接上確認的價格)
        estWeightKg: 0.45,
        serviceFeeTwd: 200,
        stockQty: 2,
        specOptions: ['灰大龍貓', '藍中龍貓', '白小龍貓'],
      },
      {
        id: 'sub-01-2',
        name: '龍貓 掌上毛絨包包吊飾 (鑰匙圈)',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1558679908-541bcf1249ff?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        ],
        suggestedPriceTwd: 490, // 直接確認售價
        originalPrice: 1650,    // 備註原幣 (¥)
        isSecondStageFreight: false, // 一口價免二補
        estWeightKg: 0.12,
        serviceFeeTwd: 100,
        stockQty: 8,
        specOptions: ['灰龍貓吊飾', '灰塵精靈吊飾', '貓巴士吊飾'],
      },
      {
        id: 'sub-01-3',
        name: '龍貓 刺繡帆布托特提袋',
        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 820,
        originalPrice: 2860,
        isSecondStageFreight: false,
        estWeightKg: 0.25,
        serviceFeeTwd: 150,
        stockQty: 3,
        specOptions: ['深藍', '卡其'],
      },
      {
        id: 'sub-01-4',
        name: '公車亭貓巴士 立體磁鐵組',
        imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 350,
        originalPrice: 1100,
        isSecondStageFreight: false,
        estWeightKg: 0.08,
        serviceFeeTwd: 80,
        stockQty: 5,
        specOptions: ['單一款式'],
      },
    ],
  },
  {
    id: 'prod-02',
    sku: 'JP-CHII-002',
    name: 'Chiikawa 吉伊卡哇 官方連線特輯',
    category: '動漫周邊',
    country: 'JPY',
    sourceStore: 'Chiikawa Land 東京站專賣店',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    description: '日本東京限定吉伊卡哇快閃，人氣角色絨毛娃娃與包包吊飾特輯',
    createdAt: '2026-10-02T11:00:00Z',
    subItems: [
      {
        id: 'sub-02-1',
        name: '吉伊卡哇 睡衣趴姿大抱偶娃娃',
        imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 750,
        originalPrice: 2640,
        isSecondStageFreight: false,
        estWeightKg: 0.28,
        serviceFeeTwd: 120,
        stockQty: 4,
        specOptions: ['吉伊卡哇 (粉睡衣)', '小八貓 (藍睡衣)', '烏薩奇 (黃睡衣)'],
      },
      {
        id: 'sub-02-2',
        name: '角色包包毛絨金屬吊飾',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 390,
        originalPrice: 1320,
        isSecondStageFreight: false,
        estWeightKg: 0.08,
        serviceFeeTwd: 90,
        stockQty: 10,
        specOptions: ['吉伊卡哇', '小八貓', '烏薩奇', '飛頭魔'],
      },
      {
        id: 'sub-02-3',
        name: '角色大臉刺繡絨毛零錢包',
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 520,
        originalPrice: 1760,
        isSecondStageFreight: false,
        estWeightKg: 0.1,
        serviceFeeTwd: 100,
        stockQty: 5,
        specOptions: ['吉伊卡哇', '小八貓', '烏薩奇'],
      },
    ],
  },
  {
    id: 'prod-03',
    sku: 'JP-POR-003',
    name: 'PORTER TANKER 經典軍裝系列',
    category: '精品包袋',
    country: 'JPY',
    sourceStore: 'PORTER 吉田包 官方直營店',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    description: '吉田包代表作 TANKER 系列，輕盈防撕裂尼龍材質與亮橙內裡',
    createdAt: '2026-10-03T14:00:00Z',
    subItems: [
      {
        id: 'sub-03-1',
        name: 'TANKER 2WAY 斜背包',
        imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 7050,
        originalPrice: 28600,
        isSecondStageFreight: false,
        estWeightKg: 0.65,
        serviceFeeTwd: 450,
        stockQty: 2,
        specOptions: ['鼠尾草綠', '經典黑', '鐵灰'],
      },
      {
        id: 'sub-03-2',
        name: 'TANKER 戰術尼龍三折短夾',
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 3280,
        originalPrice: 13200,
        isSecondStageFreight: false,
        estWeightKg: 0.18,
        serviceFeeTwd: 250,
        stockQty: 3,
        specOptions: ['經典黑', '鼠尾草綠'],
      },
      {
        id: 'sub-03-3',
        name: 'TANKER 掛頸證件票卡夾',
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 2200,
        originalPrice: 8800,
        isSecondStageFreight: false,
        estWeightKg: 0.12,
        serviceFeeTwd: 180,
        stockQty: 4,
        specOptions: ['經典黑'],
      },
    ],
  },
  {
    id: 'prod-04',
    sku: 'JP-SHI-004',
    name: 'SHIRO 經典日系香氛保養系列',
    category: '美妝香氛',
    country: 'JPY',
    sourceStore: 'SHIRO 表參道旗艦店',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    description: '溫潤清新白茶與花香調，日本女生必備國民香氛與護手保養',
    createdAt: '2026-10-04T09:30:00Z',
    subItems: [
      {
        id: 'sub-04-1',
        name: '經典白茶淡香水 40ml',
        imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 1180,
        originalPrice: 4180,
        isSecondStageFreight: false,
        estWeightKg: 0.25,
        serviceFeeTwd: 120,
        stockQty: 5,
        specOptions: ['白茶 40ml', '白百合 40ml', '皂香 40ml'],
      },
      {
        id: 'sub-04-2',
        name: '室內香氛擴香瓶 300ml',
        imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 1580,
        originalPrice: 5720,
        isSecondStageFreight: false,
        estWeightKg: 0.65,
        serviceFeeTwd: 180,
        stockQty: 2,
        specOptions: ['白茶', '白百合'],
      },
      {
        id: 'sub-04-3',
        name: '保濕潤澤護手霜 45g',
        imageUrl: 'https://images.unsplash.com/photo-1608248597359-281b37f401f8?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 480,
        originalPrice: 1650,
        isSecondStageFreight: false,
        estWeightKg: 0.1,
        serviceFeeTwd: 80,
        stockQty: 6,
        specOptions: ['白茶', '皂香'],
      },
    ],
  },
  {
    id: 'prod-05',
    sku: 'KR-MAR-005',
    name: 'Mardi Mercredi 經典小雛菊服飾系列',
    category: '流行服飾',
    country: 'KRW',
    sourceStore: '漢南洞 Mardi Mercredi 旗艦專賣',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
    status: 'preorder',
    description: '韓國漢南洞超人氣排隊品牌，招牌小雛菊刺繡與法式印花系列',
    createdAt: '2026-10-05T15:20:00Z',
    subItems: [
      {
        id: 'sub-05-1',
        name: '小雛菊刺繡圓領針織衫',
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 3980,
        originalPrice: 138000,
        isSecondStageFreight: false,
        estWeightKg: 0.55,
        serviceFeeTwd: 300,
        stockQty: 0,
        specOptions: ['藏青/白花 Free', '燕麥/綠花 Free', '黑色/白花 Free'],
      },
      {
        id: 'sub-05-2',
        name: '經典大雛菊印花純棉短袖 T-shirt',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 1280,
        originalPrice: 42000,
        isSecondStageFreight: false,
        estWeightKg: 0.25,
        serviceFeeTwd: 150,
        stockQty: 0,
        specOptions: ['白底/綠花', '白底/黑花', '灰底/藍花'],
      },
      {
        id: 'sub-05-3',
        name: '小雛菊刺繡休閒棒球老帽',
        imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80',
        suggestedPriceTwd: 1180,
        originalPrice: 39000,
        isSecondStageFreight: false,
        estWeightKg: 0.15,
        serviceFeeTwd: 120,
        stockQty: 0,
        specOptions: ['海軍藍', '燕麥米', '炭黑'],
      },
    ],
  },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-01',
    username: 'admin',
    name: '總管理員 (主理人)',
    role: 'super_admin',
    password: 'admin123',
    phone: '0912-888-999',
    email: 'admin@globalproxy.tw',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-10-27T08:30:00Z',
  },
  {
    id: 'staff-02',
    username: 'wendy',
    name: '小幫手 Wendy',
    role: 'purchaser',
    password: 'password123',
    phone: '0933-221-133',
    email: 'wendy@globalproxy.tw',
    status: 'active',
    createdAt: '2026-03-15T10:00:00Z',
    lastLoginAt: '2026-10-26T14:15:00Z',
  },
  {
    id: 'staff-03',
    username: 'finance_alice',
    name: '對帳會計 Alice',
    role: 'finance',
    password: 'password123',
    phone: '0955-667-889',
    email: 'alice@globalproxy.tw',
    status: 'active',
    createdAt: '2026-05-01T09:00:00Z',
    lastLoginAt: '2026-10-25T17:00:00Z',
  },
];

export const INITIAL_WISH_REQUESTS: WishRequest[] = [
  {
    id: 'wish-01',
    wishNo: 'WISH-261025-01',
    customerId: 'cust-01',
    customerName: '林欣宜 (Jessica)',
    customerPhone: '0912-345-678',
    communityName: 'Jessica-台北連線群',
    productName: 'Chiikawa 東京站限定三層化妝包 (飛頭魔款)',
    country: 'JPY',
    referenceUrl: 'https://instagram.com/chiikawa_official',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
    specNote: '粉色飛頭魔款，希望能附原廠快閃店提袋',
    budgetTwd: 650,
    status: 'pending',
    createdAt: '2026-10-25T14:20:00Z',
  },
  {
    id: 'wish-02',
    wishNo: 'WISH-261024-02',
    customerId: 'cust-03',
    customerName: '陳雅筑 (Emily)',
    customerPhone: '0975-667-889',
    communityName: 'Emily-韓系穿搭VIP群',
    productName: 'Tamburins 聖水洞限定蛋型護手霜 15ml',
    country: 'KRW',
    referenceUrl: 'https://tamburins.com',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
    specNote: '香味 PUMKINI 款',
    budgetTwd: 1100,
    quotedPriceTwd: 1080,
    adminNote: '首爾買手確認有現貨，報價一口價 NT$ 1,080',
    status: 'quoted',
    createdAt: '2026-10-24T10:15:00Z',
    quotedAt: '2026-10-24T12:00:00Z',
  },
];

const STORAGE_KEYS = {
  SETTINGS: 'globalproxy_settings_v1',
  CUSTOMERS: 'globalproxy_customers_v1',
  ORDERS: 'globalproxy_orders_v1',
  PAYMENTS: 'globalproxy_payments_v1',
  CATALOG: 'globalproxy_catalog_v1',
  STAFF_USERS: 'globalproxy_staff_users_v1',
  CURRENT_ADMIN: 'globalproxy_current_admin_v1',
  WISHES: 'globalproxy_wishes_v1',
};

export function getStoredSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: SystemSettings = JSON.parse(raw);
    const customCountries = Array.isArray(parsed.customCountries) && parsed.customCountries.length > 0
      ? parsed.customCountries
      : DEFAULT_SETTINGS.customCountries;

    const exchangeRates = {
      ...DEFAULT_SETTINGS.exchangeRates,
      ...(parsed.exchangeRates || {}),
    };

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customCountries,
      exchangeRates,
      shopName: parsed.shopName || DEFAULT_SETTINGS.shopName || 'GlobalProxy 連線代購',
      shopSubtitle: parsed.shopSubtitle || DEFAULT_SETTINGS.shopSubtitle || '全球連線代購 專櫃直購 正品保證',
      heroBadgeText: parsed.heroBadgeText || DEFAULT_SETTINGS.heroBadgeText || '本期現場連線中',
      heroTitle: parsed.heroTitle || DEFAULT_SETTINGS.heroTitle || '日本吉卜力、Chiikawa、韓國東大門服飾現場連線中！',
      heroDescription: parsed.heroDescription || DEFAULT_SETTINGS.heroDescription || '✨ 價格透明化：商品皆標示「一口價（已含國際空運，免二補）」，直接確認台幣售價！ 下單後專人於海外專櫃/官網採購，抵台直接超商取貨或宅配到府。',
      heroFeature1: parsed.heroFeature1 || DEFAULT_SETTINGS.heroFeature1 || '一口價免二次催補款',
      heroFeature2: parsed.heroFeature2 || DEFAULT_SETTINGS.heroFeature2 || '支援 7-11 / 全家超取',
      heroFeature3: parsed.heroFeature3 || DEFAULT_SETTINGS.heroFeature3 || '全程訂單進度即時追蹤',
      depositPaymentPolicy: parsed.depositPaymentPolicy || DEFAULT_SETTINGS.depositPaymentPolicy || 'deposit_50',
      customDepositRatio: parsed.customDepositRatio ?? DEFAULT_SETTINGS.customDepositRatio ?? 0.5,
      depositPolicyNote: parsed.depositPolicyNote || DEFAULT_SETTINGS.depositPolicyNote,
      deliveryNotice: parsed.deliveryNotice || DEFAULT_SETTINGS.deliveryNotice,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage', err);
  }
}

export function getStoredStaffUsers(): StaffUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
    if (!raw) return INITIAL_STAFF_USERS;
    const parsed: StaffUser[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : INITIAL_STAFF_USERS;
  } catch {
    return INITIAL_STAFF_USERS;
  }
}

export function saveStoredStaffUsers(staffList: StaffUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffList));
  } catch (err) {
    console.error('Failed to save staff users to localStorage', err);
  }
}

export function getStoredCurrentAdmin(): StaffUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredCurrentAdmin(admin: StaffUser | null): void {
  try {
    if (admin) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
    }
  } catch (err) {
    console.error('Failed to save current admin to localStorage', err);
  }
}

export function getStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) return INITIAL_CUSTOMERS;
    const parsed: Customer[] = JSON.parse(raw);
    return parsed.map((c, idx) => ({
      ...c,
      customerCode: c.customerCode || `CUST-${String(idx + 1).padStart(3, '0')}`,
      password: c.password || 'password123',
    }));
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save customers to localStorage', err);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return INITIAL_ORDERS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders to localStorage', err);
  }
}

export function getStoredPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!raw) return INITIAL_PAYMENTS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_PAYMENTS;
  }
}

export function saveStoredPayments(payments: PaymentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  } catch (err) {
    console.error('Failed to save payments to localStorage', err);
  }
}

export function getStoredCatalog(): CatalogProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (!raw) return INITIAL_CATALOG_PRODUCTS;
    const parsed: CatalogProduct[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_CATALOG_PRODUCTS;
    if (parsed.length === 0) return []; // User intentionally cleared or emptied catalog
    
    // Normalize and ensure every product has a valid subItems array
    return parsed.map((item) => {
      let subItems = item.subItems;
      if (!Array.isArray(subItems) || subItems.length === 0) {
        subItems = [
          {
            id: `sub-${item.id}-default`,
            name: item.name,
            suggestedPriceTwd: item.suggestedPriceTwd || 490,
            originalPrice: item.originalPrice,
            isSecondStageFreight: false,
            estWeightKg: item.estWeightKg || 0.2,
            stockQty: item.stockQty || 0,
            specOptions: item.specOptions || [],
            imageUrl: item.imageUrl,
          },
        ];
      }

      // Ensure every subItem has direct confirmed price and freight status
      const normalizedSubItems = subItems.map((sub) => {
        const subImages = Array.isArray(sub.images) && sub.images.length > 0
          ? sub.images
          : (sub.imageUrl ? [sub.imageUrl] : []);

        const effectiveSaleMode = sub.saleMode || ((sub.stockQty ?? 0) > 0 ? 'in_stock' : 'preorder');
        return {
          ...sub,
          stockQty: sub.stockQty !== undefined ? Number(sub.stockQty) : (effectiveSaleMode === 'in_stock' ? 3 : 0),
          saleMode: effectiveSaleMode,
          preorderNotice: sub.preorderNotice || '海外專櫃連線採購，約 7-14 個工作天抵台出貨',
          suggestedPriceTwd:
            Number(sub.suggestedPriceTwd) ||
            (sub.originalPrice ? Math.round(Number(sub.originalPrice) * 0.23 + (Number(sub.serviceFeeTwd) || 120)) : 490),
          originalPrice: sub.originalPrice !== undefined ? Number(sub.originalPrice) : undefined,
          isSecondStageFreight: !!sub.isSecondStageFreight,
          imageUrl: subImages[0] || sub.imageUrl || item.imageUrl,
          images: subImages.slice(0, 5),
        };
      });

      const prodImages = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.imageUrl ? [item.imageUrl] : []);

      const hasInStock = normalizedSubItems.some((s) => s.saleMode === 'in_stock' || (s.stockQty ?? 0) > 0);
      const hasPreorder = normalizedSubItems.some((s) => s.saleMode === 'preorder' || (s.stockQty ?? 0) === 0);

      return {
        ...item,
        saleMode: item.saleMode || (item.status === 'preorder' ? 'preorder' : hasInStock ? 'in_stock' : 'preorder'),
        imageUrl: prodImages[0] || item.imageUrl,
        images: prodImages.slice(0, 5),
        subItems: normalizedSubItems,
      };
    });
  } catch {
    return INITIAL_CATALOG_PRODUCTS;
  }
}

export function saveStoredCatalog(catalog: CatalogProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
  } catch (err) {
    console.error('Failed to save catalog to localStorage', err);
  }
}

export function getStoredWishRequests(): WishRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WISHES);
    if (!raw) return INITIAL_WISH_REQUESTS;
    const parsed: WishRequest[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_WISH_REQUESTS;
  } catch {
    return INITIAL_WISH_REQUESTS;
  }
}

export function saveStoredWishRequests(wishes: WishRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(wishes));
  } catch (err) {
    console.error('Failed to save wish requests to localStorage', err);
  }
}

export function exportBackupJSON(): string {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    settings: getStoredSettings(),
    customers: getStoredCustomers(),
    orders: getStoredOrders(),
    payments: getStoredPayments(),
    catalog: getStoredCatalog(),
    staffUsers: getStoredStaffUsers(),
    wishRequests: getStoredWishRequests(),
  };
  return JSON.stringify(data, null, 2);
}

export function restoreFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.settings) saveStoredSettings(parsed.settings);
    if (parsed.customers) saveStoredCustomers(parsed.customers);
    if (parsed.orders) saveStoredOrders(parsed.orders);
    if (parsed.payments) saveStoredPayments(parsed.payments);
    if (parsed.catalog) saveStoredCatalog(parsed.catalog);
    if (parsed.staffUsers) saveStoredStaffUsers(parsed.staffUsers);
    if (parsed.wishRequests) saveStoredWishRequests(parsed.wishRequests);
    return true;
  } catch (err) {
    console.error('Failed to restore data', err);
    return false;
  }
}

export function resetAllDataToDefault(): void {
  saveStoredSettings(DEFAULT_SETTINGS);
  saveStoredCustomers(INITIAL_CUSTOMERS);
  saveStoredOrders(INITIAL_ORDERS);
  saveStoredPayments(INITIAL_PAYMENTS);
  saveStoredCatalog(INITIAL_CATALOG_PRODUCTS);
  saveStoredStaffUsers(INITIAL_STAFF_USERS);
  saveStoredWishRequests(INITIAL_WISH_REQUESTS);
}

export function clearAllDemoData(): void {
  saveStoredCustomers([]);
  saveStoredOrders([]);
  saveStoredPayments([]);
  saveStoredCatalog([]);
  saveStoredWishRequests([]);
}

