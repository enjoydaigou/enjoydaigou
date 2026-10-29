export type Currency = 'JPY' | 'KRW' | 'CNY' | 'USD' | 'EUR' | 'TWD' | string;

export type OrderStatus =
  | 'draft'               // 草稿/報價中
  | 'pending_deposit'    // 待付訂金
  | 'purchasing'         // 已付訂，海外採購中
  | 'shipped_overseas'   // 海外已出貨，國際轉運中
  | 'arrived_tw'         // 已抵台，待秤重/付尾款
  | 'pending_balance'    // 待收尾款與運費 (或已抵台待出貨)
  | 'fulfilled'          // 已結清發貨完成
  | 'out_of_stock'       // 已斷貨 (專櫃/官網缺貨未購得)
  | 'cancelled';         // 已取消

export type PaymentStage = 'deposit' | 'balance';

export type PaymentStatus = 'unpaid' | 'verifying' | 'paid';

export type ItemPurchaseStatus = 'pending' | 'purchased' | 'out_of_stock';

export interface ExchangeRateConfig {
  currency: Currency;
  name: string;
  symbol: string;
  flag?: string;             // 國旗符號 (例如: 🇨🇳, 🇯🇵, 🇰🇷)
  baseRate: number;          // 基準市場參考匯率 (對台幣)
  quoteRate: number;         // 代購報價換算匯率 (含匯差 Buffer)
  airFreightPerKg: number;   // 該國每公斤空運費 (TWD)
  serviceFeePercent: number; // 預設服務費率 (%)
  minServiceFeeTwd: number;  // 單件最低代購服務費 (TWD)
  isActive?: boolean;        // 是否啟用顯示於前台與下拉選單 (店家可自行開啟/關閉)
}

export interface CatalogSubItem {
  id: string;
  name: string;              // 例如: "絨毛娃娃", "包包吊飾", "刺繡帆布包"
  suggestedPriceTwd: number; // 確認售價 (NT$) - 直接確認的價格上架！
  originalPrice?: number;    // 原幣價格備註 (例: 1500 ¥，方便備註/核對成本)
  isSecondStageFreight?: boolean; // 是否需二補運費 (預設 false: 一口價免二補/包國際運費，少部分特殊品才需二補)
  estWeightKg?: number;      // 預估單件重量 (kg)
  serviceFeeTwd?: number;    // 代購費 (可選)
  stockQty: number;          // 現貨庫存 (0 代表預購)
  saleMode?: 'in_stock' | 'preorder'; // 販售模式: 現貨供應 / 海外預購
  preorderNotice?: string;   // 預購工作天數說明 (例: 下單後專人採購，約 7-14 個工作天抵台)
  specOptions?: string[];    // 規格色號 (例: 灰龍貓, 藍龍貓)
  imageUrl?: string;         // 首圖 / 封面圖
  images?: string[];         // 支援最多 5 張圖 (封面、細節、實拍照、吊牌、尺寸表等)
}

export interface CatalogProduct {
  id: string;
  name: string;              // 系列或主商品名稱 (例如: "吉卜力 龍貓官方專賣周邊系列", "Chiikawa 玩偶與吊飾特輯")
  sku: string;
  category: string;
  country: Currency;
  sourceStore: string;
  sourceUrl?: string;
  imageUrl?: string;         // 首圖
  images?: string[];         // 支援最多 5 張商品圖片
  status: 'active' | 'preorder' | 'discontinued';
  saleMode?: 'in_stock' | 'preorder'; // 販售模式
  preorderNotice?: string;   // 預購說明
  description?: string;
  subItems: CatalogSubItem[]; // 裡面包含的多個商品品項 (例如: 娃娃、吊飾、徽章等)
  isSecondStageFreight?: boolean; // 整組預設是否需二補運費
  createdAt: string;

  // 輔助向下相容
  originalPrice?: number;
  estWeightKg?: number;
  serviceFeeTwd?: number;
  suggestedPriceTwd?: number;
  stockQty?: number;
  specOptions?: string[];
}

export interface CustomerDelivery {
  type: '7-11' | 'family' | 'home';
  storeCode?: string;
  storeName?: string;
  address?: string;
}

