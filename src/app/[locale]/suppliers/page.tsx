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
  X,
  Trash2,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function SuppliersPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { suppliers, currentRole, addSupplier, deleteSupplier } = useBarPilotStore();
  const isOwner = currentRole === 'owner';

  const [search, setSearch] = useState('');
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState<Supplier | null>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // New supplier form state
  const [newSupName, setNewSupName] = useState('');
  const [newSupCategory, setNewSupCategory] = useState('Spiriti & Alcolici');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupProducts, setNewSupProducts] = useState('');

  // Order form state
  const [orderItems, setOrderItems] = useState<{ name: string; qty: number; unit: string }[]>([]);
  const [orderUrgency, setOrderUrgency] = useState('standard');
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

  const handleOpenOrderModal = (sup: Supplier) => {
    setSelectedSupplierForOrder(sup);
    // Initialize items with default quantities
    const items = sup.products_supplied.length > 0
      ? sup.products_supplied.map((p, idx) => ({
          name: p,
          qty: idx === 0 ? 5 : 2,
          unit: 'colli',
        }))
      : [{ name: 'Fornitura generica', qty: 1, unit: 'colli' }];
    setOrderItems(items);
    setOrderNotes('');
  };

  const handleAddOrderRow = () => {
    setOrderItems(prev => [...prev, { name: '', qty: 1, unit: 'colli' }]);
  };

  const handleRemoveOrderRow = (index: number) => {
    setOrderItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateOrderItem = (index: number, field: string, value: any) => {
    setOrderItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSendPurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForOrder) return;

    setToastMsg(
      isIt
        ? `Buono d'ordine #${Date.now().toString().slice(-4)} inviato con successo a ${selectedSupplierForOrder.name}!`
        : `Bon de commande #${Date.now().toString().slice(-4)} envoyé avec succès à ${selectedSupplierForOrder.name} !`
    );
    setSelectedSupplierForOrder(null);
    setOrderNotes('');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const productsList = newSupProducts
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    addSupplier({
      name: newSupName.trim(),
      category: newSupCategory,
      contact_name: newSupContact.trim() || 'Responsabile Ordini',
      phone: newSupPhone.trim(),
      email: newSupEmail.trim(),
      products_supplied: productsList.length > 0 ? productsList : ['Articoli vari'],
    });

    setShowAddSupplierModal(false);
    setNewSupName('');
    setNewSupContact('');
    setNewSupPhone('');
    setNewSupEmail('');
    setNewSupProducts('');

    setToastMsg(
      isIt
        ? `Fornitore "${newSupName}" registrato con successo!`
        : `Fournisseur "${newSupName}" enregistré avec succès !`
    );
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDeleteSupplierConfirm = () => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete.id);
    setToastMsg(
      isIt
        ? `Fornitore "${supplierToDelete.name}" rimosso`
        : `Fournisseur "${supplierToDelete.name}" supprimé`
    );
    setSupplierToDelete(null);
    setTimeout(() => setToastMsg(null), 3500);
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

        {isOwner && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="h-10 px-4 bp-btn-primary text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isIt ? 'Nuovo fornitore' : 'Nouveau fournisseur'}</span>
            </button>
          </div>
        )}
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
              onClick={() => handleOpenOrderModal(sup)}
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
                  <p className="text-[11px] text-orange-600/80 mt-0.5">
                    📞 {sup.phone} · ✉️ {sup.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenOrderModal(sup);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition"
                  title={isIt ? 'Emetti nuovo ordine' : 'Commander'}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isIt ? 'Nuovo ordine' : 'Commander'}</span>
                </button>

                {isOwner && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSupplierToDelete(sup);
                    }}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 text-slate-400 transition"
                    title={isIt ? 'Elimina fornitore' : 'Supprimer'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Order Modal (Nuovo Ordine Fornitore) */}
      {selectedSupplierForOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <span>{isIt ? 'Nuovo Ordine Fornitore' : 'Bon de Commande Fournisseur'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isIt ? 'Fornitore:' : 'Fournisseur :'} <span className="font-bold text-slate-800">{selectedSupplierForOrder.name}</span>
                  {' · '}<span>📞 {selectedSupplierForOrder.phone}</span>
                </p>
              </div>
              <button onClick={() => setSelectedSupplierForOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendPurchaseOrder} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    {isIt ? 'Articoli da ordinare:' : 'Articles à commander :'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOrderRow}
                    className="text-[11px] text-orange-600 font-bold hover:underline"
                  >
                    + {isIt ? 'Aggiungi articolo' : 'Ajouter article'}
                  </button>
                </div>

                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleUpdateOrderItem(idx, 'name', e.target.value)}
                      placeholder={isIt ? 'Nome articolo' : 'Nom article'}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={e => handleUpdateOrderItem(idx, 'qty', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-center font-bold"
                    />
                    <select
                      value={item.unit}
                      onChange={e => handleUpdateOrderItem(idx, 'unit', e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <option value="colli">colli</option>
                      <option value="cartoni">cartoni</option>
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="fusti">fusti</option>
                      <option value="pz">pz</option>
                    </select>
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOrderRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Tempistica consegna richiesta:' : 'Délai de livraison :'}
                </label>
                <select
                  value={orderUrgency}
                  onChange={e => setOrderUrgency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="standard">{isIt ? 'Prima data utile (Standard)' : 'Standard'}</option>
                  <option value="urgent">{isIt ? 'Entro domani mattina (Urgente)' : 'Urgent (demain matin)'}</option>
                  <option value="weekend">{isIt ? 'Entro il fine settimana' : 'Avant ce week-end'}</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Note e istruzioni per il fornitore:' : 'Instructions de livraison :'}
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder={isIt ? 'Es. Consegna tassativa prima delle ore 11:00...' : 'Ex. Livraison avant 11h00...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 resize-none"
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
                  className="px-4 py-2 bp-btn-primary flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isIt ? 'Invia Buono d\'Ordine' : 'Transmettre la Commande'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal (Solo Proprietario) */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-600" />
                  <span>{isIt ? 'Nuovo Fornitore' : 'Nouveau Fournisseur'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isIt ? 'Aggiungi un partner commerciale o distributore' : 'Ajouter un partenaire commercial'}
                </p>
              </div>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Ragione Sociale / Nome Fornitore:' : 'Nom du Fournisseur :'}
                </label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={e => setNewSupName(e.target.value)}
                  placeholder="Es. San Pellegrino, Lavazza, Metro Italia..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Categoria:' : 'Catégorie :'}
                  </label>
                  <select
                    value={newSupCategory}
                    onChange={e => setNewSupCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Caffetteria & Macchine">Caffetteria & Macchine</option>
                    <option value="Spiriti & Alcolici">Spiriti & Alcolici</option>
                    <option value="Soft Drinks & Mixer">Soft Drinks & Mixer</option>
                    <option value="Food & Drogheria">Food & Drogheria</option>
                    <option value="Pasticceria & Snack">Pasticceria & Snack</option>
                    <option value="Packaging & Detergenza">Packaging & Detergenza</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Referente commerciale:' : 'Contact :'}
                  </label>
                  <input
                    type="text"
                    value={newSupContact}
                    onChange={e => setNewSupContact(e.target.value)}
                    placeholder="Es. Marco Conti"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Telefono ordini:' : 'Téléphone :'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newSupPhone}
                    onChange={e => setNewSupPhone(e.target.value)}
                    placeholder="+39 02 1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Email ordini:' : 'Email :'}
                  </label>
                  <input
                    type="email"
                    required
                    value={newSupEmail}
                    onChange={e => setNewSupEmail(e.target.value)}
                    placeholder="ordini@fornitore.it"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Prodotti principali forniti (separati da virgola):' : 'Produits fournis (séparés par virgule) :'}
                </label>
                <input
                  type="text"
                  value={newSupProducts}
                  onChange={e => setNewSupProducts(e.target.value)}
                  placeholder="Es. Gin Bombay, Prosecco DOC, Acqua Tonica, Succhi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bp-btn-primary"
                >
                  {isIt ? 'Salva Fornitore' : 'Créer le Fournisseur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supplier Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>{isIt ? 'Elimina Fornitore' : 'Supprimer le Fournisseur'}</span>
              </h3>
              <button onClick={() => setSupplierToDelete(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              {isIt
                ? `Sei sicuro di voler eliminare "${supplierToDelete.name}" dall'elenco dei fornitori?`
                : `Êtes-vous sûr de vouloir supprimer "${supplierToDelete.name}" de la liste des fournisseurs ?`}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                {isIt ? 'Annulla' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleDeleteSupplierConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition text-xs"
              >
                {isIt ? 'Conferma Eliminazione' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
