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
  ExternalLink,
  ShoppingBag,
  Star,
  X,
  FileText
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
        ? `Buono d'ordine generato con successo e inviato via email a ${selectedSupplierForOrder.name}!`
        : `Bon de commande généré avec succès et transmis par email à ${selectedSupplierForOrder.name} !`
    );
    setSelectedSupplierForOrder(null);
    setOrderNotes('');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">
              {isIt ? 'Fornitori' : 'Fournisseurs'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {suppliers.length} {isIt ? 'partner registrati' : 'partenaires enregistrés'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Anagrafiche fornitori, cataloghi articoli e invio tempestivo dei buoni d\'acquisto' 
              : 'Fiches fournisseurs, catalogues produits et transmission des bons de commande'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert(isIt ? 'Apertura form nuovo fornitore' : 'Formulaire nouveau fournisseur')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm hover:shadow transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isIt ? '+ Nuovo fornitore' : '+ Nouveau fournisseur'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isIt ? 'Cerca fornitore o categoria...' : 'Rechercher fournisseur ou catégorie...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>{filteredSuppliers.length} {isIt ? 'risultati' : 'résultats'}</span>
        </div>
      </div>

      {/* Suppliers Grid (exact mockup layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => (
          <div
            key={sup.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition group"
          >
            <div>
              {/* Top Row: Icon, Name, Favorite Star */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-orange-600">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-orange-600 transition">
                      {sup.name}
                    </h3>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {sup.category}
                    </span>
                  </div>
                </div>

                <div className="p-1 rounded-full text-amber-500 bg-amber-50" title="Fornitore Principale">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>

              {/* Contact info list */}
              <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] w-20">{isIt ? 'Referente:' : 'Contact :'}</span>
                  <span className="font-semibold text-slate-800">{sup.contact_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] w-20">{isIt ? 'Telefono:' : 'Tél :'}</span>
                  <a href={`tel:${sup.phone}`} className="font-medium text-slate-700 hover:text-orange-600">
                    {sup.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] w-20">Email:</span>
                  <a href={`mailto:${sup.email}`} className="font-medium text-slate-700 hover:text-orange-600 truncate max-w-[170px]">
                    {sup.email}
                  </a>
                </div>
              </div>

              {/* Products supplied badges */}
              <div className="mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {isIt ? 'Articoli forniti:' : 'Produits fournis :'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {sup.products_supplied.map((prod, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 font-medium"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setSelectedSupplierForOrder(sup)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-xs transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isIt ? 'Nuovo ordine' : 'Commander'}</span>
              </button>

              <a
                href={`tel:${sup.phone}`}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                title="Chiama"
              >
                <Phone className="w-4 h-4 text-slate-500" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Order Modal */}
      {selectedSupplierForOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <span>{isIt ? 'Emetti Buono d\'Ordine' : 'Émettre un Bon de Commande'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isIt ? 'Fornitore designato:' : 'Fournisseur :'} <span className="font-bold text-slate-800">{selectedSupplierForOrder.name}</span>
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
                  {isIt ? 'Note di consegna & Istruzioni per il corriere:' : 'Instructions de livraison :'}
                </label>
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder={isIt ? 'Es. Consegna tassativa prima delle ore 11:30 dal retrobottega...' : 'Ex. Livraison avant 11h30...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-900 text-[11px]">
                {isIt 
                  ? 'Il buono d\'ordine verrà convertito in PDF e inviato all\'indirizzo ' + selectedSupplierForOrder.email
                  : 'Le bon de commande sera converti en PDF et envoyé à ' + selectedSupplierForOrder.email}
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
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-sm"
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