export interface Customer {
  id: string;
  customerCode?: string; // 客戶編號 (例如: CUST-001, VIP-888)
  name: string;
  lineId: string;
  igHandle?: string;
  communityName?: string; // 社群內的名稱 / LINE社群暱稱 (店家可自行於後台設定欄位標題)
  phone: string;
  email?: string;
  password?: string; // 客戶登入密碼 (用於登入查詢委託進度與訂單)
  delivery: CustomerDelivery;
  tag: 'VIP' | '常客' | '新客';
  notes?: string;
  totalSpentTwd: number;
  ordersCount: number;
  createdAt: string;
}

export type WishRequestStatus = 'pending' | 'quoted' | 'converted' | 'rejected';

export interface WishRequest {
  id: string;
  wishNo: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  communityName?: string; // 客人社群內的名稱
  productName: string;
  country: Currency;      // 欲採購國家 (例: JPY, KRW, CNY, USD, EUR)
  referenceUrl?: string; // 參考網址 (例: IG / 小紅書 / 官網)
  imageUrl?: string;     // 商品照片網址或 Base64 預覽
  images?: string[];     // 支援最多多張圖片
  specNote?: string;     // 款式顏色規格說明
  budgetTwd?: number;    // 期望預算
  adminNote?: string;    // 店家備註/回覆
  quotedPriceTwd?: number; // 店家報價金額 (NT$)
  status: WishRequestStatus;
  createdAt: string;
  quotedAt?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  country: Currency;
  sourceUrl?: string;
  sourceStore?: string;
  imageUrl?: string;
  images?: string[];         // 支援最多 5 張圖片
  spec?: string;             // 選購規格或款式 (例: 灰大龍貓, 經典黑)
  originalPrice?: number;    // 原幣單價備註 (選填，例: 1500 ¥)
  exchangeRate?: number;     // 參考匯率
  serviceFeeTwd?: number;    // 單件代購費
  estWeightKg?: number;      // 預估單件重量
  quantity: number;          // 委託數量
  unitPriceTwd: number;      // 確認單件台幣售價 (直接確認的售價！)
  subtotalTwd: number;       // 小計台幣 (unitPriceTwd * quantity)
  isSecondStageFreight?: boolean; // 是否需二補運費 (false: 免二補/一口價全款，true: 抵台後二補)
  purchaseStatus: ItemPurchaseStatus;
  actualPurchaseCostOriginal?: number; // 買手實付原幣 (專櫃標價或折扣後金額)
  assignedPurchaserName?: string;      // 負責採購人 (例如: 店主親採, Wendy, Alice)
  purchaserPricingType?: 'self' | 'commission_fixed' | 'commission_percent' | 'flat_cost'; // 買手計價方式
  purchaserCommissionTwd?: number;     // 買手固定抽成 (NT$) 或 抽成趴數 (%)
  actualPurchaseCostTwd?: number;      // 換算台幣總成本 (含專櫃商品價折台幣 + 買手抽成)
  purchaseNote?: string;               // 採購備註或購買憑證註記
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerCode?: string;
  customerName: string;
  customerPhone: string;
  country: Currency;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  
  // 金額結構 (兩階段)
  itemsTotalTwd: number;      // 商品總金額
  depositRatio: number;       // 訂金收取比例 (例如 0.5 或 1.0)
  depositRequiredTwd: number; // 應收訂金
  depositPaidTwd: number;     // 實收訂金
  depositPaymentStatus: PaymentStatus;

  // 抵台後二階段運費與尾款
  actualWeightKg?: number;
  actualAirFreightTwd: number; // 實計國際運費
  domesticFreightTwd: number;  // 台灣本地運費 (例如 60 超取)
  tariffTwd: number;           // 關稅/雜費分攤
  discountTwd: number;         // 優惠折抵
  balanceRequiredTwd: number;  // 應收尾款 (商品餘款 + 國際運費 + 國內運費 + 關稅 - 折扣)
  balancePaidTwd: number;      // 實收尾款
  balancePaymentStatus: PaymentStatus;

  totalRevenueTwd: number;     // 總應收 = 實收訂金 + 實收尾款
  estimatedProfitTwd: number;  // 預估毛利

  // 物流追蹤
  overseasTrackingNo?: string;
  domesticTrackingNo?: string;
  deliveryMethod: string;
  customerNotes?: string;
  adminNotes?: string;

  // 斷貨與退款管理 (商品採購未果時)
  isOutOfStock?: boolean;
  outOfStockReason?: string;
  outOfStockNotifiedAt?: string;
  refundStatus?: 'none' | 'pending_info' | 'ready_to_refund' | 'refunded';
  refundAmountTwd?: number;
  refundBankInfo?: {
    bankCode: string;
    bankName: string;
    accountNo: string;
    accountHolder: string;
    submittedAt: string;
    note?: string;
  };
  refundCompletedAt?: string;
  refundTransferRef?: string;

