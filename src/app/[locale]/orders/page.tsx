'use client';

import React, { useState, use } from 'react';
import { useBarPilotStore, ProductItem } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  Send,
  Coffee,
  Beer,
  Sparkles,
  Search,
  Receipt,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  ChevronDown,
  Users,
  MoreHorizontal
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function OrdersPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const {
    tables,
    products,
    orders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
  } = useBarPilotStore();

  const [selectedTableId, setSelectedTableId] = useState<string>('tbl-4');
  const [guestCount, setGuestCount] = useState<number>(4);
  const [selectedCategory, setSelectedCategory] = useState<string>('coffee');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCart, setCurrentCart] = useState<{ product: ProductItem; quantity: number }[]>([
    {
      product: {
        id: 'prod-2',
        name_it: 'Cappuccino',
        name_fr: 'Cappuccino',
        price_cents: 280,
        category: 'coffee',
        description_it: 'Espresso con schiuma di latte fresco',
        description_fr: 'Espresso avec mousse de lait',
        is_available: true,
      },
      quantity: 2,
    },
    {
      product: {
        id: 'prod-1',
        name_it: 'Espresso',
        name_fr: 'Espresso',
        price_cents: 150,
        category: 'coffee',
        description_it: 'Miscela 100% Arabica artigianale',
        description_fr: 'Mélange 100% Arabica artisanal',
        is_available: true,
      },
      quantity: 1,
    },
    {
      product: {
        id: 'prod-7',
        name_it: 'Croissant',
        name_fr: 'Croissant',
        price_cents: 180,
        category: 'food',
        description_it: 'Al burro di Normandia caldo',
        description_fr: 'Au beurre de Normandie',
        is_available: true,
      },
      quantity: 1,
    },
  ]);

  const [showBillModal, setShowBillModal] = useState<any | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [splitCount, setSplitCount] = useState<number>(1);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const tableDisplay = selectedTable ? `Tavolo ${selectedTable.number}` : 'Tavolo 04';

  // Products catalog matching photo
  const coffeeMenu: ProductItem[] = [
    { id: 'c1', name_it: 'Espresso', name_fr: 'Espresso', price_cents: 150, category: 'coffee', description_it: '100% Arabica', description_fr: '100% Arabica', is_available: true },
    { id: 'c2', name_it: 'Cappuccino', name_fr: 'Cappuccino', price_cents: 280, category: 'coffee', description_it: 'Latte art fresca', description_fr: 'Mousse de lait', is_available: true },
    { id: 'c3', name_it: 'Caffè latte', name_fr: 'Café au lait', price_cents: 320, category: 'coffee', description_it: 'Bicchiere alto', description_fr: 'Verre haut', is_available: true },
    { id: 'c4', name_it: 'Macchiato', name_fr: 'Macchiato', price_cents: 170, category: 'coffee', description_it: 'Caldo o freddo', description_fr: 'Chaud ou froid', is_available: true },
    { id: 'c5', name_it: 'Americano', name_fr: 'Americano', price_cents: 250, category: 'coffee', description_it: 'Doppio espresso lungo', description_fr: 'Double espresso allongé', is_available: true },
    { id: 'c6', name_it: 'Caffè shakerato', name_fr: 'Café frappé', price_cents: 350, category: 'coffee', description_it: 'Con ghiaccio shakerato', description_fr: 'Glacé frappé', is_available: true },
  ];

  const categories = [
    { id: 'all', label: isIt ? 'Tutti' : 'Tous' },
    { id: 'coffee', label: isIt ? 'Caffè' : 'Café' },
    { id: 'beverages', label: isIt ? 'Bevande' : 'Boissons' },
    { id: 'cocktails', label: 'Cocktail' },
    { id: 'food', label: isIt ? 'Cibo' : 'Snacks' },
  ];

  const addToCart = (product: ProductItem) => {
    setCurrentCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCurrentCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const cartTotalCents = currentCart.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );

  const handleSendOrder = () => {
    if (currentCart.length === 0) return;

    const newOrder = createOrder({
      table_id: selectedTableId,
      table_number: tableDisplay,
      server_name: 'Marco',
      items: currentCart,
    });

    setSuccessToast(
      isIt
        ? `Comanda inviata al bancone con successo!`
        : `Commande transmise avec succès !`
    );

    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="max-w-xl mx-auto pb-16 text-slate-800">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-xs">{successToast}</span>
        </div>
      )}

      {/* Main Smartphone-style Container matching photo */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        
        {/* Title */}
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          {isIt ? 'Nuova comanda' : 'Nouvelle commande'}
        </h1>

        {/* Table selector & guests pill matching photo */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isIt ? 'Tavolo' : 'Table'}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 cursor-pointer hover:border-slate-300">
              <span>{tableDisplay}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-extrabold text-orange-600">
              <Users className="w-3.5 h-3.5" />
              <span>{guestCount}</span>
            </div>

            <button
              onClick={() => setGuestCount(guestCount + 1)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Category Pills matching photo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(c => {
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#ea580c] text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Products 3-column Grid matching photo */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {coffeeMenu.map(product => {
            const inCart = currentCart.find(i => i.product.id === product.id)?.quantity || 0;

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group active:scale-95 ${
                  inCart > 0
                    ? 'bg-orange-50/50 border-orange-300 ring-1 ring-orange-400/40 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Visual Drink Mockup Photo */}
                <div className="w-full h-16 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shadow-inner mb-1.5 overflow-hidden">
                  ☕
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs truncate leading-tight">{product.name_it}</h3>
                  <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                    {formatCents(product.price_cents, isIt ? 'it-IT' : 'fr-FR')}
                  </span>
                </div>

                {/* Orange circle '+' button at bottom */}
                <div className="mt-2 flex justify-end">
                  <div className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    +
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Order Items Breakdown (matching photo bottom cart) */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {currentCart.map(item => (
            <div key={item.product.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100/60">
              <div className="flex items-center gap-2">
                <span className="text-base">☕</span>
                <div>
                  <span className="font-bold text-slate-900 block leading-tight">{item.product.name_it}</span>
                  <span className="text-[10px] text-slate-400">{formatCents(item.product.price_cents, isIt ? 'it-IT' : 'fr-FR')}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700 font-bold">
                  <button onClick={() => removeFromCart(item.product.id)} className="hover:text-rose-600">-</button>
                  <span className="text-[11px] w-3 text-center">{item.quantity}</span>
                  <button onClick={() => addToCart(item.product)} className="hover:text-orange-600">+</button>
                </div>
                <span className="font-bold text-slate-900 w-12 text-right">
                  {formatCents(item.product.price_cents * item.quantity, isIt ? 'it-IT' : 'fr-FR')}
                </span>
              </div>
            </div>
          ))}

          {/* Total row */}
          <div className="flex items-center justify-between pt-2">
            <span className="font-extrabold text-sm text-slate-600">
              {isIt ? 'Totale' : 'Total'}
            </span>
            <span className="text-xl font-black text-slate-900">
              {formatCents(cartTotalCents, isIt ? 'it-IT' : 'fr-FR')}
            </span>
          </div>

          {/* Action buttons matching photo */}
          <div className="pt-3 flex items-center gap-2">
            <button
              onClick={() => setShowBillModal({ order_number: 1042, table_number: tableDisplay, items: currentCart, total_cents: cartTotalCents })}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              title="Opzioni / Conto"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => alert(isIt ? 'Comanda salvata come bozza' : 'Commande enregistrée')}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition"
            >
              {isIt ? 'Salva' : 'Sauvegarder'}
            </button>

            <button
              onClick={handleSendOrder}
              className="flex-2 py-3 px-5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black text-xs shadow-md shadow-orange-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <span>{isIt ? 'Invia comanda' : 'Envoyer commande'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Bill & Split Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl relative border border-slate-200">
            <button onClick={() => setShowBillModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center pb-3 border-b border-dashed border-slate-200">
              <h2 className="font-black text-base uppercase tracking-wider">Bar Centrale</h2>
              <p className="text-[11px] text-slate-500">Milano · {showBillModal.table_number}</p>
            </div>
            <div className="py-3 space-y-1.5 border-b border-dashed border-slate-200 text-xs">
              {showBillModal.items.map((it: any) => (
                <div key={it.product.id} className="flex justify-between">
                  <span>{it.quantity}x {it.product.name_it}</span>
                  <span className="font-bold">{formatCents(it.product.price_cents * it.quantity, isIt ? 'it-IT' : 'fr-FR')}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 pb-2 flex justify-between font-black text-base">
              <span>TOTALE</span>
              <span>{formatCents(showBillModal.total_cents, isIt ? 'it-IT' : 'fr-FR')}</span>
            </div>
            <p className="text-[9px] text-slate-400 text-center uppercase pb-3">*** DOCUMENTO NON FISCALE ***</p>
            <button
              onClick={() => setShowBillModal(null)}
              className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
