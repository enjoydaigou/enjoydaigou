import * as XLSX from 'xlsx';
import {
  Order,
  OrderItem,
  PaymentRecord,
  Customer,
  CatalogProduct,
  Currency,
  OrderStatus,
  PaymentStatus,
} from '../types';
import {
  getStoredOrders,
  getStoredCustomers,
  getStoredPayments,
  getStoredCatalog,
  getStoredSettings,
} from './storage';

// Status translations
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: '草稿/報價中',
  pending_deposit: '待付訂金',
  purchasing: '海外採購中',
  shipped_overseas: '國際轉運中',
  arrived_tw: '已抵台待秤重',
  pending_balance: '待付尾款運費',
  fulfilled: '已發貨完成',
  out_of_stock: '商品專櫃已斷貨',
  cancelled: '已取消',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: '已付款結清',
  verifying: '對帳核銷中',
  unpaid: '未付款',
};

const CURRENCY_NAMES: Record<Currency, string> = {
  JPY: '日本 (JPY ¥)',
  KRW: '韓國 (KRW ₩)',
  USD: '美國 (USD $)',
  EUR: '歐洲 (EUR €)',
  TWD: '台灣 (TWD NT$)',
};

function formatDate(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toISOString().slice(0, 10);
  } catch {
    return isoDate;
  }
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * 匯出訂單總表 Excel
 */
