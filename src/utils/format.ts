import { Currency, Order, SystemSettings } from '../types';

export function formatTwd(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'NT$ 0';
  return `NT$ ${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatCurrencyAmount(amount: number, currency: Currency): string {
  const rounded = Number(amount.toFixed(2));
  switch (currency) {
    case 'JPY':
      return `¥${Math.round(amount).toLocaleString('en-US')}`;
    case 'KRW':
      return `₩${Math.round(amount).toLocaleString('en-US')}`;
    case 'USD':
      return `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    case 'EUR':
      return `€${rounded.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    case 'TWD':
    default:
      return `NT$ ${Math.round(amount).toLocaleString('en-US')}`;
  }
}

export function formatDateTime(isoOrStr: string): string {
  if (!isoOrStr) return '-';
  try {
    const d = new Date(isoOrStr);
    if (isNaN(d.getTime())) return isoOrStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day} ${h}:${min}`;
  } catch {
    return isoOrStr;
  }
}

export function generateCustomerQuoteCopy(order: Order, settings: SystemSettings): string {
  const bank = settings.receivingBank;
  const hasSecondStageItems = order.items.some((it) => it.isSecondStageFreight);

  const itemsText = order.items
    .map((it, idx) => {
      const specLine = it.spec ? ` (規格/款式：${it.spec})` : '';
      const origNote = it.originalPrice ? ` (原幣標價：${formatCurrencyAmount(it.originalPrice, it.country)})` : '';
      const freightBadge = it.isSecondStageFreight ? '⚠️ 抵台需二補空運費' : '✅ 免二補運費·一口價';
      return `${idx + 1}. 【${it.name}】${specLine}\n   確認售價：${formatTwd(it.unitPriceTwd)} × ${it.quantity} 件 [${freightBadge}]${origNote}\n   小計：${formatTwd(it.subtotalTwd)}`;
    })
    .join('\n\n');

  const freightNote = hasSecondStageItems
    ? `✈️【少部分品項需二補運費說明】
本單內部分商品為「抵台二補款」，抵達台灣轉運倉完成過秤後，小幫手將依實際空運費 (${order.country} 空運 NT$${settings.exchangeRates[order.country]?.airFreightPerKg || 240}/kg) 與超取運費 NT$60 通知您補款並即日寄出！`
    : `✨【本單為一口價免二補】
通常商品皆為直接確認的到手價格（已含國際空運費），無需等待抵台二次秤重催補運費，結清後即可安心等待收貨！`;

  return `📦【海外代購委託確認單 - ${order.orderNo}】
親愛的 ${order.customerName} 您好，您的代購委託報價如下：

${itemsText}

──────────────────
💰 委託商品總額：${formatTwd(order.itemsTotalTwd)}
⭐ 本次應收金額：${formatTwd(order.depositRequiredTwd)}${order.depositRatio === 1 ? ' (100% 全額結清)' : ` (先付 ${Math.round(order.depositRatio * 100)}% 採購訂金)`}
──────────────────

🏦【匯款帳戶資訊】
• 銀行代碼：${bank.bankCode} ${bank.bankName}
• 帳號：${bank.accountNo}
• 戶名：${bank.accountHolder}

⚠️【匯款後對帳回報】
轉帳完成後，請直接回覆此訊息告知：
1. 您的轉帳帳號末五碼
2. 轉帳金額 (${formatTwd(order.depositRequiredTwd)})
3. 收件資訊 (收件人 / 電話 / 7-11或全家門市名稱與店號)

${freightNote}

感謝您的委託 ✨`;
}

export function generateBalanceNoticeCopy(order: Order, settings: SystemSettings): string {
  const bank = settings.receivingBank;

  return `✈️【商品抵台到貨與尾款通知 - ${order.orderNo}】
親愛的 ${order.customerName} 您好！
您委託代購的海外商品已順利抵達台灣轉運倉完成過秤檢查！

📦【到貨明細與尾款結算】
• 委託單號：${order.orderNo}
• 實際包裹重量：${order.actualWeightKg ?? 0} kg
• 國際空運費：${formatTwd(order.actualAirFreightTwd)}
• 國內配送運費：${formatTwd(order.domesticFreightTwd)}
${order.discountTwd > 0 ? `• 優惠折抵：-${formatTwd(order.discountTwd)}\n` : ''}──────────────────
💰 第二階段應付尾款：${formatTwd(order.balanceRequiredTwd)}
──────────────────

🏦【尾款匯款帳戶】
• 銀行代碼：${bank.bankCode} ${bank.bankName}
• 帳號：${bank.accountNo}
• 戶名：${bank.accountHolder}

寄送方式：${order.deliveryMethod}
轉帳後請告知「末五碼」，小幫手核對無誤後將立即包裝出貨並提供物流追蹤碼！謝謝您 ❤️`;
}
