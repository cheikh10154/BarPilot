'use client';

import React, { useState, use } from 'react';
import { useBarPilotStore, InventoryItem } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import { ProductThumb } from '@/components/ui/ProductThumb';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  History,
  X,
  ArrowDownRight,
  ArrowUpRight,
  PackagePlus,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function InventoryPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { inventory, stockMovements, adjustInventory, addInventoryItem } = useBarPilotStore();

  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'alert' | string>('all');
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<'correction' | 'purchase' | 'waste'>('purchase');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState('Spirits');
  const [newItemUnit, setNewItemUnit] = useState<InventoryItem['base_unit']>('unit');
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemReorder, setNewItemReorder] = useState(4);
  const [newItemCostCents, setNewItemCostCents] = useState(1200);

  const [feedback, setFeedback] = useState<string | null>(null);

  const alertItemsCount = inventory.filter(i => i.current_quantity <= i.reorder_level).length;

  const filteredItems = inventory.filter(item => {
    const name = (isIt ? item.name_it : item.name_fr).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    
    if (!matchSearch) return false;
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'alert') return item.current_quantity <= item.reorder_level;
    if (selectedFilter === 'bevande') return ['Caffè', 'Birra', 'Spirits', 'Liquori', 'Vino & Bollicine', 'Soft Drinks'].includes(item.category);
    if (selectedFilter === 'alimenti') return ['Latticini', 'Freschi', 'Food'].includes(item.category);
    if (selectedFilter === 'consumabili') return ['Drogheria', 'Packaging'].includes(item.category);
    return item.category.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    adjustInventory(adjustItem.id, adjustDelta, adjustReason);
    setFeedback(
      isIt
        ? `Giacenza di ${adjustItem.name_it} aggiornata (${adjustDelta > 0 ? '+' : ''}${adjustDelta} ${adjustItem.base_unit})`
        : `Stock de ${adjustItem.name_fr} mis à jour (${adjustDelta > 0 ? '+' : ''}${adjustDelta} ${adjustItem.base_unit})`
    );
    setAdjustItem(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addInventoryItem({
      name_it: newItemName,
      name_fr: newItemName,
      category: newItemCat,
      base_unit: newItemUnit,
      current_quantity: newItemQty,
      reorder_level: newItemReorder,
      average_cost_cents: newItemCostCents,
    });

    setShowAddItemModal(false);
    setNewItemName('');
    setFeedback(isIt ? 'Nuovo ingrediente registrato con successo!' : 'Nouvel ingrédient enregistré avec succès !');
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12 bp-fade-up">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-xs">{feedback}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bp-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isIt ? 'Inventario' : 'Inventaire'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {inventory.length} {isIt ? 'articoli in giacenza' : 'articles en stock'}
            </span>
            {alertItemsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                {alertItemsCount} {isIt ? 'sotto scorta' : 'sous le seuil'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Scarico automatico a ogni comanda servita, gestione scorte minime e tracciabilità dei lotti' 
              : 'Déduction automatique par commande, gestion des seuils critiques et traçabilité'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition inline-flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>{isIt ? 'Storico movimenti' : 'Historique'}</span>
          </button>

          <button
            onClick={() => setShowAddItemModal(true)}
            className="h-10 px-4 bp-btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isIt ? 'Nuovo ingrediente' : 'Nouvel ingrédient'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar matching mockup */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bp-card p-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isIt ? 'Cerca ingrediente...' : 'Rechercher un ingrédient...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
        </div>

        {/* Category & Status Pills matching mockup: Tutti, In allerta, Bevande, Alimenti, Consumabili */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isIt ? 'Tutti' : 'Tous'}
          </button>

          <button
            onClick={() => setSelectedFilter('alert')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition ${
              selectedFilter === 'alert'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isIt ? 'In allerta' : 'En alerte'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${selectedFilter === 'alert' ? 'bg-white/30 text-white' : 'bg-orange-200 text-orange-800'}`}>
              {alertItemsCount}
            </span>
          </button>

          {[
            { id: 'bevande', label_it: 'Bevande', label_fr: 'Boissons' },
            { id: 'alimenti', label_it: 'Alimenti', label_fr: 'Aliments' },
            { id: 'consumabili', label_it: 'Consumabili', label_fr: 'Consommables' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedFilter(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedFilter === c.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isIt ? c.label_it : c.label_fr}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table matching mockup */}
      <div className="bp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">{isIt ? 'Nome' : 'Nom'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Quantità' : 'Quantité'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Unità' : 'Unité'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Stato' : 'Statut'}</th>
                <th className="py-3.5 px-5 text-right">{isIt ? 'Azioni' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map(item => {
                const name = isIt ? item.name_it : item.name_fr;
                const isUnderLevel = item.current_quantity <= item.reorder_level;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3.5">
                        <ProductThumb name={name} size={40} rounded="rounded-xl" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{name}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatCents(item.average_cost_cents, isIt ? 'it-IT' : 'fr-FR')} / {item.base_unit}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 text-sm">
                        {item.current_quantity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-bold uppercase text-[11px]">
                      {item.base_unit}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isUnderLevel
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isUnderLevel ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span>{isUnderLevel ? (isIt ? 'In allerta' : 'En alerte') : 'OK'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => {
                          setAdjustItem(item);
                          setAdjustDelta(5);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 text-slate-700 font-bold text-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isIt ? 'Rettifica' : 'Ajuster'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Quantity Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isIt ? 'Rettifica Giacenza' : 'Ajustement de Stock'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isIt ? adjustItem.name_it : adjustItem.name_fr} ({isIt ? 'Giacenza:' : 'Stock:'} {adjustItem.current_quantity} {adjustItem.base_unit})
                </p>
              </div>
              <button onClick={() => setAdjustItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Motivo del movimento:' : 'Motif du mouvement :'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setAdjustReason('purchase'); if (adjustDelta < 0) setAdjustDelta(Math.abs(adjustDelta)); }}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-center ${
                      adjustReason === 'purchase'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isIt ? 'Rifornimento (+)' : 'Achat (+)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAdjustReason('correction'); }}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-center ${
                      adjustReason === 'correction'
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isIt ? 'Conteggio reale' : 'Comptage'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAdjustReason('waste'); if (adjustDelta > 0) setAdjustDelta(-Math.abs(adjustDelta)); }}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-center ${
                      adjustReason === 'waste'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isIt ? 'Scarto / Rovina (-)' : 'Perte (-)'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? `Quantità variazione (${adjustItem.base_unit}):` : `Variation (${adjustItem.base_unit}) :`}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={adjustDelta}
                    onChange={e => setAdjustDelta(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-xs font-bold text-slate-500">{adjustItem.base_unit}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isIt ? 'Nuova giacenza stimata:' : 'Nouveau stock estimé :'} {' '}
                  <span className="font-bold text-slate-900">
                    {(adjustItem.current_quantity + adjustDelta).toFixed(1)} {adjustItem.base_unit}
                  </span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bp-btn-primary"
                >
                  {isIt ? 'Registra Movimento' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 text-slate-900 max-h-[85vh] overflow-y-auto shadow-2xl bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-orange-600" />
                <span>{isIt ? 'Registro Movimenti di Magazzino' : 'Journal des Mouvements de Stock'}</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {stockMovements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {isIt ? 'Nessun movimento recente registrato' : 'Aucun mouvement récent'}
                </div>
              ) : (
                stockMovements.map(m => {
                  const isPositive = m.quantity_delta > 0;
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{m.item_name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {m.reason} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {isPositive ? '+' : ''}{m.quantity_delta} {m.base_unit}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-orange-600" />
                <span>{isIt ? 'Nuovo Ingrediente Magazzino' : 'Nouvel Article Stock'}</span>
              </h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Nome ingrediente:' : 'Nom ingrédient :'}
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Es. Prosecco Valdobbiadene, Gin Mare, Latte Avena..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Categoria:' : 'Catégorie :'}
                  </label>
                  <select
                    value={newItemCat}
                    onChange={e => setNewItemCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Caffè">Caffè</option>
                    <option value="Spirits">Spirits</option>
                    <option value="Liquori">Liquori</option>
                    <option value="Vino & Bollicine">Vino & Bollicine</option>
                    <option value="Birra">Birra</option>
                    <option value="Latticini">Latticini</option>
                    <option value="Soft Drinks">Soft Drinks</option>
                    <option value="Freschi">Freschi & Frutta</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Unità base:' : 'Unité :'}
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="unit">{isIt ? 'Pezzi / Bottiglie' : 'Unités / Bouteilles'}</option>
                    <option value="kg">kg (Chilogrammi)</option>
                    <option value="g">g (Grammi)</option>
                    <option value="l">L (Litri)</option>
                    <option value="ml">ml (Millilitri)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Giacenza iniziale:' : 'Stock initial :'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newItemQty}
                    onChange={e => setNewItemQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Soglia allerta riordino:' : 'Seuil d\'alerte :'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newItemReorder}
                    onChange={e => setNewItemReorder(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bp-btn-primary"
                >
                  {isIt ? 'Salva Ingrediente' : 'Créer l\'Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