  // 合併訂單出貨追蹤
  mergedWithOrderIds?: string[];   // 合併的其他訂單 ID
  mergedWithOrderNos?: string[];   // 合併的其他訂單單號
  mergedShipmentNo?: string;       // 合併包裹單號
  isMergedSubOrder?: boolean;      // 是否為被合併的副單
}

export interface PaymentRecord {
  id: string;
  paymentNo: string;
  orderId: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  stage: PaymentStage;
  amount: number;
  bankName: string;
  bankLast5: string;
  transferTime: string;
  proofNote?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifier?: string;
  notes?: string;
  createdAt: string;
}

export type StaffRole = 'super_admin' | 'purchaser' | 'finance' | 'customer_service';

export interface StaffUser {
  id: string;
  username: string;       // 登入帳號
  name: string;           // 使用人員姓名
  role: StaffRole;        // 權限角色
  password: string;       // 登入密碼
  phone?: string;         // 聯絡手機
  email?: string;         // 電子信箱
  status: 'active' | 'disabled'; // 啟用 / 停用
  createdAt: string;
  lastLoginAt?: string;
}

export interface SystemSettings {
  shopName?: string;      // 賣場名稱 (可自訂修改)
  shopSubtitle?: string;  // 賣場副標題 / 標語
  // 自訂會員註冊與結帳問卷欄位 (例如詢問客人「在社群/社團內的名稱」)
  customRegFieldLabel?: string;       // 欄位名稱 (例: "LINE社群暱稱" 或 "FB社團顯示名稱")
  isCustomRegFieldRequired?: boolean; // 是否設為必填 (預設 false)
  customRegFieldPlaceholder?: string; // 提示輸入文案 (例: "請填寫您在代購LINE群組內的暱稱")
  // 前台圖片許願詢價區設定
  enableWishlistArea?: boolean;       // 是否開啟前台「圖片許願詢價區」 (預設 true)
  wishlistNotice?: string;            // 許願說明須知 (例: "上傳圖片或貼上商品連結，小幫手將於 24 小時內為您專人報價！")
  // 前台主視覺橫幅公告文案 (店主可在後台自訂修改)
  heroBadgeText?: string;    // 前台橫幅標籤 (例: 本期現場連線中)
  heroTitle?: string;        // 前台主視覺大標題 (例: 日本吉卜力、Chiikawa、韓國東大門服飾現場連線中！)
  heroDescription?: string;  // 前台核心說明文案 (例: ✨ 價格透明化：商品皆標示「一口價（已含國際空運，免二補）」...)
  heroFeature1?: string;     // 保障特色 1 (例: 一口價免二次催補款)
  heroFeature2?: string;     // 保障特色 2 (例: 支援 7-11 / 全家超取)
  heroFeature3?: string;     // 保障特色 3 (例: 全程訂單進度即時追蹤)
  depositPaymentPolicy?: 'deposit_50' | 'full' | 'deposit_custom'; // 後台統一控制付款規範 (50%訂金 / 100%全款 / 自訂比例)
  customDepositRatio?: number; // 自訂訂金比例 (0.1 ~ 1.0)
  depositPolicyNote?: string;  // 訂金規則說明文案
  deliveryNotice?: string;     // 賣貨便寄件說明文案
  customCountries?: ExchangeRateConfig[]; // 自訂代購國家/幣別清單 (店家可自行新增、修改、啟用、停用)
  exchangeRates: Record<Currency, ExchangeRateConfig>;
  receivingBank: {
    bankName: string;
    bankCode: string;
    accountNo: string;
    accountHolder: string;
    note: string;
  };
  shopNotice: string;
  domesticShippingRates: {
    convenienceStore: number;
    homeDelivery: number;
  };
}

export interface CartItem {
  productId: string;
  subItemId: string;
  productName: string;
  subItemName: string;
  country: Currency;
  spec?: string;
  unitPriceTwd: number;
  originalPrice?: number;
  isSecondStageFreight?: boolean;
  quantity: number;
  imageUrl?: string;
  sourceStore?: string;
}

export interface UserSession {
  role: 'admin' | 'customer';
  isLoggedIn: boolean;
  customer?: Customer;
  staff?: StaffUser;
}
