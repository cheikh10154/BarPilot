'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useBarPilotStore } from '@/lib/store';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Scale,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { ProductThumb } from '@/components/ui/ProductThumb';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function ReportsPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'products' | 'categories' | 'staff' | 'margins'>('sales');
  const [dateRange, setDateRange] = useState('01/10/2025 - 20/10/2025');
  const [periodPreset, setPeriodPreset] = useState('30days');

  // Trend data matching the mockup line chart
  const salesTrend = [
    { date: '1 ott', revenue: 620 },
    { date: '3 ott', revenue: 950 },
    { date: '5 ott', revenue: 1100 },
    { date: '7 ott', revenue: 840 },
    { date: '10 ott', revenue: 1350 },
    { date: '12 ott', revenue: 1020 },
    { date: '15 ott', revenue: 1180 },
    { date: '18 ott', revenue: 960 },
    { date: '20 ott', revenue: 1480 },
  ];

  const maxRevenue = 1500;

  // Top products performance matching mockup
  const topProducts = [
    { name_it: 'Aperol Spritz', name_fr: 'Aperol Spritz', category: 'Cocktail', qty: 894, revenue: '5.364 €', margin: '76%' },
    { name_it: 'Espresso', name_fr: 'Espresso', category: 'Caffetteria', qty: 1420, revenue: '2.130 €', margin: '82%' },
    { name_it: 'Negroni Classico', name_fr: 'Negroni Classique', category: 'Cocktail', qty: 412, revenue: '3.296 €', margin: '74%' },
    { name_it: 'Bière blonde', name_fr: 'Bière blonde', category: 'Birra', qty: 580, revenue: '3.190 €', margin: '71%' },
    { name_it: 'Tagliere Salumi', name_fr: 'Planchette Charcuterie', category: 'Food', qty: 165, revenue: '2.310 €', margin: '65%' },
  ];

  // Category share
  const categoryBreakdown = [
    { name_it: 'Cocktail & Aperitivi', name_fr: 'Cocktails & Apéritifs', percent: 42, amount: '10.437 €', color: 'bg-orange-500' },
    { name_it: 'Caffetteria & Colazioni', name_fr: 'Café & Petits-déjeuners', percent: 28, amount: '6.958 €', color: 'bg-amber-500' },
    { name_it: 'Birre & Vini', name_fr: 'Bières & Vins', percent: 18, amount: '4.473 €', color: 'bg-yellow-500' },
    { name_it: 'Food & Cucina', name_fr: 'Planches & Cuisine', percent: 12, amount: '2.982 €', color: 'bg-emerald-500' },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Data,Fatturato_EUR\n' +
      salesTrend.map(e => `${e.date},${e.revenue}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `barpilot_rapporto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12 bp-fade-up">
      {/* Top Header Card */}
      <div className="bp-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isIt ? 'Rapporti' : 'Rapports'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {isIt ? 'Dati consolidati' : 'Données consolidées'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Analisi delle vendite, scontrino medio, margini e chiusura cassa RT' 
              : 'Analyse des ventes, panier moyen, marges et rapprochement RT'}
          </p>
        </div>

        {/* Date Filter & Actions matching mockup */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dateRange}</span>
          </div>

          <div className="relative">
            <select
              value={periodPreset}
              onChange={e => setPeriodPreset(e.target.value)}
              className="appearance-none px-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="today">{isIt ? 'Oggi' : 'Aujourd\'hui'}</option>
              <option value="7days">{isIt ? 'Ultimi 7 giorni' : '7 derniers jours'}</option>
              <option value="30days">{isIt ? 'Ultimi 30 giorni' : '30 derniers jours'}</option>
              <option value="month">{isIt ? 'Questo mese' : 'Ce mois-ci'}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 bp-btn-primary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIt ? 'Esporta' : 'Exporter'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs matching mockup (Vendite, Prodotti, Categorie, Personale, Margini) */}
      <div className="bp-card p-2 flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'sales', label_it: 'Vendite', label_fr: 'Ventes' },
          { id: 'products', label_it: 'Prodotti', label_fr: 'Produits' },
          { id: 'categories', label_it: 'Categorie', label_fr: 'Catégories' },
          { id: 'personnel', label_it: 'Personale', label_fr: 'Personnel' },
          { id: 'margins', label_it: 'Margini', label_fr: 'Marges' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              activeReportTab === tab.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isIt ? tab.label_it : tab.label_fr}
          </button>
        ))}

        <div className="ml-auto pl-2 hidden sm:block">
          <Link
            href={`/${locale}/reports/reconciliation`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 text-xs font-bold transition"
          >
            <Scale className="w-3.5 h-3.5 text-orange-600" />
            <span>{isIt ? 'Riconciliazione RT' : 'Rapprochement RT'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3 Top Stat Cards matching mockup numbers: 24.850 €, 3.692, 6,73 € */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Fatturato */}
        <div className="bp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Fatturato' : 'Chiffre d\'affaires'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +12%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">24.850 €</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'vs 22.180 € periodo prec.' : 'vs 22 180 € période préc.'}
          </span>
        </div>

        {/* Card 2: Comande */}
        <div className="bp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Comande' : 'Commandes'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +8%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">3.692</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'Media di 184 al giorno' : 'Moyenne de 184 par jour'}
          </span>
        </div>

        {/* Card 3: Scontrino medio */}
        <div className="bp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Scontrino medio' : 'Panier moyen'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +5%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">6,73 €</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'Rush aperitivo a 14,20 €' : 'Pic apéritif à 14,20 €'}
          </span>
        </div>
      </div>

      {/* Big SVG Line Trend Chart matching mockup */}
      <div className="bp-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isIt ? 'Andamento Fatturato' : 'Évolution du Chiffre d\'Affaires'}
            </h3>
            <p className="text-xs text-slate-400">
              {isIt ? 'Ottobre 2025 · Curva giornaliera' : 'Octobre 2025 · Tendance journalière'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs font-semibold text-slate-600">{isIt ? 'Fatturato giornaliero' : 'Ventes'}</span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative w-full h-64">
          <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-semibold text-slate-400 w-12">
            <span>€1.500</span>
            <span>€1.000</span>
            <span>€500</span>
            <span>0</span>
          </div>

          <div className="ml-14 h-52 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guide lines */}
              <line x1="0" y1="10" x2="800" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="65" x2="800" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="800" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="175" x2="800" y2="175" stroke="#e2e8f0" strokeWidth="1" />

              {/* Area */}
              <polygon
                fill="url(#chartGradient)"
                points={`
                  ${salesTrend
                    .map((d, i) => {
                      const x = (i / (salesTrend.length - 1)) * 800;
                      const y = 175 - (d.revenue / maxRevenue) * 165;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  800,175 0,175
                `}
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={salesTrend
                  .map((d, i) => {
                    const x = (i / (salesTrend.length - 1)) * 800;
                    const y = 175 - (d.revenue / maxRevenue) * 165;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Dots */}
              {salesTrend.map((d, i) => {
                const x = (i / (salesTrend.length - 1)) * 800;
                const y = 175 - (d.revenue / maxRevenue) * 165;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#ffffff"
                    stroke="#f97316"
                    strokeWidth="3"
                  />
                );
              })}
            </svg>

            {/* X Labels matching mockup: 1 ott, 5 ott, 10 ott, 15 ott, 20 ott */}
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 pt-3">
              <span>1 ott</span>
              <span>5 ott</span>
              <span>10 ott</span>
              <span>15 ott</span>
              <span>20 ott</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Products with Photos & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bp-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {isIt ? 'Classifica Prodotti per Fatturato' : 'Classement Produits'}
              </h4>
              <p className="text-xs text-slate-400">
                {isIt ? 'Volumi venduti e margine lordo stimato' : 'Volumes et marges théoriques'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">{isIt ? 'Prodotto' : 'Produit'}</th>
                  <th className="py-2.5 px-3">{isIt ? 'Quantità' : 'Quantité'}</th>
                  <th className="py-2.5 px-3">{isIt ? 'Ricavo' : 'Revenu'}</th>
                  <th className="py-2.5 px-3 text-right">{isIt ? 'Margine' : 'Marge'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb name={p.name_it} size={36} rounded="rounded-lg" />
                        <div>
                          <div className="font-bold text-slate-900">{isIt ? p.name_it : p.name_fr}</div>
                          <div className="text-[10px] text-slate-400">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{p.qty} pz</td>
                    <td className="py-3 px-3 font-black text-slate-900">{p.revenue}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.margin}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="space-y-4">
          <div className="bp-card p-5">
            <h4 className="font-bold text-slate-900 text-sm mb-3">
              {isIt ? 'Ripartizione per Categoria' : 'Répartition par Catégorie'}
            </h4>

            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{isIt ? cat.name_it : cat.name_fr}</span>
                    <span className="font-bold text-slate-900">{cat.amount} ({cat.percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500">
                {isIt ? 'Margine lordo stimato:' : 'Marge brute estimée :'} {' '}
                <span className="font-black text-emerald-600">73,5%</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                {isIt ? 'Conformità Registratore Telematico' : 'Conformité Caisse RT'}
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {isIt
                  ? 'I dati registrati su BarPilot sono operativi. Per la chiusura contabile, effettua la riconciliazione con il tuo RT.'
                  : 'BarPilot est opérationnel. Pour la clôture comptable, effectuez le rapprochement RT.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
