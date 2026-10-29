import React, { useState } from 'react';
import { CatalogProduct, CatalogSubItem, Currency, OrderItem, SystemSettings } from '../../types';
import { formatCurrencyAmount, formatTwd } from '../../utils/format';
import { exportCatalogToExcel } from '../../utils/excelExport';
import { ProductImage } from '../common/ProductImage';
import {
  Tags,
  Search,
  Plus,
  ShoppingBag,
  Copy,
  Check,
  Edit2,
  Trash2,
  Store,
  Layers,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';

interface CatalogViewProps {
  catalog: CatalogProduct[];
  settings: SystemSettings;
  onSaveProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickOrderWithItems: (items: OrderItem[], country: Currency) => void;
}

// Curated high-res proxy-buy photo presets for quick application
const PHOTO_PRESETS = [
  {
    name: '🧸 萌系娃娃/玩偶',
    url: 'https://images.unsplash.com/photo-1558679908-541bcf1249ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '🔑 角色包包吊飾',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '👜 日系潮流包袋',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '✨ 專櫃香氛美妝',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '👕 韓系設計服飾',
    url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '☕ 咖啡器物周邊',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  },
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  catalog,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onQuickOrderWithItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded card subitems tracking
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // Quick Order Modal state
  const [quickOrderProduct, setQuickOrderProduct] = useState<CatalogProduct | null>(null);
  const [selectedSubItemSelections, setSelectedSubItemSelections] = useState<
    Record<
      string,
      {
        selected: boolean;
        quantity: number;
        spec: string;
      }
    >
  >({});

  // Product Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  // Main Product Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('動漫周邊');
  const [formCountry, setFormCountry] = useState<Currency>('JPY');
  const [formStore, setFormStore] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'preorder' | 'discontinued'>('active');
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);

  // SubItems Form Fields (Multiple Items: 娃娃, 吊飾, 提袋...)
  const [formSubItems, setFormSubItems] = useState<CatalogSubItem[]>([]);

  const activeRateConfig = settings.exchangeRates[formCountry] || settings.exchangeRates.JPY;

  const toggleExpandCard = (id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    const cur: Currency = 'JPY';
    const rate = settings.exchangeRates[cur];
    const defFee = rate?.minServiceFeeTwd || 120;
    const defaultQuoteRate = rate?.quoteRate || 0.228;

    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormCategory('動漫周邊');
    setFormCountry(cur);
    setFormStore('官方直營專賣門市');
    setFormStatus('active');
    setFormDesc('');
    setFormImageUrl(PHOTO_PRESETS[0].url);
    setFormImages([PHOTO_PRESETS[0].url]);

    // Initial 2 sample sub-items: 娃娃 + 吊飾 (直接確認的價格上架，一口價免二補，支援最多 5 張圖)
    const initialSub1: CatalogSubItem = {
      id: `sub-${Date.now()}-1`,
      name: '絨毛玩偶娃娃 (30cm)',
      suggestedPriceTwd: 1350, // 直接確認售價
      originalPrice: 3800,     // 備註原幣 (¥)
      isSecondStageFreight: false, // 預設一口價免二補 (通常直接上確認的價格)
      estWeightKg: 0.35,
      serviceFeeTwd: defFee + 50,
      stockQty: 3,
      specOptions: ['標準款', '限定款'],
      imageUrl: 'https://images.unsplash.com/photo-1558679908-541bcf1249ff?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1558679908-541bcf1249ff?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      ],
    };

    const initialSub2: CatalogSubItem = {
      id: `sub-${Date.now()}-2`,
      name: '隨身包包毛絨吊飾 (鑰匙圈)',
      suggestedPriceTwd: 490,  // 直接確認售價
      originalPrice: 1500,     // 備註原幣 (¥)
      isSecondStageFreight: false, // 預設一口價免二補
      estWeightKg: 0.1,
      serviceFeeTwd: defFee,
      stockQty: 8,
      specOptions: ['角色 A 款', '角色 B 款'],
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      ],
    };

    setFormSubItems([initialSub1, initialSub2]);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: CatalogProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormCategory(prod.category);
    setFormCountry(prod.country);
    setFormStore(prod.sourceStore);
    setFormStatus(prod.status);
    setFormDesc(prod.description || '');

    const pImages = Array.isArray(prod.images) && prod.images.length > 0
      ? prod.images
      : (prod.imageUrl ? [prod.imageUrl] : []);
    setFormImageUrl(pImages[0] || prod.imageUrl || '');
    setFormImages(pImages);

    // Normalize subItems with up to 5 photos
    if (prod.subItems && prod.subItems.length > 0) {
      setFormSubItems(
        prod.subItems.map((s) => {
          const sImages = Array.isArray(s.images) && s.images.length > 0
            ? s.images
            : (s.imageUrl ? [s.imageUrl] : []);
          return {
            ...s,
            suggestedPriceTwd: s.suggestedPriceTwd || 490,
            isSecondStageFreight: !!s.isSecondStageFreight,
            imageUrl: sImages[0] || s.imageUrl || prod.imageUrl || '',
            images: sImages.slice(0, 5),
          };
        })
      );
    } else {
      const singleFallback: CatalogSubItem = {
        id: `sub-${prod.id}-1`,
        name: prod.name,
        suggestedPriceTwd: prod.suggestedPriceTwd || 490,
        originalPrice: prod.originalPrice,
        isSecondStageFreight: !!prod.isSecondStageFreight,
        estWeightKg: prod.estWeightKg || 0.2,
        serviceFeeTwd: prod.serviceFeeTwd || 100,
        stockQty: prod.stockQty || 0,
        specOptions: prod.specOptions || [],
        imageUrl: prod.imageUrl,
        images: prod.imageUrl ? [prod.imageUrl] : [],
      };
      setFormSubItems([singleFallback]);
    }

    setIsModalOpen(true);
  };

  // Product Main Images (up to 5 photos)
  const handleAddMainImages = (newUrls: string[]) => {
    setFormImages((prev) => {
      const combined = [...prev, ...newUrls].filter(Boolean).slice(0, 5);
      setFormImageUrl(combined[0] || '');
      return combined;
    });
  };

  const handleRemoveMainImage = (imgIdx: number) => {
    setFormImages((prev) => {
      const updated = [...prev];
      updated.splice(imgIdx, 1);
      setFormImageUrl(updated[0] || '');
      return updated;
    });
  };

  const handleSetMainProductCover = (imgIdx: number) => {
    setFormImages((prev) => {
      const updated = [...prev];
      if (imgIdx > 0 && imgIdx < updated.length) {
        const [target] = updated.splice(imgIdx, 1);
        updated.unshift(target);
        setFormImageUrl(target);
      }
      return updated;
    });
  };

  const handleMainBatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = Math.max(0, 5 - formImages.length);
    const targetFiles = files.slice(0, remaining);

    targetFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) {
          handleAddMainImages([res]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // SubItem Multi-Images (up to 5 photos)
  const handleSubItemAddImages = (subIndex: number, newUrls: string[]) => {
    setFormSubItems((prev) => {
      const updated = [...prev];
      const sub = { ...updated[subIndex] };
      const currentImgs = Array.isArray(sub.images) && sub.images.length > 0
        ? [...sub.images]
        : (sub.imageUrl ? [sub.imageUrl] : []);
      const combined = [...currentImgs, ...newUrls].filter(Boolean).slice(0, 5);
      sub.images = combined;
      sub.imageUrl = combined[0] || '';
      updated[subIndex] = sub;
      return updated;
    });
  };

  const handleSubItemRemoveImage = (subIndex: number, imgIdx: number) => {
    setFormSubItems((prev) => {
      const updated = [...prev];
      const sub = { ...updated[subIndex] };
      const currentImgs = Array.isArray(sub.images) && sub.images.length > 0
        ? [...sub.images]
        : (sub.imageUrl ? [sub.imageUrl] : []);
      currentImgs.splice(imgIdx, 1);
      sub.images = currentImgs;
      sub.imageUrl = currentImgs[0] || '';
      updated[subIndex] = sub;
      return updated;
    });
  };

  const handleSubItemSetMainImage = (subIndex: number, imgIdx: number) => {
    setFormSubItems((prev) => {
      const updated = [...prev];
      const sub = { ...updated[subIndex] };
      const currentImgs = Array.isArray(sub.images) && sub.images.length > 0
        ? [...sub.images]
        : (sub.imageUrl ? [sub.imageUrl] : []);
      if (imgIdx > 0 && imgIdx < currentImgs.length) {
        const [target] = currentImgs.splice(imgIdx, 1);
        currentImgs.unshift(target);
        sub.images = currentImgs;
        sub.imageUrl = target;
        updated[subIndex] = sub;
      }
      return updated;
    });
  };

  const handleSubItemBatchFileUpload = (subIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const currentSub = formSubItems[subIndex];
    const currentImgs = Array.isArray(currentSub.images) && currentSub.images.length > 0
      ? currentSub.images
      : (currentSub.imageUrl ? [currentSub.imageUrl] : []);
    const remaining = Math.max(0, 5 - currentImgs.length);
    const targetFiles = files.slice(0, remaining);

    targetFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) {
          handleSubItemAddImages(subIndex, [res]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // SubItems Manipulation (直接確認售價上架，通常免二補一口價)
  const handleAddSubItem = () => {
    const newSub: CatalogSubItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `新商品品項 ${formSubItems.length + 1} (如: 娃娃/吊飾/徽章)`,
      suggestedPriceTwd: 490,      // 直接確認售價 (NT$)
      originalPrice: 1500,         // 備註原幣 (¥，選填方便現場採購/核對成本)
      isSecondStageFreight: false, // 預設一口價免二補 (通常直接上確認價格)
      estWeightKg: 0.2,
      serviceFeeTwd: 100,
      stockQty: 5,
      specOptions: ['款式 A', '款式 B'],
      imageUrl: formImageUrl || PHOTO_PRESETS[1].url,
    };

    setFormSubItems([...formSubItems, newSub]);
  };

  const handleDuplicateSubItem = (index: number) => {
    const target = formSubItems[index];
    const duplicated: CatalogSubItem = {
      ...target,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (複製款)`,
    };
    const updated = [...formSubItems];
    updated.splice(index + 1, 0, duplicated);
    setFormSubItems(updated);
  };

  const handleRemoveSubItem = (index: number) => {
    if (formSubItems.length <= 1) {
      alert('商品至少需包含一個品項（例如：娃娃或吊飾）');
      return;
    }
    setFormSubItems(formSubItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateSubItem = (
    index: number,
    field: keyof CatalogSubItem,
    value: any
  ) => {
    setFormSubItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      updated[index] = item;
      return updated;
    });
  };

  // Optional calculation helper if seller clicks "✨ 依原幣換算帶入"
  const handleQuickCalcFromOriginal = (index: number) => {
    setFormSubItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const orig = Number(item.originalPrice) || 0;
      const fee = Number(item.serviceFeeTwd) || activeRateConfig?.minServiceFeeTwd || 120;
      const calculated = Math.round(orig * activeRateConfig.quoteRate + fee);
      if (calculated > 0) {
        updated[index] = { ...item, suggestedPriceTwd: calculated };
      }
      return updated;
    });
  };

  const handleSaveProduct = () => {
    if (!formName.trim()) {
      alert('請填寫商品名稱');
      return;
    }

    if (formSubItems.length === 0) {
      alert('請至少新增一個商品品項（例如：娃娃、吊飾等）');
      return;
    }

    // Direct confirmed price validation & up to 5 photos
    const validatedSubItems: CatalogSubItem[] = formSubItems.map((sub, idx) => {
      const confirmedPrice = Number(sub.suggestedPriceTwd) || 490;
      const subImgs = Array.isArray(sub.images) && sub.images.length > 0
        ? sub.images
        : (sub.imageUrl ? [sub.imageUrl] : []);

      return {
        ...sub,
        name: sub.name.trim() || `品項 ${idx + 1}`,
        suggestedPriceTwd: confirmedPrice,
        originalPrice:
          sub.originalPrice !== undefined && sub.originalPrice !== null && !isNaN(Number(sub.originalPrice))
            ? Number(sub.originalPrice)
            : undefined,
        isSecondStageFreight: !!sub.isSecondStageFreight,
        serviceFeeTwd: Number(sub.serviceFeeTwd) || 0,
        estWeightKg: Number(sub.estWeightKg) || 0.2,
        stockQty: Number(sub.stockQty) || 0,
        specOptions: sub.specOptions?.filter((s) => s.trim().length > 0) || [],
        imageUrl: subImgs[0] || sub.imageUrl || formImageUrl || undefined,
        images: subImgs.slice(0, 5),
      };
    });

    const firstSub = validatedSubItems[0];
    const pImages = formImages.length > 0
      ? formImages
      : (formImageUrl ? [formImageUrl] : (firstSub.images || []));

    const newProd: CatalogProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      sku: formSku || `SKU-${Date.now().toString().slice(-6)}`,
      name: formName,
      category: formCategory,
      country: formCountry,
      sourceStore: formStore || '專賣門市 / 官方官網',
      status: formStatus,
      description: formDesc,
      imageUrl: pImages[0] || formImageUrl || firstSub.imageUrl || undefined,
      images: pImages.slice(0, 5),
      subItems: validatedSubItems,
      isSecondStageFreight: validatedSubItems.some((s) => s.isSecondStageFreight),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),

      // Backward compatibility fields
      originalPrice: firstSub.originalPrice,
      estWeightKg: firstSub.estWeightKg,
      serviceFeeTwd: firstSub.serviceFeeTwd,
      suggestedPriceTwd: firstSub.suggestedPriceTwd,
      stockQty: firstSub.stockQty,
      specOptions: firstSub.specOptions,
    };

    onSaveProduct(newProd);
    setIsModalOpen(false);
  };

  // Generate copy for LINE/IG social posts
  const handleCopyPromoCopy = (prod: CatalogProduct) => {
    const subList = prod.subItems?.length
      ? prod.subItems
          .map((sub, i) => {
            const specStr = sub.specOptions?.length ? ` (可選：${sub.specOptions.join('/')})` : '';
            const origStr = sub.originalPrice ? ` [原幣標價：${formatCurrencyAmount(sub.originalPrice, prod.country)}]` : '';
            const freightTag = sub.isSecondStageFreight ? '⚠️ 抵台後二補空運費' : '✅ 免二補運費·一口價全款';
            return `  ${i + 1}️⃣ 【${sub.name}】\n     💰 確認售價：${formatTwd(
              sub.suggestedPriceTwd
            )} (${freightTag})${origStr}\n     📦 庫存狀態：${
              sub.stockQty > 0 ? `現貨 ${sub.stockQty} 件` : '連線預購'
            }${specStr}`;
          })
          .join('\n\n')
      : `  💰 確認售價：${formatTwd(prod.suggestedPriceTwd)}`;

    const promo = `✨【${prod.country} 連線現正預購 · ${prod.name}】
🏷️ 分類：${prod.category} | 來源：${prod.sourceStore}
${prod.description ? `📝 商品特色：${prod.description}\n` : ''}
🔥 本系列熱門品項與確認報價：
${subList}

⚡ 下單方式：直接私訊告知「想要品項＋款式色號＋數量」，小幫手即刻開立專屬委託單！
預計出貨：${prod.status === 'active' ? '部分現貨庫存，其餘收單後赴當地採購回台' : '海外連線預購，抵台完成檢貨即寄出'}`;

    navigator.clipboard.writeText(promo);
    setCopiedId(prod.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Order Launcher Modal
  const openQuickOrderModal = (prod: CatalogProduct) => {
    setQuickOrderProduct(prod);
    const initialMap: Record<
      string,
      {
        selected: boolean;
        quantity: number;
        spec: string;
      }
    > = {};

    prod.subItems.forEach((sub, idx) => {
      // By default, select first item
      initialMap[sub.id] = {
        selected: idx === 0,
        quantity: 1,
        spec: sub.specOptions?.[0] || '',
      };
    });

    setSelectedSubItemSelections(initialMap);
  };

  const handleConfirmQuickOrder = () => {
    if (!quickOrderProduct) return;

    const rate = settings.exchangeRates[quickOrderProduct.country]?.quoteRate || 1;
    const selectedItems: OrderItem[] = [];

    quickOrderProduct.subItems.forEach((sub) => {
      const config = selectedSubItemSelections[sub.id];
      if (config && config.selected && config.quantity > 0) {
        // Direct confirmed price!
        const unit = Number(sub.suggestedPriceTwd) || 490;
        const subtotal = unit * config.quantity;

        const displayName =
          quickOrderProduct.name === sub.name
            ? sub.name
            : `${quickOrderProduct.name} - ${sub.name}`;

        selectedItems.push({
          id: `order-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: displayName,
          category: quickOrderProduct.category,
          country: quickOrderProduct.country,
          sourceStore: quickOrderProduct.sourceStore,
          originalPrice: sub.originalPrice,
          exchangeRate: rate,
          serviceFeeTwd: sub.serviceFeeTwd || 0,
          estWeightKg: sub.estWeightKg || 0.2,
          quantity: config.quantity,
          unitPriceTwd: unit,
          subtotalTwd: subtotal,
          isSecondStageFreight: !!sub.isSecondStageFreight,
          spec: config.spec || undefined,
          purchaseStatus: 'pending',
          imageUrl: sub.imageUrl || quickOrderProduct.imageUrl,
        });
      }
    });

    if (selectedItems.length === 0) {
      alert('請至少勾選一項要代購的品項');
      return;
    }

    onQuickOrderWithItems(selectedItems, quickOrderProduct.country);
    setQuickOrderProduct(null);
  };

  const filteredCatalog = catalog.filter((p) => {
    if (selectedCountry !== 'all' && p.country !== selectedCountry) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchStore = p.sourceStore.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchSub = p.subItems?.some(
        (sub) =>
          sub.name.toLowerCase().includes(q) ||
          sub.specOptions?.some((s) => s.toLowerCase().includes(q))
      );
      if (!matchName && !matchSku && !matchStore && !matchCategory && !matchSub) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Tags className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">連線商品庫與常用商品上架</h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  多品項自由選購
                </span>
              </div>
              <p className="text-xs text-slate-500">
                可上架單品或系列商品，內含多種品項（如：娃娃、吊飾、包包等），支援商品圖與一鍵快速開單！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportCatalogToExcel(filteredCatalog)}
              title="匯出商品上架庫目錄為 Excel 檔案 (.xlsx)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>匯出 Excel 目錄</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>＋ 上架新商品 (支援多品項)</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">採購國：</span>
            <div className="flex items-center gap-1">
              {['all', 'JPY', 'KRW', 'USD', 'EUR'].map((cur) => (
                <button
                  key={cur}
                  onClick={() => setSelectedCountry(cur)}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    selectedCountry === cur
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cur === 'all' ? '全部' : cur}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">販售狀態：</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: '全部' },
                { id: 'active', label: '現貨/常態' },
                { id: 'preorder', label: '連線預購' },
                { id: 'discontinued', label: '已下架' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    selectedStatus === st.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 sm:max-w-xs relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋商品系列、品項（娃娃/吊飾）、店家..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Catalog Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCatalog.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50 text-blue-500" />
            <p className="text-sm font-medium text-slate-700">查無上架商品</p>
            <p className="text-xs text-slate-500 mt-1">點擊上方「＋ 上架新商品」建立第一筆連線商品庫存</p>
          </div>
        ) : (
          filteredCatalog.map((product) => {
            const isCopied = copiedId === product.id;
            const subCount = product.subItems?.length || 1;
            const isExpanded = !!expandedCardIds[product.id];

            const prices = product.subItems?.map((s) => s.suggestedPriceTwd) || [
              product.suggestedPriceTwd || 0,
            ];
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            const validOrigPrices = (product.subItems || [])
              .map((s) => s.originalPrice)
              .filter((p): p is number => typeof p === 'number' && p > 0);
            const minOrig = validOrigPrices.length > 0 ? Math.min(...validOrigPrices) : 0;
            const maxOrig = validOrigPrices.length > 0 ? Math.max(...validOrigPrices) : 0;

            const statusBadge =
              product.status === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : product.status === 'preorder'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-600';

            const statusText =
              product.status === 'active'
                ? '現貨/常態'
                : product.status === 'preorder'
                ? '連線預購'
                : '已下架';

            // Items to display in collapsed view (up to 3)
            const displayedSubItems = isExpanded
              ? product.subItems
              : product.subItems.slice(0, 3);

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div>
                  {/* Product Image Banner */}
                  <div className="relative">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      category={product.category}
                      country={product.country}
                      className="w-full h-44"
                    />

                    {/* Country & Status floating badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
                        {product.country}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-600/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{subCount} 個品項</span>
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium shadow-xs backdrop-blur-xs ${statusBadge}`}
                      >
                        {statusText}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[11px] font-mono text-slate-500 mb-0.5">
                        {product.sku}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{product.sourceStore}</span>
                        <span>·</span>
                        <span className="text-slate-600 shrink-0 font-medium">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    {/* Price Range Badge */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[11px] text-slate-500">原幣範圍</div>
                        <div className="font-mono font-medium text-slate-700">
                          {minOrig === maxOrig
                            ? formatCurrencyAmount(minOrig, product.country)
                            : `${formatCurrencyAmount(minOrig, product.country)} ~ ${formatCurrencyAmount(
                                maxOrig,
                                product.country
                              )}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-blue-600 font-medium">代購售價區間</div>
                        <div className="font-mono text-sm font-bold text-slate-900">
                          {minPrice === maxPrice
                            ? formatTwd(minPrice)
                            : `${formatTwd(minPrice)} ~ ${formatTwd(maxPrice)}`}
                        </div>
                      </div>
                    </div>

                    {/* Sub-Items List (娃娃, 吊飾...) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <span>選購品項明細</span>
                          <span className="text-[10px] text-slate-600 font-normal">
                            ({product.subItems.length} 項)
                          </span>
                        </span>
                        {product.subItems.length > 3 && (
                          <button
                            onClick={() => toggleExpandCard(product.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? '收合' : `展開全部`}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
                        {displayedSubItems.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded border border-slate-200 overflow-hidden bg-white shrink-0">
                                <ProductImage
                                  src={sub.imageUrl || product.imageUrl}
                                  alt={sub.name}
                                  category={product.category}
                                  country={product.country}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-slate-800 truncate">
                                  {sub.name}
                                </div>
                                {sub.specOptions && sub.specOptions.length > 0 && (
                                  <div className="text-[10px] text-slate-600 truncate">
                                    {sub.specOptions.join(' / ')}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="flex items-center justify-end gap-1.5">
                                {sub.isSecondStageFreight ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                    需二補
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                    一口價
                                  </span>
                                )}
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  {formatTwd(sub.suggestedPriceTwd)}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                                {sub.originalPrice ? (
                                  <span>({formatCurrencyAmount(sub.originalPrice, product.country)})</span>
                                ) : null}
                                <span>·</span>
                                <span>{sub.stockQty > 0 ? `現貨 ${sub.stockQty} 件` : '連線預購'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyPromoCopy(product)}
                      title="複製 LINE/IG 連線開團文案"
                      className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px] font-medium">{isCopied ? '已複製' : '開團文案'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(product)}
                      title="編輯商品與品項"
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => openQuickOrderModal(product)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>幫客人下單</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Quick Order SubItem Selector (幫客人下單) */}
      {quickOrderProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    幫客人快速下單 · 選擇品項
                  </h3>
                  <p className="text-xs text-slate-500">{quickOrderProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickOrderProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                請勾選客人想要委託的品項與數量，確認後自動帶入開單管理：
              </p>

              <div className="space-y-2.5">
                {quickOrderProduct.subItems.map((sub) => {
                  const sel = selectedSubItemSelections[sub.id] || {
                    selected: false,
                    quantity: 1,
                    spec: sub.specOptions?.[0] || '',
                  };

                  return (
                    <div
                      key={sub.id}
                      className={`p-3 rounded-xl border transition-all ${
                        sel.selected
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={sel.selected}
                          onChange={(e) => {
                            setSelectedSubItemSelections((prev) => ({
                              ...prev,
                              [sub.id]: {
                                ...sel,
                                selected: e.target.value === 'true' || e.target.checked,
                              },
                            }));
                          }}
                          className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />

                        <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 relative">
                          <ProductImage
                            src={(sub.images && sub.images[0]) || sub.imageUrl || quickOrderProduct.imageUrl}
                            alt={sub.name}
                            category={quickOrderProduct.category}
                            country={quickOrderProduct.country}
                            className="w-full h-full"
                          />
                          {sub.images && sub.images.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 rounded-tl font-mono">
                              {sub.images.length}圖
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {sub.isSecondStageFreight ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                  需二補
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                  一口價免二補
                                </span>
                              )}
                              <span className="font-mono font-bold text-xs text-blue-700">
                                {formatTwd(sub.suggestedPriceTwd)}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1">
                            {sub.originalPrice ? (
                              <span>原幣標價：{formatCurrencyAmount(sub.originalPrice, quickOrderProduct.country)} · </span>
                            ) : null}
                            <span>預估 {sub.estWeightKg || 0.2}kg</span>
                            {sub.stockQty > 0 ? (
                              <span className="text-emerald-600 font-medium">
                                (現貨 {sub.stockQty} 件)
                              </span>
                            ) : (
                              <span className="text-blue-600 font-medium">(連線預購)</span>
                            )}
                          </div>

                          {/* Options if checked */}
                          {sel.selected && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                              {sub.specOptions && sub.specOptions.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-slate-500">款式：</span>
                                  <select
                                    value={sel.spec}
                                    onChange={(e) => {
                                      const newSpec = e.target.value;
                                      setSelectedSubItemSelections((prev) => ({
                                        ...prev,
                                        [sub.id]: { ...sel, spec: newSpec },
                                      }));
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                                  >
                                    {sub.specOptions.map((sp) => (
                                      <option key={sp} value={sp}>
                                        {sp}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div />
                              )}

                              <div className="flex items-center gap-1.5 ml-auto">
                                <span className="text-[11px] text-slate-500">數量：</span>
                                <div className="flex items-center border border-slate-200 rounded bg-white">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = Math.max(1, sel.quantity - 1);
                                      setSelectedSubItemSelections((prev) => ({
                                        ...prev,
                                        [sub.id]: { ...sel, quantity: next },
                                      }));
                                    }}
                                    className="px-2 py-0.5 text-slate-600 hover:bg-slate-100"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 font-mono text-xs">{sel.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubItemSelections((prev) => ({
                                        ...prev,
                                        [sub.id]: { ...sel, quantity: sel.quantity + 1 },
                                      }));
                                    }}
                                    className="px-2 py-0.5 text-slate-600 hover:bg-slate-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Calculation */}
              {(() => {
                let totalTwd = 0;
                let totalCount = 0;
                quickOrderProduct.subItems.forEach((sub) => {
                  const s = selectedSubItemSelections[sub.id];
                  if (s && s.selected) {
                    totalTwd += sub.suggestedPriceTwd * s.quantity;
                    totalCount += s.quantity;
                  }
                });

                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      已選擇 <span className="font-bold text-slate-900">{totalCount}</span> 件品項
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500">預計開單總額：</span>
                      <span className="text-base font-bold font-mono text-blue-700">
                        {formatTwd(totalTwd)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickOrderProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickOrder}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                <span>帶入開單管理</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Product with Multiple SubItems */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingProduct ? '編輯上架商品與品項' : '＋ 上架新代購商品 (包含娃娃、吊飾等多品項)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    上架一個商品系列，並在內部新增多個可選品項，開單時秒級勾選！
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* SECTION 1: Product Header & Photo */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>1. 商品系列資訊與商品主圖</span>
                </span>

                {/* Main Product Images (Up to 5 Photos) */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-slate-800 font-bold text-xs">
                      商品系列展示相簿 (支援最多 5 張圖片，第 1 張為預設封面)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      已加入 {formImages.length} / 5 張圖片
                    </span>
                  </div>

                  {/* 5 Photo Slots */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {formImages.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        className={`group relative w-20 h-20 rounded-xl border-2 overflow-hidden bg-white shrink-0 shadow-2xs transition-all ${
                          imgIdx === 0 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`系列展示圖 ${imgIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Cover Badge / Set Cover */}
                        {imgIdx === 0 ? (
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                            封面
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetMainProductCover(imgIdx)}
                            title="設為第 1 張封面圖"
                            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded transition-opacity cursor-pointer font-medium"
                          >
                            設為封面
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleRemoveMainImage(imgIdx)}
                          title="移除照片"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded">
                          {imgIdx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Upload Slot if < 5 */}
                    {formImages.length < 5 && (
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/60 bg-white flex flex-col items-center justify-center text-blue-600 cursor-pointer transition-all shrink-0">
                        <Upload className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px] font-bold">上傳照片</span>
                        <span className="text-[9px] text-slate-400">可多選 (至多5張)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleMainBatchFileUpload}
                        />
                      </label>
                    )}
                  </div>

                  {/* Add URL input if < 5 */}
                  {formImages.length < 5 && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        id="main-product-url-input"
                        placeholder="或貼上網路圖片網址 (https://...)"
                        className="flex-1 text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const target = e.target as HTMLInputElement;
                            if (target.value.trim()) {
                              handleAddMainImages([target.value.trim()]);
                              target.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('main-product-url-input') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            handleAddMainImages([input.value.trim()]);
                            input.value = '';
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
                      >
                        加入圖片
                      </button>
                    </div>
                  )}

                      {/* Photo Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-slate-500">示範圖庫：</span>
                        {PHOTO_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setFormImageUrl(preset.url)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                {/* Series Name and SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">
                      商品系列名稱 *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="例：吉卜力 橡子共和國 龍貓周邊系列 / Chiikawa 連線特輯"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">SKU 編號</label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Country, Category, Store, Status */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">採購國別 *</label>
                    <select
                      value={formCountry}
                      onChange={(e) => {
                        const cur = e.target.value as Currency;
                        setFormCountry(cur);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="JPY">日本 (JPY)</option>
                      <option value="KRW">韓國 (KRW)</option>
                      <option value="USD">美國 (USD)</option>
                      <option value="EUR">歐洲 (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">商品分類</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="動漫周邊 / 流行服飾"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">來源門市/官網</label>
                    <input
                      type="text"
                      value={formStore}
                      onChange={(e) => setFormStore(e.target.value)}
                      placeholder="專門店 / 直營門市"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">販售模式</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="active">常態販售 / 現貨</option>
                      <option value="preorder">連線預購制</option>
                      <option value="discontinued">暫停販售 (已下架)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-slate-700 font-medium mb-1">商品特色與連線描述</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="描述系列特色、限購規則或發售日..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* SECTION 2: Sub-items Management (娃娃、吊飾...) */}
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                  <span className="text-base leading-none">💡</span>
                  <div>
                    <span className="font-bold">價格上架已大幅簡化：</span>
                    直接填入每個品項的<strong className="text-amber-950">【確認售價 (NT$)】</strong>即可！
                    通常代購都是直接一口價（全款免二補），只有少部分特殊品才需勾選二補運費；原幣 (¥) 可作為備註參考。
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>2. 內部包含的商品品項列表 (例如：娃娃、吊飾、徽章等)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]">
                      共 {formSubItems.length} 項
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSubItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>＋ 新增品項 (娃娃、吊飾...)</span>
                  </button>
                </div>

                {/* SubItems Cards */}
                <div className="space-y-3">
                  {formSubItems.map((subItem, index) => {
                    return (
                      <div
                        key={subItem.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        {/* SubItem Header Row */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={subItem.name}
                              onChange={(e) =>
                                handleUpdateSubItem(index, 'name', e.target.value)
                              }
                              placeholder="品項名稱 (例：30cm 絨毛玩偶娃娃、包包吊飾鑰匙圈)"
                              className="font-bold text-slate-900 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg flex-1 max-w-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDuplicateSubItem(index)}
                              title="複製此品項 (快速建立同系列下一款)"
                              className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>複製</span>
                            </button>
                            {formSubItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSubItem(index)}
                                title="刪除品項"
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* SubItem 5-Photo Gallery */}
                        <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                              <span>品項照片展示 (支援最多 5 張圖片，第 1 張為預設封面)</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                已上傳 {(subItem.images?.length || (subItem.imageUrl ? 1 : 0))} / 5 張
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                第 1 張為主要封面
                              </span>
                            </div>
                          </div>

                          {/* 5 Photo Slots */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            {(subItem.images && subItem.images.length > 0
                              ? subItem.images
                              : subItem.imageUrl
                              ? [subItem.imageUrl]
                              : []
                            ).map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                className={`group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden bg-white shrink-0 shadow-2xs transition-all ${
                                  imgIdx === 0
                                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`品項照片 ${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {/* Cover Badge / Set Cover */}
                                {imgIdx === 0 ? (
                                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                                    封面
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSubItemSetMainImage(index, imgIdx)}
                                    title="設為第一張封面圖"
                                    className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded transition-opacity cursor-pointer font-medium"
                                  >
                                    設為封面
                                  </button>
                                )}

                                {/* Delete Photo */}
                                <button
                                  type="button"
                                  onClick={() => handleSubItemRemoveImage(index, imgIdx)}
                                  title="移除此張照片"
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                >
                                  <X className="w-3 h-3" />
                                </button>

                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded">
                                  {imgIdx + 1}
                                </span>
                              </div>
                            ))}

                            {/* Add Photo Slot if < 5 */}
                            {(subItem.images?.length || (subItem.imageUrl ? 1 : 0)) < 5 && (
                              <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/60 bg-white flex flex-col items-center justify-center text-blue-600 cursor-pointer transition-all shrink-0">
                                <Upload className="w-4 h-4 mb-0.5" />
                                <span className="text-[10px] font-bold">上傳照片</span>
                                <span className="text-[9px] text-slate-400">可多選 (至多5張)</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleSubItemBatchFileUpload(index, e)}
                                />
                              </label>
                            )}
                          </div>

                          {/* Quick URL Input for subitem if < 5 */}
                          {(subItem.images?.length || (subItem.imageUrl ? 1 : 0)) < 5 && (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                id={`subitem-url-${index}`}
                                placeholder="或貼上網路圖片網址 (https://...)"
                                className="flex-1 text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const target = e.target as HTMLInputElement;
                                    if (target.value.trim()) {
                                      handleSubItemAddImages(index, [target.value.trim()]);
                                      target.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`subitem-url-${index}`) as HTMLInputElement;
                                  if (el && el.value.trim()) {
                                    handleSubItemAddImages(index, [el.value.trim()]);
                                    el.value = '';
                                  }
                                }}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
                              >
                                加入圖片
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Pricing, Freight, Weight, and Stock inputs */}
                        <div className="space-y-3">
                            {/* Row 1: Direct Confirmed Price (Primary) & Optional Foreign Currency Note */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/40 border border-blue-200/80 rounded-xl">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs font-bold text-blue-900 flex items-center gap-1">
                                    <span>💰 確認售價 (NT$) *</span>
                                    <span className="text-[10px] font-normal text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded-full">直接確認的價格</span>
                                  </label>
                                  {subItem.originalPrice ? (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickCalcFromOriginal(index)}
                                      title="若想依原幣匯率速算，點此自動填入"
                                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-0.5"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>依原幣換算帶入</span>
                                    </button>
                                  ) : null}
                                </div>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-xs font-bold text-blue-600">NT$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={subItem.suggestedPriceTwd || ''}
                                    onChange={(e) =>
                                      handleUpdateSubItem(
                                        index,
                                        'suggestedPriceTwd',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    placeholder="490"
                                    className="w-full pl-11 pr-3 py-2 bg-white border border-blue-300 rounded-lg font-mono font-bold text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                                  />
                                </div>
                                <p className="text-[10px] text-blue-700/80 mt-1">
                                  免複雜計算！直接輸入給客人的最終確認台幣售價。
                                </p>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                  備註原幣價格 ({activeRateConfig.symbol}，選填)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-xs font-mono font-medium text-slate-500">
                                    {activeRateConfig.symbol}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={subItem.originalPrice !== undefined ? subItem.originalPrice : ''}
                                    onChange={(e) =>
                                      handleUpdateSubItem(
                                        index,
                                        'originalPrice',
                                        e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                                      )
                                    }
                                    placeholder="例：1650 (選填)"
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  方便現場採購/核對成本標價，不影響確認台幣售價。
                                </p>
                              </div>
                            </div>

                            {/* Row 2: Freight Compensation Mode (通常是一口價，少部分才需二補) */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                                運費補款模式 (通常都是直接上確認的價格)
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubItem(index, 'isSecondStageFreight', false)}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                                    !subItem.isSecondStageFreight
                                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    !subItem.isSecondStageFreight
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-slate-300'
                                  }`}>
                                    {!subItem.isSecondStageFreight && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                      <span>一口價 (免二補 / 包國際運費)</span>
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">通常都是此模式</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      直接一口價到手，全額付清免二次秤重催補款。
                                    </p>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubItem(index, 'isSecondStageFreight', true)}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                                    subItem.isSecondStageFreight
                                      ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500/30'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    subItem.isSecondStageFreight
                                      ? 'border-amber-600 bg-amber-600 text-white'
                                      : 'border-slate-300'
                                  }`}>
                                    {subItem.isSecondStageFreight && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                      <span>需二補運費 (抵台秤重補款)</span>
                                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">少部分特殊商品</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      大型公仔、大抱枕或超重商品，抵台後依實重計收尾款。
                                    </p>
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Row 3: Stock & Sale Mode & Weight & Specs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[11px] text-slate-700 font-bold mb-1">
                                  販售模式
                                </label>
                                <select
                                  value={subItem.saleMode || ((subItem.stockQty ?? 0) > 0 ? 'in_stock' : 'preorder')}
                                  onChange={(e) => {
                                    const mode = e.target.value as 'in_stock' | 'preorder';
                                    handleUpdateSubItem(index, 'saleMode', mode);
                                    if (mode === 'preorder') {
                                      handleUpdateSubItem(index, 'stockQty', 0);
                                    } else if ((subItem.stockQty ?? 0) === 0) {
                                      handleUpdateSubItem(index, 'stockQty', 3);
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                                >
                                  <option value="in_stock">⚡ 現貨供應 (填庫存)</option>
                                  <option value="preorder">📦 海外專櫃連線預購</option>
                                </select>
                              </div>

                              {(subItem.saleMode || ((subItem.stockQty ?? 0) > 0 ? 'in_stock' : 'preorder')) === 'in_stock' ? (
                                <div>
                                  <label className="block text-[11px] text-slate-600 font-medium mb-1">
                                    現貨庫存件數
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={subItem.stockQty || 1}
                                    onChange={(e) =>
                                      handleUpdateSubItem(
                                        index,
                                        'stockQty',
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                    placeholder="現貨件數"
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold text-emerald-800"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-[11px] text-slate-600 font-medium mb-1">
                                    預購發貨說明 (選填)
                                  </label>
                                  <input
                                    type="text"
                                    value={subItem.preorderNotice || ''}
                                    onChange={(e) => handleUpdateSubItem(index, 'preorderNotice', e.target.value)}
                                    placeholder="例：下單後 7-14 個工作天抵台"
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                                  預估重量 (kg)
                                </label>
                                <input
                                  type="number"
                                  step="0.05"
                                  value={subItem.estWeightKg || 0.2}
                                  onChange={(e) =>
                                    handleUpdateSubItem(
                                      index,
                                      'estWeightKg',
                                      parseFloat(e.target.value) || 0.2
                                    )
                                  }
                                  placeholder="0.2"
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                                />
                              </div>
                            </div>

                            <div className="mt-2.5">
                              <label className="block text-[11px] text-slate-600 font-medium mb-1">
                                可選規格/款式 (逗號分隔)
                              </label>
                              <input
                                type="text"
                                value={subItem.specOptions ? subItem.specOptions.join(', ') : ''}
                                onChange={(e) => {
                                  const specs = e.target.value
                                    .split(/[,，\n]/)
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  handleUpdateSubItem(index, 'specOptions', specs);
                                }}
                                placeholder="例：灰大龍貓, 藍中龍貓"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>


                            {/* SubItem Price Bar Summary */}
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  subItem.isSecondStageFreight
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {subItem.isSecondStageFreight ? '⚠️ 抵台需二補空運費' : '✅ 一口價免二補 (全款含運)'}
                                </span>
                                {subItem.originalPrice ? (
                                  <span className="text-slate-500 text-[11px]">
                                    原幣標價：{activeRateConfig.symbol}{subItem.originalPrice}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">未備註原幣</span>
                                )}
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-slate-600 font-medium">確認售價：</span>
                                <span className="text-base font-bold font-mono text-blue-700">
                                  {formatTwd(subItem.suggestedPriceTwd || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={handleAddSubItem}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-700 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50/50"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>＋ 繼續新增品項 (例如：吊飾、娃娃、零錢包、徽章...)</span>
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {editingProduct && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`確定要刪除商品「${editingProduct.name}」嗎？`)) {
                      onDeleteProduct(editingProduct.id);
                      setIsModalOpen(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  刪除商品系列
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingProduct ? '更新商品與品項' : '確認上架'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
