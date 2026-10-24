'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  Wine,
  Coffee,
  Beer,
  Sparkles,
  UtensilsCrossed,
  Info,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function CustomerMenuPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');

  const { products, barName, barLocation } = useBarPilotStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const availableProducts = products.filter(p => p.is_available);

  const filteredProducts = availableProducts.filter(p => {
    return selectedCategory === 'all' || p.category === selectedCategory;
  });

  const categories = [
    { id: 'all', label_it: 'Tutto', label_fr: 'Tout' },
    { id: 'coffee', label_it: 'Caffè', label_fr: 'Café', icon: Coffee },
    { id: 'cocktails', label_it: 'Cocktail & Spritz', label_fr: 'Cocktails', icon: Sparkles },
    { id: 'beer', label_it: 'Birre', label_fr: 'Bières', icon: Beer },
    { id: 'food', label_it: 'Food & Taglieri', label_fr: 'Snacks & Planches', icon: UtensilsCrossed },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 max-w-md mx-auto shadow-2xl pb-12">
      
      {/* Brand Hero Banner */}
      <div className="relative bg-gradient-to-b from-amber-600/30 via-slate-900 to-slate-950 p-6 pt-8 text-center border-b border-slate-800">
        <div className="inline-flex p-1 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-xl shadow-amber-500/20 mb-3">
          <Image src="/logo.png" alt="BarPilot" width={56} height={56} className="rounded-xl object-contain" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">{barName}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{barLocation}</p>

        {tableParam && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs">
            <span>📍 {isIt ? `Ordinazione al Tavolo ${tableParam}` : `Service Table ${tableParam}`}</span>
          </div>
        )}
      </div>

      {/* Category Pills Strip */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800/80 px-4 py-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {isIt ? cat.label_it : cat.label_fr}
            </button>
          );
        })}
      </div>

      {/* Products Menu List */}
      <div className="p-4 space-y-3">
        {filteredProducts.map(product => {
          const name = isIt ? product.name_it : product.name_fr;
          const desc = isIt ? product.description_it : product.description_fr;

          return (
            <div
              key={product.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex justify-between items-start gap-3 hover:border-slate-700 transition"
            >
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {product.category}
                </span>
                <h3 className="font-bold text-white text-base mt-0.5">{name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-extrabold text-amber-400 block">
                  {formatCents(product.price_cents, isIt ? 'it-IT' : 'fr-FR')}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center justify-end gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isIt ? 'Disponibile' : 'Disponible'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 px-6 text-center text-xs text-slate-500 space-y-2">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-500/70" />
          <span>{isIt ? 'Menu Digitale Ufficiale certificato BarPilot' : 'Menu Digital Certifié BarPilot'}</span>
        </p>
        <p className="text-[11px] text-slate-600">
          {isIt 
            ? 'Per ordinare, un cameriere prenderà la comanda direttamente al vostro tavolo.' 
            : 'Pour commander, un serveur prendra votre commande directement à table.'}
        </p>
      </div>

    </div>
  );
}
