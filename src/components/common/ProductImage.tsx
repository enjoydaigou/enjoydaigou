import React, { useState } from 'react';
import { Currency } from '../../types';
import {
  ShoppingBag,
  Sparkles,
  Shirt,
  Footprints,
  Coffee,
  Watch,
  Package,
  Layers,
} from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  category?: string;
  country?: Currency;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-40',
  category = '',
  country = 'JPY',
}) => {
  const [hasError, setHasError] = useState(false);

  // Category Icon selection
  const getCategoryIcon = () => {
    const cat = category.toLowerCase();
    if (cat.includes('包') || cat.includes('bag')) return ShoppingBag;
    if (cat.includes('香') || cat.includes('美妝') || cat.includes('保養')) return Sparkles;
    if (cat.includes('服') || cat.includes('衣') || cat.includes('針織')) return Shirt;
    if (cat.includes('鞋') || cat.includes('球鞋')) return Footprints;
    if (cat.includes('咖啡') || cat.includes('杯') || cat.includes('食品')) return Coffee;
    if (cat.includes('錶') || cat.includes('飾品') || cat.includes('精品')) return Watch;
    return Package;
  };

  const Icon = getCategoryIcon();

  // Subtle luxury background tints based on country
  const getCountryGradient = () => {
    switch (country) {
      case 'JPY':
        return 'from-amber-50/80 via-stone-100 to-amber-100/50 text-stone-700';
      case 'KRW':
        return 'from-sky-50/80 via-slate-100 to-blue-100/50 text-slate-700';
      case 'USD':
        return 'from-rose-50/70 via-stone-100 to-orange-100/40 text-stone-700';
      case 'EUR':
        return 'from-emerald-50/70 via-slate-100 to-teal-100/40 text-slate-700';
      default:
        return 'from-slate-100 via-stone-50 to-slate-200 text-slate-700';
    }
  };

  if (src && !hasError) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
        />
      </div>
    );
  }

  // Resilient Styled Fallback
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${getCountryGradient()} flex flex-col items-center justify-center p-4 border-b border-slate-200/60 select-none ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/80 shadow-2xs border border-white/60 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110">
        <Icon className="w-6 h-6 opacity-75" />
      </div>
      <span className="text-[11px] font-medium tracking-wide text-center line-clamp-1 opacity-80 max-w-[85%]">
        {alt}
      </span>
      <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase mt-0.5">
        {category || country}
      </span>
    </div>
  );
};
