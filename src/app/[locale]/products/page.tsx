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
  X,
  Camera,
  Trash2,
  Pencil,
  Percent,
  SlidersHorizontal,
  Image as ImageIcon,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const PHOTO_PRESETS = [
  { name: 'Espresso', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop' },
  { name: 'Cappuccino', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=300&h=300&fit=crop' },
  { name: 'Spritz', url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=300&h=300&fit=crop' },
  { name: 'Birra', url: 'https://images.unsplash.com/photo-1608270118029-79a613620e23?w=300&h=300&fit=crop' },
  { name: 'Vino', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop' },
  { name: 'Cocktail', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&h=300&fit=crop' },
  { name: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=300&fit=crop' },
  { name: 'Panino', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop' },
  { name: 'Bibita', url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&h=300&fit=crop' },
  { name: 'Tè Freddo', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop' },
];

export default function ProductsPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const {
    products,
    inventory,
    currentRole,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
  } = useBarPilotStore();

  const isOwner = currentRole === 'owner';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductItem['category']>('cocktails');
  const [priceEuros, setPriceEuros] = useState<string>('5.50');
  const [costEuros, setCostEuros] = useState<string>('1.20');
  const [vatRate, setVatRate] = useState<number>(10);
  const [station, setStation] = useState<'bar' | 'coffee' | 'kitchen'>('bar');
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
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

    const pName = isIt ? p.name_it : p.name_fr;
    const matchSearch = pName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAddModal = () => {
    if (!isOwner) return;
    setEditingProduct(null);
    setName('');
    setCategory('coffee');
    setPriceEuros('2.50');
    setCostEuros('0.40');
    setVatRate(10);
    setStation('bar');
    setImageUrl('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop');
    setDescription('');
    setAllergens([]);
    setRecipeItems([]);
    setShowPresets(false);
    setShowModal(true);
  };

  const openEditModal = (p: ProductItem) => {
    if (!isOwner) return;
    setEditingProduct(p);
    setName(isIt ? p.name_it : p.name_fr);
    setCategory(p.category);
    setPriceEuros((p.price_cents / 100).toFixed(2));
    setCostEuros(p.cost_cents ? (p.cost_cents / 100).toFixed(2) : '0.50');
    setVatRate(p.vat_rate || 10);
    setStation(p.station || 'bar');
    setImageUrl(p.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=300&fit=crop');
    setDescription(isIt ? p.description_it : p.description_fr);
    setAllergens(p.allergens || []);
    setRecipeItems(p.recipe || []);
    setShowPresets(false);
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setImageUrl(String(ev.target.result));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAllergen = (val: string) => {
    setAllergens(prev =>
      prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]
    );
  };

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

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !name.trim()) return;

    const priceCents = Math.round(parseFloat(priceEuros) * 100) || 100;
    const costCents = Math.round(parseFloat(costEuros) * 100) || 0;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name_it: name,
        name_fr: name,
        category,
        price_cents: priceCents,
        cost_cents: costCents,
        vat_rate: vatRate,
        station,
        image_url: imageUrl,
        description_it: description || 'Creazione del bar',
        description_fr: description || 'Création du bar',
        allergens,
        recipe: recipeItems.length > 0 ? recipeItems : undefined,
      });
    } else {
      addProduct({
        name_it: name,
        name_fr: name,
        category,
        price_cents: priceCents,
        cost_cents: costCents,
        vat_rate: vatRate,
        station,
        image_url: imageUrl,
        description_it: description || 'Creazione del bar',
        description_fr: description || 'Création du bar',
        is_available: true,
        allergens,
        recipe: recipeItems.length > 0 ? recipeItems : undefined,
      });
    }

    setShowModal(false);
  };

  const confirmDelete = () => {
    if (!isOwner || !productToDelete) return;
    deleteProduct(productToDelete.id);
    setProductToDelete(null);
  };

  const priceNum = parseFloat(priceEuros) || 0;
  const costNum = parseFloat(costEuros) || 0;
  const marginPct = priceNum > 0 ? Math.round((1 - costNum / priceNum) * 100) : 0;

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
              ? 'Catalogo listino bar con foto personalizzate, aliquote IVA, allergeni e margini'
              : 'Catalogue des tarifs, photos personnalisées, TVA et marges'}
          </p>
        </div>

        {/* Solo il Proprietario può creare nuovi prodotti */}
        {isOwner && (
          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="h-10 px-4 bp-btn-primary text-xs shadow-md shadow-orange-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>{isIt ? 'Nuovo prodotto' : 'Nouveau produit'}</span>
            </button>
          </div>
        )}
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

      {/* Products Table with real photos and full options */}
      <div className="bp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">{isIt ? 'Prodotto & Opzioni' : 'Produit'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Categoria & Postazione' : 'Catégorie'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Prezzo & Margine' : 'Prix'}</th>
                <th className="py-3.5 px-4">{isIt ? 'Disponibilità' : 'Disponibilité'}</th>
                <th className="py-3.5 px-5 text-right">{isIt ? 'Azioni' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map(product => {
                const pName = isIt ? product.name_it : product.name_fr;
                const desc = isIt ? product.description_it : product.description_fr;
                const cost = product.cost_cents ? product.cost_cents / 100 : 0.40;
                const price = product.price_cents / 100;
                const mPct = price > 0 ? Math.round((1 - cost / price) * 100) : 0;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <ProductThumb name={pName} image={product.image_url} size={46} rounded="rounded-2xl" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{pName}</span>
                            {product.vat_rate && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                IVA {product.vat_rate}%
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{desc}</div>
                          {product.allergens && product.allergens.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {product.allergens.map(a => (
                                <span key={a} className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {product.category}
                        </span>
                        <div className="text-[10.5px] text-slate-400">
                          {product.station === 'kitchen' ? '🍳 Cucina' : product.station === 'coffee' ? '☕ Caffetteria' : '🍸 Comptoir'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{formatCents(product.price_cents)}</span>
                        <div className="text-[10.5px] font-semibold text-emerald-600">
                          Margine: {mPct}%
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(product.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            product.is_available
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {product.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {product.is_available ? (isIt ? 'Disponibile' : 'Disponible') : (isIt ? 'Esaurito' : 'Épuisé')}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            product.is_available
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {product.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {product.is_available ? (isIt ? 'Disponibile' : 'Disponible') : (isIt ? 'Esaurito' : 'Épuisé')}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      {isOwner ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            title={isIt ? 'Modifica prodotto' : 'Modifier'}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                            title={isIt ? 'Elimina prodotto' : 'Supprimer'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">{isIt ? 'Sola lettura' : 'Lecture'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative bp-fade-up max-h-[92vh] overflow-y-auto my-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <span>☕</span>
              <span>
                {editingProduct
                  ? isIt ? `Modifica ${editingProduct.name_it}` : `Modifier ${editingProduct.name_fr}`
                  : isIt ? 'Nuovo Prodotto Bar' : 'Nouveau Produit Bar'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isIt
                ? 'Personalizza foto, prezzo, categoria, IVA e opzioni operative (Solo Proprietario)'
                : 'Personnalisez la photo, le prix, la TVA et les options'}
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Photo selector section */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-orange-500" />
                  <span>{isIt ? 'Foto del Prodotto' : 'Photo du Produit'}</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-md shrink-0 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <label className="h-8 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-[11px] transition shadow-sm">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isIt ? 'Carica file' : 'Téléverser'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPresets(!showPresets)}
                        className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 text-[11px]"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{isIt ? 'Preset bar' : 'Presets'}</span>
                      </button>
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {showPresets && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-5 gap-2">
                    {PHOTO_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setShowPresets(false);
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                          imageUrl === preset.url ? 'border-orange-500 scale-105 shadow' : 'border-transparent hover:scale-105'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isIt ? 'Nome Prodotto' : 'Nom du produit'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Es: Spritz Hugo, Caffè Macchiato"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isIt ? 'Categoria' : 'Catégorie'}
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ProductItem['category'])}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="coffee">☕ Caffè & Colazione</option>
                    <option value="cocktails">🍹 Cocktails & Long Drinks</option>
                    <option value="beer">🍺 Birre</option>
                    <option value="wine">🍷 Vini & Bollicine</option>
                    <option value="softDrinks">🥤 Bibite & Succhi</option>
                    <option value="food">🥪 Snack & Food</option>
                  </select>
                </div>
              </div>

              {/* Price, Cost & Margin */}
              <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">{isIt ? 'Prezzo (€)' : 'Prix (€)'}</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    required
                    value={priceEuros}
                    onChange={e => setPriceEuros(e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">{isIt ? 'Costo stimato (€)' : 'Coût (€)'}</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={costEuros}
                    onChange={e => setCostEuros(e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">{isIt ? 'Margine %' : 'Marge %'}</label>
                  <div className="h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center font-extrabold text-emerald-700">
                    {marginPct}%
                  </div>
                </div>
              </div>

              {/* Altre opzioni: IVA, Postazione */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isIt ? 'Aliquota IVA' : 'Taux de TVA'}
                  </label>
                  <select
                    value={vatRate}
                    onChange={e => setVatRate(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value={10}>10% (Bar Somministrazione)</option>
                    <option value={22}>22% (Alcolici / Bottiglie)</option>
                    <option value={4}>4% (Prima necessità)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isIt ? 'Postazione KDS' : 'Poste KDS'}
                  </label>
                  <select
                    value={station}
                    onChange={e => setStation(e.target.value as 'bar' | 'coffee' | 'kitchen')}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="bar">🍸 Comptoir / Barman</option>
                    <option value="coffee">☕ Macchina Caffè</option>
                    <option value="kitchen">🍳 Cucina / Snack</option>
                  </select>
                </div>
              </div>

              {/* Allergens pills */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {isIt ? 'Allergeni & Opzioni dietetiche' : 'Allergènes & Régimes'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'glutine', label: '🌾 Glutine' },
                    { id: 'lattosio', label: '🥛 Lattosio' },
                    { id: 'alcol', label: '🍷 Alcolico' },
                    { id: 'vegano', label: '🌱 Vegano' },
                    { id: 'frutta_guscio', label: '🥜 Frutta guscio' },
                  ].map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAllergen(a.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition ${
                        allergens.includes(a.id)
                          ? 'bg-orange-50 border-orange-400 text-orange-600 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isIt ? 'Descrizione per il menu:' : 'Description menu :'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Es. Servito con ghiaccio cristallino e scorza..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Recipe builder section */}
              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                  <span>{isIt ? 'Fiche Tecnica / Ingredienti da scalare:' : 'Fiche technique :'}</span>
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
                            <span className="font-mono font-bold text-slate-900">
                              {item.quantity} {invItem?.base_unit}
                            </span>
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

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bp-btn-primary font-bold shadow-md shadow-orange-500/25"
                >
                  {editingProduct
                    ? isIt ? 'Salva Modifiche' : 'Enregistrer'
                    : isIt ? '+ Crea Prodotto' : '+ Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setProductToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative bp-fade-up text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              {isIt ? `Eliminare ${productToDelete.name_it}?` : `Supprimer ${productToDelete.name_fr} ?`}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isIt
                ? 'Questa operazione rimuoverà il prodotto dal catalogo e dal POS. Azione riservata al Proprietario.'
                : 'Cette action supprimera le produit du catalogue.'}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                {isIt ? 'Annulla' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 h-10 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-md shadow-rose-600/25"
              >
                {isIt ? 'Elimina' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
