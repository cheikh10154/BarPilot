'use client';

import React, { useState, use } from 'react';
import { useBarPilotStore, Supplier } from '@/lib/store';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Star,
  X
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function SuppliersPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { suppliers } = useBarPilotStore();
  const [search, setSearch] = useState('');
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState<Supplier | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Well known brand styles matching mockup
  const getBrandLogo = (name: string) => {
    if (name.includes('Vergnano')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#1c1917] text-amber-100 flex items-center justify-center font-serif font-black text-sm border border-stone-800 shadow-sm">
          CV
        </div>
      );
    }
    if (name.includes('Coca-Cola')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#dc2626] text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
          Coke
        </div>
      );
    }
    if (name.includes('Campari')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#b91c1c] text-white flex items-center justify-center font-black text-[11px] tracking-wider uppercase shadow-sm">
          CAMP
        </div>
      );
    }
    if (name.includes('Metro')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-yellow-400 flex items-center justify-center font-black text-xs tracking-wider uppercase shadow-sm">
          METRO
        </div>
      );
    }
    if (name.includes('Surgital') || name.includes('Bakery')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-bold text-xs shadow-sm">
          SURG
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs">
        <Building className="w-5 h-5" />
      </div>
    );
  };

  const filteredSuppliers = suppliers.filter(s => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.contact_name.toLowerCase().includes(q)
    );
  });

  const handleSendPurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForOrder) return;

    setToastMsg(
      isIt
        ? `Buono d'ordine generato con successo e inviato a ${selectedSupplierForOrder.name}!`
        : `Bon de commande généré et transmis à ${selectedSupplierForOrder.name} !`
    );
    setSelectedSupplierForOrder(null);
    setOrderNotes('');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12 bp-fade-up">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bp-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isIt ? 'Fornitori' : 'Fournisseurs'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {suppliers.length} {isIt ? 'partner' : 'partenaires'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Anagrafiche fornitori, cataloghi articoli e buoni d\'acquisto' 
              : 'Fiches fournisseurs, catalogues produits et bons de commande'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert(isIt ? 'Nuovo fornitore' : 'Nouveau fournisseur')}
            className="h-10 px-4 bp-btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isIt ? 'Nuovo fornitore' : 'Nouveau fournisseur'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar matching mockup */}
      <div className="bp-card p-3 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isIt ? 'Cerca ingrediente o fornitore...' : 'Rechercher fournisseur ou produit...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {filteredSuppliers.length} {isIt ? 'risultati' : 'résultats'}
        </span>
      </div>

      {/* Suppliers Table/Card List matching mockup */}
      <div className="bp-card overflow-hidden divide-y divide-slate-100">
        {filteredSuppliers.map((sup, idx) => {
          const isPreferred = idx === 0 || sup.name.includes('Vergnano');

          return (
            <div
              key={sup.id}
              onClick={() => setSelectedSupplierForOrder(sup)}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                {getBrandLogo(sup.name)}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition">
                      {sup.name}
                    </h3>
                    {isPreferred && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isIt ? 'Preferito' : 'Préféré'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {sup.category} · {sup.products_supplied.slice(0, 3).join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedSupplierForOrder(sup);
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isIt ? 'Ordina' : 'Commander'}</span>
                </button>

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Order Modal */}
      {selectedSupplierForOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <span>{isIt ? 'Emetti Buono d\'Ordine' : 'Émettre un Bon de Commande'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isIt ? 'Fornitore:' : 'Fournisseur :'} <span className="font-bold text-slate-800">{selectedSupplierForOrder.name}</span>
                </p>
              </div>
              <button onClick={() => setSelectedSupplierForOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendPurchaseOrder} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  {isIt ? 'Articoli da ordinare:' : 'Articles à commander :'}
                </span>
                {selectedSupplierForOrder.products_supplied.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{p}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        defaultValue={idx === 0 ? 5 : 2}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 text-center font-bold"
                      />
                      <span className="text-slate-400 text-[10px]">colli</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Note di consegna:' : 'Instructions de livraison :'}
                </label>
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder={isIt ? 'Es. Consegna tassativa prima delle ore 11:30...' : 'Ex. Livraison avant 11h30...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierForOrder(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bp-btn-primary"
                >
                  {isIt ? 'Invia Buono d\'Ordine' : 'Transmettre la Commande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
