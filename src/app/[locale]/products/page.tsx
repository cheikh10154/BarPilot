'use client';

import React, { useState, use } from 'react';
import { useBarPilotStore, ProductItem } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import { ProductThumb } from '@/components/ui/ProductThumb';
import {
  Wine,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Coffee,
  Beer,
  UtensilsCrossed,
  GlassWater,
  ChefHat,
  ChevronRight,
  X
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function ProductsPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { products, inventory, addProduct, toggleProductAvailability } = useBarPilotStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Product Form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductItem['category']>('cocktails');
  const [newProdPriceCents, setNewProdPriceCents] = useState(700);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [selectedIngredientId, setSelectedIngredientId] = useState(inventory[0]?.id || '');
  const [ingredientQty, setIngredientQty] = useState(30);
  const [recipeItems, setRecipeItems] = useState<{ inventory_item_id: string; quantity: number }[]>([]);

  const filteredProducts = products.filter(p => {
    let matchCat = true;
    if (selectedCategory === 'coffee') matchCat = p.category === 'coffee';
    else if (selectedCategory === 'bevande') matchCat = p.category === 'softDrinks' || p.category === 'beer';
    else if (selectedCategory === 'cocktails') matchCat = p.category === 'cocktails' || p.category === 'spirits' || p.category === 'wine';
    else if (selectedCategory === 'cibo') matchCat = p.category === 'food';
    else if (selectedCategory === 'snack') matchCat = p.category === 'food';
    else if (selectedCategory !== 'all') matchCat = p.category === selectedCategory;

    const name = isIt ? p.name_it : p.name_fr;
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddIngredientToRecipe = () => {
    if (!selectedIngredientId) return;
    setRecipeItems(prev => [
      ...prev,
      { inventory_item_id: selectedIngredientId, quantity: ingredientQty },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    addProduct({
      name_it: newProdName,
      name_fr: newProdName,
      price_cents: Math.round(newProdPriceCents),
      category: newProdCategory,
      description_it: newProdDesc || 'Creazione del bar',
      description_fr: newProdDesc || 'Création du bar',
      is_available: true,
      recipe: recipeItems.length > 0 ? recipeItems : undefined,
    });

    setShowAddModal(false);
    setNewProdName('');
    setRecipeItems([]);
    setNewProdDesc('');
  };

  const categories = [
    { id: 'all', label_it: 'Tutti', label_fr: 'Tous' },
    { id: 'coffee', label_it: 'Caffè', label_fr: 'Café' },
    { id: 'bevande', label_it: 'Bevande', label_fr: 'Boissons' },
    { id: 'cocktails', label_it: 'Cocktail', label_fr: 'Cocktails' },
    { id: 'cibo', label_it: 'Cibo', label_fr: 'Cuisine' },
    { id: 'snack', label_it: 'Snack', label_fr: 'Snacks' },
  ];

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12 bp-fade-up">
      {/* Top Header Card */}
      <div className="bp-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isIt ? 'Prodotti' : 'Produits'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {filteredProducts.length} {isIt ? 'articoli' : 'articles'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Catalogo listino, composizione ricette e scarico giacenza magazzino' 
              : 'Catalogue des tarifs, fiches techniques et déduction des stocks'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 bp-btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isIt ? 'Nuovo prodotto' : 'Nouveau produit'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bp-card p-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isIt ? 'Cerca prodotto...' : 'Rechercher un produit...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedCategory === c.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isIt ? c.label_it : c.label_fr}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table (exact mockup layout with real photos) */}
      <div className="bp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">{isIt ? 'Prodotto' : 'Produit'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Categoria' : 'Catégorie'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Prezzo' : 'Prix'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Stato' : 'Statut'}</th>
                <th className="py-3.5 px-5 text-right">{isIt ? 'Azioni' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map(product => {
                const name = isIt ? product.name_it : product.name_fr;
                const desc = isIt ? product.description_it : product.description_fr;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3.5">
                        <ProductThumb name={name} size={42} rounded="rounded-xl" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{name}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{desc}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {product.category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 text-sm">
                        {formatCents(product.price_cents, isIt ? 'it-IT' : 'fr-FR')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleProductAvailability(product.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                          product.is_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.is_available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{product.is_available ? (isIt ? 'Attivo' : 'Actif') : (isIt ? 'Esaurito' : 'Épuisé')}</span>
                      </button>
                    </td>

                    <td className="py-3 px-5 text-right">
                      <button 
                        onClick={() => toggleProductAvailability(product.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 max-h-[90vh] overflow-y-auto shadow-2xl bp-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                <span>{isIt ? 'Nuovo Prodotto / Drink' : 'Nouveau Produit / Boisson'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Nome della consumazione:' : 'Nom du produit :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    placeholder="Es. Gin Lemon Premium, Caffè Corretto..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Categoria:' : 'Catégorie :'}
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="coffee">{isIt ? 'Caffetteria' : 'Café'}</option>
                    <option value="cocktails">{isIt ? 'Cocktail & Aperitivi' : 'Cocktails'}</option>
                    <option value="beer">{isIt ? 'Birra' : 'Bière'}</option>
                    <option value="wine">{isIt ? 'Vino & Bollicine' : 'Vins'}</option>
                    <option value="spirits">{isIt ? 'Spirits & Digestivi' : 'Spiritueux'}</option>
                    <option value="softDrinks">{isIt ? 'Soft Drinks & Acque' : 'Sodas & Eaux'}</option>
                    <option value="food">{isIt ? 'Snack & Food' : 'Snacks & Cuisine'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Prezzo di vendita (€):' : 'Prix de vente (€) :'}
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={newProdPriceCents / 100}
                    onChange={e => setNewProdPriceCents(parseFloat(e.target.value || '0') * 100)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">
                    {isIt ? 'Descrizione per il menu:' : 'Description menu :'}
                  </label>
                  <input
                    type="text"
                    value={newProdDesc}
                    onChange={e => setNewProdDesc(e.target.value)}
                    placeholder="Es. Servito con ghiaccio cristallino e scorza..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Recipe builder section */}
              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                  <span>{isIt ? 'Fiche Tecnica / Ingredienti scaricati a ogni comanda:' : 'Fiche technique / Ingrédients déduits :'}</span>
                </span>

                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedIngredientId}
                    onChange={e => setSelectedIngredientId(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  >
                    {inventory.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {isIt ? inv.name_it : inv.name_fr} ({inv.base_unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={ingredientQty}
                    onChange={e => setIngredientQty(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />

                  <button
                    type="button"
                    onClick={handleAddIngredientToRecipe}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 text-xs"
                  >
                    +
                  </button>
                </div>

                {recipeItems.length > 0 && (
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {recipeItems.map((item, idx) => {
                      const invItem = inventory.find(i => i.id === item.inventory_item_id);
                      return (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                          <span>{invItem ? (isIt ? invItem.name_it : invItem.name_fr) : 'Ingrediente'}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{item.quantity} {invItem?.base_unit}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bp-btn-primary"
                >
                  {isIt ? 'Salva Prodotto' : 'Enregistrer le Produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
