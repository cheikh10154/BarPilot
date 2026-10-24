'use client';

import React, { useMemo, useState, use } from 'react';
import { useBarPilotStore, ProductItem } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import { ProductThumb } from '@/components/ui/ProductThumb';
import {
  Plus,
  Minus,
  Send,
  Search,
  CheckCircle2,
  X,
  ChevronDown,
  Users,
  MoreHorizontal,
  ShoppingBag,
  ArrowLeft,
  Receipt,
  Trash2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

type CartLine = { product: ProductItem; quantity: number };

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

// Coffee bar menu (prices as in the mockup)
const COFFEE_MENU: ProductItem[] = [
  mk('c1', 'Espresso', 150, 'coffee'),
  mk('c2', 'Cappuccino', 280, 'coffee'),
  mk('c3', 'Caffè latte', 320, 'coffee'),
  mk('c4', 'Macchiato', 170, 'coffee'),
  mk('c5', 'Americano', 250, 'coffee'),
  mk('c6', 'Caffè shakerato', 350, 'coffee'),
];

export default function OrdersPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const lc = isIt ? 'it-IT' : 'fr-FR';

  const { tables, products, createOrder } = useBarPilotStore();

  const [selectedTableId, setSelectedTableId] = useState<string>('tbl-4');
  const [guestCount, setGuestCount] = useState<number>(4);
  const [selectedCategory, setSelectedCategory] = useState<string>('coffee');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([
    { product: COFFEE_MENU[1], quantity: 2 },
    { product: COFFEE_MENU[0], quantity: 1 },
    { product: mk('f1', 'Croissant', 180, 'food'), quantity: 1 },
  ]);
  const [billOpen, setBillOpen] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const tableLabel = selectedTable
    ? /^\d+$/.test(selectedTable.number)
      ? `${isIt ? 'Tavolo' : 'Table'} ${selectedTable.number}`
      : selectedTable.number
    : isIt ? 'Tavolo 04' : 'Table 04';

  // Full catalogue = coffee bar menu + other store products (no duplicate coffees)
  const catalogue = useMemo(
    () => [...COFFEE_MENU, ...products.filter(p => p.category !== 'coffee')],
    [products]
  );

  const categories = [
    { id: 'all', label: isIt ? 'Tutti' : 'Tous' },
    { id: 'coffee', label: isIt ? 'Caffè' : 'Café' },
    { id: 'beverages', label: isIt ? 'Bevande' : 'Boissons' },
    { id: 'cocktails', label: 'Cocktail' },
    { id: 'food', label: isIt ? 'Cibo' : 'Cuisine' },
  ];

  const visibleProducts = catalogue.filter(p => {
    const name = (isIt ? p.name_it : p.name_fr).toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
    switch (selectedCategory) {
      case 'coffee':
        return p.category === 'coffee';
      case 'beverages':
        return ['beer', 'softDrinks', 'wine'].includes(p.category);
      case 'cocktails':
        return ['cocktails', 'spirits'].includes(p.category);
      case 'food':
        return p.category === 'food';
      default:
        return true;
    }
  });

  const addToCart = (product: ProductItem) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(10);
    setCart(prev => {
      const existing = prev.find(l => l.product.id === product.id);
      if (existing) return prev.map(l => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { product, quantity: 1 }];
    });
  };

  const decrement = (productId: string) => {
    setCart(prev =>
      prev
        .map(l => (l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter(l => l.quantity > 0)
    );
  };

  const totalCents = cart.reduce((s, l) => s + l.product.price_cents * l.quantity, 0);
  const itemsCount = cart.reduce((s, l) => s + l.quantity, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleSend = () => {
    if (cart.length === 0) return;
    createOrder({ table_id: selectedTableId, table_number: tableLabel, server_name: 'Marco', items: cart });
    setCart([]);
    setMobileCartOpen(false);
    showToast(isIt ? 'Comanda inviata al bancone!' : 'Commande envoyée au bar !');
  };

  const nameOf = (p: ProductItem) => (isIt ? p.name_it : p.name_fr);

  /* ---------- Ticket (shared desktop / mobile sheet) ---------- */
  const Ticket = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {cart.length === 0 ? (
          <div className="h-full min-h-40 flex flex-col items-center justify-center text-center text-slate-400 py-10">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </span>
            <p className="text-sm font-semibold text-slate-500">{isIt ? 'Nessun articolo' : 'Aucun article'}</p>
            <p className="text-xs">{isIt ? 'Tocca un prodotto per aggiungerlo' : 'Touchez un produit pour l’ajouter'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cart.map(line => (
              <li key={line.product.id} className="flex items-center gap-3 py-3">
                <ProductThumb name={nameOf(line.product)} size={44} rounded="rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{nameOf(line.product)}</p>
                  <p className="text-[12px] text-slate-400">{formatCents(line.product.price_cents, lc)}</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-full p-0.5">
                  <button
                    onClick={() => decrement(line.product.id)}
                    className="w-7 h-7 rounded-full bg-white text-slate-600 shadow-sm flex items-center justify-center hover:text-rose-600 active:scale-90 transition"
                    aria-label="-"
                  >
                    {line.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  </button>
                  <span className="w-6 text-center text-[13px] font-bold text-slate-900">{line.quantity}</span>
                  <button
                    onClick={() => addToCart(line.product)}
                    className="w-7 h-7 rounded-full bg-orange-500 text-white shadow-sm flex items-center justify-center active:scale-90 transition"
                    aria-label="+"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="w-16 text-right text-[13px] font-bold text-slate-900">
                  {formatCents(line.product.price_cents * line.quantity, lc)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-4 mt-2 border-t border-dashed border-slate-200 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-semibold text-slate-500">{isIt ? 'Totale' : 'Total'}</p>
            <p className="text-[11px] text-slate-400">
              {itemsCount} {isIt ? 'articoli' : 'articles'} · {guestCount} {isIt ? 'coperti' : 'couverts'}
            </p>
          </div>
          <p className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">{formatCents(totalCents, lc)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBillOpen(true)}
            disabled={cart.length === 0}
            className="w-12 h-12 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center transition"
            title={isIt ? 'Pre-conto / dividi' : 'Pré-addition / partager'}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={() => showToast(isIt ? 'Comanda salvata come bozza' : 'Commande enregistrée en brouillon')}
            disabled={cart.length === 0}
            className="h-12 px-5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm hover:bg-slate-50 disabled:opacity-40 transition"
          >
            {isIt ? 'Salva' : 'Enregistrer'}
          </button>
          <button
            onClick={handleSend}
            disabled={cart.length === 0}
            className="flex-1 h-12 bp-btn-primary text-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            {isIt ? 'Invia comanda' : 'Envoyer'}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto bp-fade-up">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white pl-3 pr-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 bp-fade-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-[13px]">{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
        {/* ============ Catalogue ============ */}
        <section className="bp-card p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600" onClick={() => history.back()}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl sm:text-[22px] font-extrabold text-slate-900 tracking-tight">
                {isIt ? 'Nuova comanda' : 'Nouvelle commande'}
              </h1>
            </div>
            <div className="relative hidden sm:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isIt ? 'Cerca prodotto…' : 'Rechercher…'}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px] focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          {/* Table + guests */}
          <div>
            <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">{isIt ? 'Tavolo' : 'Table'}</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="appearance-none w-full h-11 pl-4 pr-10 rounded-xl bg-white border border-slate-200 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {/^\d+$/.test(t.number) ? `${isIt ? 'Tavolo' : 'Table'} ${t.number}` : t.number}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="flex items-center h-11 rounded-xl border border-orange-200 bg-orange-50 p-1">
                <button
                  onClick={() => setGuestCount(g => Math.max(1, g - 1))}
                  className="w-9 h-full rounded-lg text-orange-600 hover:bg-orange-100 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex items-center gap-1 px-2 text-[14px] font-bold text-orange-600">
                  <Users className="w-4 h-4" />
                  {guestCount}
                </span>
                <button
                  onClick={() => setGuestCount(g => g + 1)}
                  className="w-9 h-full rounded-lg text-orange-600 hover:bg-orange-100 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {categories.map(c => {
              const active = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`h-9 px-4 rounded-xl text-[13px] font-semibold shrink-0 transition ${
                    active
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {visibleProducts.map(p => {
              const qty = cart.find(l => l.product.id === p.id)?.quantity ?? 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`group relative text-left rounded-2xl bg-white border p-1.5 sm:p-2 transition active:scale-[0.97] ${
                    qty > 0
                      ? 'border-orange-300 ring-4 ring-orange-500/10'
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="relative">
                    <ProductThumb name={nameOf(p)} size={200} rounded="rounded-xl" className="!w-full !h-auto aspect-square" />
                    {qty > 0 && (
                      <span className="absolute top-1.5 left-1.5 min-w-6 h-6 px-1.5 rounded-full bg-slate-900/85 text-white text-[11px] font-bold flex items-center justify-center backdrop-blur">
                        ×{qty}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-1 px-1 pt-2 pb-0.5">
                    <div className="min-w-0">
                      <p className="text-[12px] sm:text-[13px] font-semibold text-slate-900 truncate leading-tight">{nameOf(p)}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{formatCents(p.price_cents, lc)}</p>
                    </div>
                    <span className="w-7 h-7 shrink-0 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:scale-110 transition">
                      <Plus className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              );
            })}
            {visibleProducts.length === 0 && (
              <p className="col-span-full text-center text-sm text-slate-400 py-10">{isIt ? 'Nessun prodotto trovato' : 'Aucun produit trouvé'}</p>
            )}
          </div>
        </section>

        {/* ============ Ticket (desktop) ============ */}
        <aside className="hidden lg:flex bp-card p-5 flex-col sticky top-4 h-[calc(100vh-7.5rem)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-[15px] font-bold text-slate-900">{tableLabel}</p>
              <p className="text-[12px] text-slate-400">#{1043} · Marco</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-[11px] font-semibold ring-1 ring-inset ring-orange-200">
              {isIt ? 'In corso' : 'En cours'}
            </span>
          </div>
          {Ticket}
        </aside>
      </div>

      {/* ============ Mobile sticky cart bar ============ */}
      {cart.length > 0 && !mobileCartOpen && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="lg:hidden fixed left-3 right-3 bottom-[84px] z-40 h-14 rounded-2xl bp-btn-primary !justify-between px-4 text-sm"
        >
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">{itemsCount}</span>
            {isIt ? 'Vedi comanda' : 'Voir la commande'}
          </span>
          <span className="font-extrabold">{formatCents(totalCents, lc)}</span>
        </button>
      )}

      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex flex-col justify-end" onClick={() => setMobileCartOpen(false)}>
          <div className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85vh] flex flex-col bp-fade-up" onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-10 h-1 rounded-full bg-slate-200 mb-4" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-slate-900">{tableLabel}</p>
              <button onClick={() => setMobileCartOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            {Ticket}
          </div>
        </div>
      )}

      {/* ============ Pre-bill & split ============ */}
      {billOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBillOpen(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative bp-fade-up" onClick={e => e.stopPropagation()}>
            <button onClick={() => setBillOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <span className="mx-auto w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-2">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className="font-extrabold text-base text-slate-900">Bar Centrale</h2>
              <p className="text-[12px] text-slate-500">Milano · {tableLabel}</p>
            </div>
            <div className="py-3 space-y-1.5 border-b border-dashed border-slate-200 text-[13px]">
              {cart.map(l => (
                <div key={l.product.id} className="flex justify-between text-slate-700">
                  <span>
                    {l.quantity}× {nameOf(l.product)}
                  </span>
                  <span className="font-semibold text-slate-900">{formatCents(l.product.price_cents * l.quantity, lc)}</span>
                </div>
              ))}
            </div>
            <div className="py-3 flex justify-between font-extrabold text-lg text-slate-900">
              <span>{isIt ? 'Totale' : 'Total'}</span>
              <span>{formatCents(totalCents, lc)}</span>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-700">{isIt ? 'Dividi alla romana' : 'Partager l’addition'}</p>
                <p className="text-[12px] text-slate-500">
                  {formatCents(Math.ceil(totalCents / splitCount), lc)} / {isIt ? 'persona' : 'personne'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSplitCount(s => Math.max(1, s - 1))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold">{splitCount}</span>
                <button onClick={() => setSplitCount(s => s + 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider py-3">
              {isIt ? '*** Documento non fiscale — battere su RT ***' : '*** Document non fiscal — enregistrer sur caisse ***'}
            </p>
            <button onClick={() => setBillOpen(false)} className="w-full h-11 bp-btn-primary text-sm">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