export function exportOrdersToExcel(ordersList?: Order[], customFilename?: string): void {
  const orders = ordersList || getStoredOrders();
  const rows = orders.map((o) => {
    const totalItemsQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
    const hasSecondFreight = o.items.some((it) => it.isSecondStageFreight);

    return {
      '訂單編號': o.orderNo,
      '訂單狀態': ORDER_STATUS_LABELS[o.status] || o.status,
      '客戶姓名': o.customerName,
      '聯絡電話': o.customerPhone,
      '代購國別': CURRENCY_NAMES[o.country] || o.country,
      '品項數量': totalItemsQty,
      '運費模式': hasSecondFreight ? '部分品項需二補' : '一口價免二補',
      '商品總額 (NT$)': o.itemsTotalTwd,
      '訂金收取比例': o.depositRatio === 1 ? '100% 全額' : `${Math.round(o.depositRatio * 100)}% 訂金`,
      '應收訂金 (NT$)': o.depositRequiredTwd,
      '實收訂金 (NT$)': o.depositPaidTwd,
      '訂金狀態': PAYMENT_STATUS_LABELS[o.depositPaymentStatus] || o.depositPaymentStatus,
      '包裹實重 (kg)': o.actualWeightKg ?? 0,
      '實計空運費 (NT$)': o.actualAirFreightTwd,
      '台灣本土運費 (NT$)': o.domesticFreightTwd,
      '優惠折抵 (NT$)': o.discountTwd,
      '應收尾款 (NT$)': o.balanceRequiredTwd,
      '實收尾款 (NT$)': o.balancePaidTwd,
      '尾款狀態': PAYMENT_STATUS_LABELS[o.balancePaymentStatus] || o.balancePaymentStatus,
      '總營業額 (NT$)': o.totalRevenueTwd,
      '預估毛利 (NT$)': o.estimatedProfitTwd,
      '取件配送方式': o.deliveryMethod || '7-11 超取',
      '海外物流單號': o.overseasTrackingNo || '',
      '國內寄送單號': o.domesticTrackingNo || '',
      '建立日期': formatDate(o.createdAt),
      '顧客備註': o.customerNotes || '',
      '管理員內部備註': o.adminNotes || '',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // 訂單編號
    { wch: 14 }, // 訂單狀態
    { wch: 16 }, // 客戶姓名
    { wch: 14 }, // 聯絡電話
    { wch: 15 }, // 代購國別
    { wch: 10 }, // 品項數量
    { wch: 16 }, // 運費模式
    { wch: 14 }, // 商品總額
    { wch: 14 }, // 訂金收取比例
    { wch: 14 }, // 應收訂金
    { wch: 14 }, // 實收訂金
    { wch: 14 }, // 訂金狀態
    { wch: 14 }, // 包裹實重
    { wch: 15 }, // 實計空運費
    { wch: 15 }, // 台灣本土運費
    { wch: 14 }, // 優惠折抵
    { wch: 14 }, // 應收尾款
    { wch: 14 }, // 實收尾款
    { wch: 14 }, // 尾款狀態
    { wch: 14 }, // 總營業額
    { wch: 14 }, // 預估毛利
    { wch: 20 }, // 取件配送方式
    { wch: 18 }, // 海外物流單號
    { wch: 18 }, // 國內寄送單號
    { wch: 14 }, // 建立日期
    { wch: 22 }, // 顧客備註
    { wch: 22 }, // 管理員內部備註
  ];

  XLSX.utils.book_append_sheet(wb, ws, '訂單總表');
  const filename = customFilename || `代購訂單總表_${getTodayString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 匯出跨訂單採購清單 Excel (買手現場或官網採購專用)
 */
export function exportProcurementToExcel(ordersList?: Order[], customFilename?: string): void {
  const orders = ordersList || getStoredOrders();

  // Aggregate items across purchasing / active orders
  interface AggregatedProcurement {
    key: string;
    name: string;
    spec: string;
    country: Currency;
    sourceStore: string;
    unitPriceTwd: number;
    originalPrice?: number;
    isSecondStageFreight: boolean;
    totalQty: number;
    purchasedQty: number;
    outOfStockQty: number;
    orderNos: string[];
  }

  const map = new Map<string, AggregatedProcurement>();

  orders.forEach((order) => {
    // Only include active orders that are not cancelled or fulfilled
    if (order.status === 'cancelled') return;

    order.items.forEach((item) => {
      const spec = item.spec || '預設規格';
      const store = item.sourceStore || '專櫃/官網';
      const key = `${item.name}__${spec}__${item.country}__${store}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name: item.name,
          spec: item.spec || '-',
          country: item.country,
          sourceStore: store,
          unitPriceTwd: item.unitPriceTwd,
          originalPrice: item.originalPrice,
          isSecondStageFreight: !!item.isSecondStageFreight,
          totalQty: 0,
          purchasedQty: 0,
          outOfStockQty: 0,
          orderNos: [],
        });
      }

      const agg = map.get(key)!;
      agg.totalQty += item.quantity;
      if (item.purchaseStatus === 'purchased') {
        agg.purchasedQty += item.quantity;
      } else if (item.purchaseStatus === 'out_of_stock') {
        agg.outOfStockQty += item.quantity;
      }
      if (!agg.orderNos.includes(order.orderNo)) {
        agg.orderNos.push(order.orderNo);
      }
    });
  });

  const rows = Array.from(map.values()).map((item, index) => {
    const pendingQty = Math.max(item.totalQty - item.purchasedQty - item.outOfStockQty, 0);
    return {
      '項次': index + 1,
      '商品名稱': item.name,
      '規格/款式': item.spec,
      '採購國家': CURRENCY_NAMES[item.country] || item.country,
      '專櫃/門市來源': item.sourceStore,
      '採購總需求 (件)': item.totalQty,
      '尚待採購 (件)': pendingQty,
      '已購得 (件)': item.purchasedQty,
      '缺貨數 (件)': item.outOfStockQty,
      '確認售價 (NT$)': item.unitPriceTwd,
      '備註原幣標價': item.originalPrice ? `${item.originalPrice}` : '無備註',
      '運費模式': item.isSecondStageFreight ? '需二補空運費' : '一口價免二補',
      '關聯委託單號': item.orderNos.join(', '),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 8 },  // 項次
    { wch: 28 }, // 商品名稱
    { wch: 18 }, // 規格/款式
    { wch: 16 }, // 採購國家
    { wch: 22 }, // 專櫃/門市來源
    { wch: 14 }, // 採購總需求
    { wch: 14 }, // 尚待採購
    { wch: 14 }, // 已購得
    { wch: 14 }, // 缺貨數
    { wch: 15 }, // 確認售價
    { wch: 14 }, // 備註原幣標價
    { wch: 15 }, // 運費模式
    { wch: 25 }, // 關聯委託單號
  ];

  XLSX.utils.book_append_sheet(wb, ws, '買手海外採購清單');
  const filename = customFilename || `海外採購清單_${getTodayString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 匯出收款對帳明細表 Excel
 */
export function exportReconciliationToExcel(
  paymentsList?: PaymentRecord[],
  customFilename?: string
): void {
  const payments = paymentsList || getStoredPayments();

  const rows = payments.map((p, idx) => ({
    '流水號': idx + 1,
    '對帳單號': p.paymentNo,
    '委託訂單編號': p.orderNo,
    '客戶姓名': p.customerName,
    '收款階段': p.stage === 'deposit' ? '第一階段 (訂金)' : '第二階段 (尾款/運費)',
    '轉帳金額 (NT$)': p.amount,
    '入帳銀行': p.bankName,
    '匯款末五碼': p.bankLast5,
    '顧客回報轉帳時間': p.transferTime || '',
    '對帳核銷狀態':
      p.status === 'verified' ? '已核銷入帳' : p.status === 'rejected' ? '對帳未通過' : '待核銷',
    '核銷完成時間': p.verifiedAt ? formatDate(p.verifiedAt) : '',
    '經手核銷人員': p.verifier || '',
    '查帳備註': p.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 8 },  // 流水號
    { wch: 18 }, // 對帳單號
    { wch: 18 }, // 委託訂單編號
    { wch: 15 }, // 客戶姓名
    { wch: 18 }, // 收款階段
    { wch: 15 }, // 轉帳金額
    { wch: 16 }, // 入帳銀行
    { wch: 12 }, // 匯款末五碼
    { wch: 18 }, // 顧客回報轉帳時間
    { wch: 14 }, // 對帳核銷狀態
    { wch: 16 }, // 核銷完成時間
    { wch: 14 }, // 經手核銷人員
    { wch: 24 }, // 查帳備註
  ];

  XLSX.utils.book_append_sheet(wb, ws, '收款對帳明細表');
  const filename = customFilename || `收款對帳明細表_${getTodayString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 匯出商品上架庫目錄 Excel
 */
export function exportCatalogToExcel(
  catalogList?: CatalogProduct[],
  customFilename?: string
): void {
  const catalog = catalogList || getStoredCatalog();

  const rows: any[] = [];
  catalog.forEach((prod) => {
    if (prod.subItems && prod.subItems.length > 0) {
      prod.subItems.forEach((sub, subIdx) => {
        rows.push({
          '商品編號': prod.sku || prod.id,
          '系列/主商品名稱': prod.name,
          '子品項名稱': sub.name,
          '確認售價 (NT$)': sub.suggestedPriceTwd,
          '備註原幣價格': sub.originalPrice ? `${sub.originalPrice}` : '無備註',
          '運費補款模式': sub.isSecondStageFreight ? '需二補空運費' : '一口價免二補',
          '現貨庫存 (件)': sub.stockQty ?? 0,
          '商品分類': prod.category,
          '採購國別': CURRENCY_NAMES[prod.country] || prod.country,
          '來源門市/專櫃': prod.sourceStore,
          '規格色號選項': (sub.specOptions || []).join(' / ') || '-',
          '商品狀態': prod.status === 'active' ? '熱賣中' : prod.status === 'preorder' ? '預購中' : '已下架',
        });
      });
    } else {
      rows.push({
        '商品編號': prod.sku || prod.id,
        '系列/主商品名稱': prod.name,
        '子品項名稱': prod.name,
        '確認售價 (NT$)': prod.suggestedPriceTwd || 0,
        '備註原幣價格': prod.originalPrice ? `${prod.originalPrice}` : '無備註',
        '運費補款模式': prod.isSecondStageFreight ? '需二補空運費' : '一口價免二補',
        '現貨庫存 (件)': prod.stockQty ?? 0,
        '商品分類': prod.category,
        '採購國別': CURRENCY_NAMES[prod.country] || prod.country,
        '來源門市/專櫃': prod.sourceStore,
        '規格色號選項': '-',
        '商品狀態': prod.status === 'active' ? '熱賣中' : prod.status === 'preorder' ? '預購中' : '已下架',
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 16 }, // 商品編號
    { wch: 28 }, // 系列/主商品名稱
    { wch: 22 }, // 子品項名稱
    { wch: 15 }, // 確認售價
    { wch: 14 }, // 備註原幣價格
    { wch: 15 }, // 運費補款模式
    { wch: 12 }, // 現貨庫存
    { wch: 14 }, // 商品分類
    { wch: 16 }, // 採購國別
    { wch: 22 }, // 來源門市/專櫃
    { wch: 18 }, // 規格色號選項
    { wch: 12 }, // 商品狀態
  ];

  XLSX.utils.book_append_sheet(wb, ws, '商品上架庫目錄');
  const filename = customFilename || `商品上架目錄_${getTodayString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 匯出客戶資料 Excel
 */
export function exportCustomersToExcel(
  customersList?: Customer[],
  customFilename?: string
): void {
  const customers = customersList || getStoredCustomers();

  const rows = customers.map((c) => ({
    '客戶編號': c.customerCode || '',
    '客戶姓名': c.name,
    '聯絡電話': c.phone,
    'LINE ID': c.lineId,
    'IG 帳號': c.igHandle || '',
    '客戶等級': c.tag,
    '取件配送方式':
      c.delivery.type === '7-11' ? '7-11 超商取貨' : c.delivery.type === 'family' ? '全家 超商取貨' : '宅配到府',
    '門市店號代碼': c.delivery.storeCode || '',
    '門市名稱 / 宅配地址': c.delivery.storeName || c.delivery.address || '',
    '累計委託單數': c.ordersCount,
    '累計委託總額 (NT$)': c.totalSpentTwd,
    '建立時間': formatDate(c.createdAt),
    '備註喜好': c.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 14 }, // 客戶編號
    { wch: 16 }, // 客戶姓名
    { wch: 15 }, // 聯絡電話
    { wch: 16 }, // LINE ID
    { wch: 16 }, // IG 帳號
    { wch: 10 }, // 客戶等級
    { wch: 16 }, // 取件配送方式
    { wch: 14 }, // 門市店號代碼
    { wch: 28 }, // 門市名稱 / 宅配地址
    { wch: 14 }, // 累計委託單數
    { wch: 18 }, // 累計委託總額
    { wch: 14 }, // 建立時間
    { wch: 24 }, // 備註喜好
  ];

  XLSX.utils.book_append_sheet(wb, ws, '客戶名冊');
  const filename = customFilename || `客戶名冊_${getTodayString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 匯出完整綜合代購管理 Excel 活頁簿 (.xlsx)
 * 包含 6 大工作表：訂單總表、商品明細、海外採購單、收款對帳表、客戶名冊、商品上架庫
 */
export function exportComprehensiveWorkbookToExcel(customFilename?: string): void {
  const orders = getStoredOrders();
  const customers = getStoredCustomers();
  const payments = getStoredPayments();
  const catalog = getStoredCatalog();

  const wb = XLSX.utils.book_new();

  // 1. 訂單總表
  const ordersRows = orders.map((o) => {
    const totalItemsQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
    const hasSecondFreight = o.items.some((it) => it.isSecondStageFreight);

    return {
      '訂單編號': o.orderNo,
      '訂單狀態': ORDER_STATUS_LABELS[o.status] || o.status,
      '客戶姓名': o.customerName,
      '聯絡電話': o.customerPhone,
      '代購國別': CURRENCY_NAMES[o.country] || o.country,
      '品項數量': totalItemsQty,
      '運費模式': hasSecondFreight ? '部分品項需二補' : '一口價免二補',
      '商品總額 (NT$)': o.itemsTotalTwd,
      '訂金比例': o.depositRatio === 1 ? '100% 全額' : `${Math.round(o.depositRatio * 100)}% 訂金`,
      '應收訂金 (NT$)': o.depositRequiredTwd,
      '實收訂金 (NT$)': o.depositPaidTwd,
      '訂金狀態': PAYMENT_STATUS_LABELS[o.depositPaymentStatus] || o.depositPaymentStatus,
      '包裹實重 (kg)': o.actualWeightKg ?? 0,
      '實計空運費 (NT$)': o.actualAirFreightTwd,
      '國內運費 (NT$)': o.domesticFreightTwd,
      '優惠折抵 (NT$)': o.discountTwd,
      '應收尾款 (NT$)': o.balanceRequiredTwd,
      '實收尾款 (NT$)': o.balancePaidTwd,
      '尾款狀態': PAYMENT_STATUS_LABELS[o.balancePaymentStatus] || o.balancePaymentStatus,
      '總營業額 (NT$)': o.totalRevenueTwd,
      '預估毛利 (NT$)': o.estimatedProfitTwd,
      '取件配送方式': o.deliveryMethod || '7-11 超取',
      '國內寄送單號': o.domesticTrackingNo || '',
      '建立日期': formatDate(o.createdAt),
      '顧客備註': o.customerNotes || '',
    };
  });
  const wsOrders = XLSX.utils.json_to_sheet(ordersRows);
  XLSX.utils.book_append_sheet(wb, wsOrders, '1-訂單總表');

  // 2. 訂購商品明細 (每張單中的每個商品)
  const itemDetailRows: any[] = [];
  orders.forEach((o) => {
    o.items.forEach((it, idx) => {
      itemDetailRows.push({
        '訂單編號': o.orderNo,
        '客戶姓名': o.customerName,
        '品項項次': idx + 1,
        '商品名稱': it.name,
        '規格/款式': it.spec || '-',
        '採購國別': it.country,
        '採購門市': it.sourceStore || '-',
        '確認單價 (NT$)': it.unitPriceTwd,
        '委託數量': it.quantity,
        '小計金額 (NT$)': it.subtotalTwd,
        '運費模式': it.isSecondStageFreight ? '需二補空運費' : '一口價免二補',
        '備註原幣標價': it.originalPrice ? `${it.originalPrice}` : '無備註',
        '採購狀態':
          it.purchaseStatus === 'purchased' ? '已購得' : it.purchaseStatus === 'out_of_stock' ? '缺貨' : '待採購',
        '買手實付原幣': it.actualPurchaseCostOriginal ?? '-',
      });
    });
  });
  const wsItems = XLSX.utils.json_to_sheet(itemDetailRows);
  XLSX.utils.book_append_sheet(wb, wsItems, '2-訂購商品明細');

  // 3. 海外採購清單
  const procRows: any[] = [];
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    o.items.forEach((it) => {
      procRows.push({
        '委託訂單': o.orderNo,
        '商品名稱': it.name,
        '規格/款式': it.spec || '-',
        '採購國別': it.country,
        '專櫃/門市': it.sourceStore || '-',
        '數量': it.quantity,
        '確認售價 (NT$)': it.unitPriceTwd,
        '備註原幣': it.originalPrice ? `${it.originalPrice}` : '-',
        '採購狀態':
          it.purchaseStatus === 'purchased' ? '已購得' : it.purchaseStatus === 'out_of_stock' ? '缺貨' : '待採購',
      });
    });
  });
  const wsProc = XLSX.utils.json_to_sheet(procRows);
  XLSX.utils.book_append_sheet(wb, wsProc, '3-採購清單');

  // 4. 收款對帳明細
  const paymentRows = payments.map((p, idx) => ({
    '項次': idx + 1,
    '對帳單號': p.paymentNo,
    '委託訂單編號': p.orderNo,
    '客戶姓名': p.customerName,
    '收款階段': p.stage === 'deposit' ? '第一階段 (訂金)' : '第二階段 (尾款)',
    '轉帳金額 (NT$)': p.amount,
    '入帳銀行': p.bankName,
    '末五碼': p.bankLast5,
    '轉帳時間': p.transferTime || '',
    '核銷狀態': p.status === 'verified' ? '已核銷入帳' : p.status === 'rejected' ? '異常' : '待核銷',
    '查帳備註': p.notes || '',
  }));
  const wsPayments = XLSX.utils.json_to_sheet(paymentRows);
  XLSX.utils.book_append_sheet(wb, wsPayments, '4-收款對帳明細');

  // 5. 客戶名冊
  const customerRows = customers.map((c) => ({
    '客戶姓名': c.name,
    '聯絡電話': c.phone,
    'LINE ID': c.lineId,
    'IG 帳號': c.igHandle || '',
    '會員等級': c.tag,
    '取件方式':
      c.delivery.type === '7-11' ? '7-11 超商' : c.delivery.type === 'family' ? '全家 超商' : '宅配',
    '門市代號': c.delivery.storeCode || '',
    '門市名稱/地址': c.delivery.storeName || c.delivery.address || '',
    '總消費次數': c.ordersCount,
    '累計金額 (NT$)': c.totalSpentTwd,
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
  XLSX.utils.book_append_sheet(wb, wsCustomers, '5-客戶名冊');

  // 6. 商品上架庫目錄
  const catalogRows: any[] = [];
  catalog.forEach((prod) => {
    if (prod.subItems?.length) {
      prod.subItems.forEach((sub) => {
        catalogRows.push({
          'SKU': prod.sku,
          '系列/主商品': prod.name,
          '子品項': sub.name,
          '確認售價 (NT$)': sub.suggestedPriceTwd,
          '備註原幣': sub.originalPrice ? `${sub.originalPrice}` : '無',
          '運費模式': sub.isSecondStageFreight ? '需二補' : '一口價免二補',
          '庫存件數': sub.stockQty ?? 0,
          '分類': prod.category,
          '國別': prod.country,
          '專櫃/門市': prod.sourceStore,
        });
      });
    } else {
      catalogRows.push({
        'SKU': prod.sku,
        '系列/主商品': prod.name,
        '子品項': prod.name,
        '確認售價 (NT$)': prod.suggestedPriceTwd || 0,
        '備註原幣': prod.originalPrice ? `${prod.originalPrice}` : '無',
        '運費模式': prod.isSecondStageFreight ? '需二補' : '一口價免二補',
        '庫存件數': prod.stockQty ?? 0,
        '分類': prod.category,
        '國別': prod.country,
        '專櫃/門市': prod.sourceStore,
      });
    }
  });
  const wsCatalog = XLSX.utils.json_to_sheet(catalogRows);
  XLSX.utils.book_append_sheet(wb, wsCatalog, '6-商品庫目錄');

  const filename = customFilename || `全球代購完整營運總表_${getTodayString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
