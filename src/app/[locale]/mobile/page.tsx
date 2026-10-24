'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useBarPilotStore, ProductItem } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import { ProductThumb } from '@/components/ui/ProductThumb';
import {
  ArrowLeft,
  Plus,
  Minus,
  Send,
  Users,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  Receipt,
  X,
  Smartphone,
  Maximize2,
  Trash2,
  UtensilsCrossed,
  LayoutGrid,
  ChefHat,
  BarChart3,
  Wifi,
  BatteryCharging,
  Sparkles
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

type MobileTab = 'orders' | 'tables' | 'kds' | 'reports';

const mk = (id: string, name: string, price: number, category: ProductItem['category']): ProductItem => ({
  id,
  name_it: name,
  name_fr: name,
  price_cents: price,
  category,
  description_it: '',
  description_fr: '',
  is_available: true,
});

// Products matching the center smartphone mockup
const COFFEE_MENU: ProductItem[] = [
  mk('c1', 'Espresso', 150, 'coffee'),
  mk('c2', 'Cappuccino', 280, 'coffee'),
  mk('c3', 'Caffè latte', 320, 'coffee'),
  mk('c4', 'Macchiato', 170, 'coffee'),
  mk('c5', 'Americano', 250, 'coffee'),
  mk('c6', 'Caffè shakerato', 350, 'coffee'),
];

export default function MobileAppPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const lc = isIt ? 'it-IT' : 'fr-FR';

  const { tables, orders, createOrder } = useBarPilotStore();

  const [activeScreen, setActiveScreen] = useState<MobileTab>('orders');
  const [frameMode, setFrameMode] = useState<boolean>(true); // Smartphone chassis or full screen
  const [selectedTable, setSelectedTable] = useState('Tavolo 04');
  const [guestCount, setGuestCount] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState('coffee');
  
  // Cart items matching exact mockup numbers: 2 Cappuccini (5,60), 1 Espresso (1,50), 1 Croissant (1,80) = 8,90 €
  const [cart, setCart] = useState<{ product: ProductItem; quantity: number }[]>([
    { product: COFFEE_MENU[1], quantity: 2 },
    { product: COFFEE_MENU[0], quantity: 1 },
    { product: mk('f1', 'Croissant', 180, 'food'), quantity: 1 },
  ]);

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: isIt ? 'Tutti' : 'Tous' },
    { id: 'coffee', label: isIt ? 'Caffè' : 'Café' },
    { id: 'bevande', label: isIt ? 'Bevande' : 'Boissons' },
    { id: 'cocktails', label: 'Cocktail' },
    { id: 'cibo', label: isIt ? 'Cibo' : 'Cuisine' },
  ];

  const addToCart = (product: ProductItem) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(12);
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const decrementItem = (productId: string) => {
    setCart(prev =>
      prev
        .map(item => (item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const totalCents = cart.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    createOrder({
      table_id: 'tbl-4',
      table_number: selectedTable,
      server_name: 'Marco Rossi',
      items: cart,
    });
    setCart([]);
    showToast(isIt ? 'Comanda #1043 inviata al bancone!' : 'Commande #1043 envoyée au bar !');
  };

  return (
    <div className="min-h-full py-4 flex flex-col items-center justify-center select-none bp-fade-up">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 z-[99] bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Top Device Controls Bar */}
      <div className="mb-4 flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5 text-orange-600 font-bold">
          <Smartphone className="w-4 h-4" />
          <span>BarPilot Mobile POS</span>
        </span>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => setFrameMode(!frameMode)}
          className="text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{frameMode ? (isIt ? 'Espandi a schermo intero' : 'Plein écran') : (isIt ? 'Mostra cornice smartphone' : 'Cadre smartphone')}</span>
        </button>
      </div>

      {/* Smartphone Chassis or Fullscreen Container */}
      <div
        className={`transition-all duration-300 relative ${
          frameMode
            ? 'w-[390px] max-w-[94vw] h-[810px] rounded-[50px] bg-[#0f172a] p-3.5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.45)] ring-1 ring-slate-800 border-[4px] border-slate-800'
            : 'w-full max-w-xl min-h-[750px] rounded-3xl bg-white p-4 shadow-sm border border-slate-200'
        }`}
      >
        {/* Smartphone Screen Area */}
        <div className="w-full h-full rounded-[38px] bg-white overflow-hidden flex flex-col justify-between shadow-inner relative">
          
          {/* Top Status Bar (9:41, Wi-Fi, Battery, Dynamic Island) */}
          <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold text-slate-900 bg-white select-none shrink-0">
            <span>9:41</span>
            
            {/* Dynamic Island Notch */}
            <div className="w-24 h-4 rounded-full bg-slate-950 flex items-center justify-end px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <Wifi className="w-3 h-3" />
              <BatteryCharging className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* App Header (Back Arrow, BarPilot Logo, Marco Avatar) matching mockup */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
            <Link
              href={`/${locale}/dashboard`}
              className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                🍸
              </span>
              <span className="font-black text-sm tracking-tight text-slate-900">
                Bar<span className="text-orange-500">Pilot</span>
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              MR
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
            
            {/* Title: Nuova comanda */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {isIt ? 'Nuova comanda' : 'Nouvelle commande'}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isIt ? 'Cameriere: Marco' : 'Serveur: Marco'}
              </span>
            </div>

            {/* Table & Guest Counter matching mockup */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isIt ? 'Tavolo' : 'Table'}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900">
                  <span>{selectedTable}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-600">
                  <Users className="w-3.5 h-3.5" />
                  <span>{guestCount}</span>
                </div>

                <button
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Category Filter Pills matching mockup: Tutti, Caffè (active orange), Bevande, Cocktail, Cibo */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(c => {
                const active = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                      active
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* 3-Column Product Grid with Photos matching mockup */}
            <div className="grid grid-cols-3 gap-2">
              {COFFEE_MENU.map(product => {
                const count = cart.find(i => i.product.id === product.id)?.quantity || 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group active:scale-95 ${
                      count > 0
                        ? 'bg-orange-50/40 border-orange-300 ring-2 ring-orange-400/20'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Real Product Thumbnail Photo */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-1.5">
                      <ProductThumb name={product.name_it} size={110} rounded="rounded-xl" className="!w-full !h-full" />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-xs truncate leading-tight">
                        {product.name_it}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                        {formatCents(product.price_cents, lc)}
                      </span>
                    </div>

                    {/* Orange circle '+' button at bottom-right matching mockup */}
                    <div className="mt-1 flex items-center justify-between">
                      {count > 0 ? (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-700">
                          ×{count}
                        </span>
                      ) : <span />}

                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                        +
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Breakdown Table matching mockup */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100/60">
                  <div className="flex items-center gap-2">
                    <ProductThumb name={item.product.name_it} size={30} rounded="rounded-lg" />
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">{item.product.name_it}</span>
                      <span className="text-[10px] text-slate-400">{formatCents(item.product.price_cents, lc)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg text-slate-700 font-bold">
                      <button onClick={() => decrementItem(item.product.id)} className="hover:text-rose-600 px-0.5">-</button>
                      <span className="text-[11px] w-3 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item.product)} className="hover:text-orange-600 px-0.5">+</button>
                    </div>
                    <span className="font-black text-slate-900 w-12 text-right">
                      {formatCents(item.product.price_cents * item.quantity, lc)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Total row matching mockup: Totale 8,90 € */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  {isIt ? 'Totale' : 'Total'}
                </span>
                <span className="text-xl font-black text-slate-900">
                  {formatCents(totalCents, lc)}
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Actions Row matching mockup: '...', 'Salva', 'Invia comanda' */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
            <button
              onClick={() => setBillModalOpen(true)}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition shrink-0"
              title="Opzioni / Pre-conto"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => showToast(isIt ? 'Bozza salvata sul dispositivo' : 'Brouillon enregistré')}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
            >
              {isIt ? 'Salva' : 'Sauvegarder'}
            </button>

            <button
              onClick={handleSendOrder}
              disabled={cart.length === 0}
              className="flex-1 py-3 px-4 rounded-2xl bp-btn-primary text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>{isIt ? 'Invia comanda' : 'Envoyer commande'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="py-1 flex justify-center bg-white shrink-0">
            <div className="w-32 h-1 rounded-full bg-slate-300" />
          </div>

        </div>
      </div>

      {/* Bill & Split Modal */}
      {billModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-slate-900 shadow-2xl relative border border-slate-200 bp-fade-up">
            <button onClick={() => setBillModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center pb-3 border-b border-dashed border-slate-200">
              <h2 className="font-black text-base uppercase tracking-wider">Bar Centrale</h2>
              <p className="text-[11px] text-slate-500">Milano · {selectedTable}</p>
            </div>
            <div className="py-3 space-y-1.5 border-b border-dashed border-slate-200 text-xs">
              {cart.map(it => (
                <div key={it.product.id} className="flex justify-between">
                  <span>{it.quantity}× {it.product.name_it}</span>
                  <span className="font-bold">{formatCents(it.product.price_cents * it.quantity, lc)}</span>
                </div>
              ))}
            </div>
            <div className="py-2.5 flex justify-between font-black text-base">
              <span>TOTALE</span>
              <span>{formatCents(totalCents, lc)}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 my-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">{isIt ? 'Quota a testa:' : 'Par personne :'}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-6 h-6 rounded bg-white border border-slate-200 font-bold">-</button>
                <span className="font-bold">{splitCount}p</span>
                <button onClick={() => setSplitCount(splitCount + 1)} className="w-6 h-6 rounded bg-white border border-slate-200 font-bold">+</button>
                <span className="font-black text-orange-600 ml-1">
                  {formatCents(Math.ceil(totalCents / splitCount), lc)}
                </span>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 text-center uppercase pb-3">*** DOCUMENTO NON FISCALE ***</p>
            <button
              onClick={() => setBillModalOpen(false)}
              className="w-full py-2.5 bp-btn-primary text-xs"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
