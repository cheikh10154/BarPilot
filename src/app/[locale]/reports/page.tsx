'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useBarPilotStore } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Calendar,
  Percent,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Scale,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function ReportsPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { orders } = useBarPilotStore();
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'products' | 'categories' | 'staff' | 'margins'>('sales');
  const [dateRange, setDateRange] = useState('01/10/2025 - 20/10/2025');
  const [periodPreset, setPeriodPreset] = useState('30days');

  // Trend data for October (matching the mockup line chart)
  const salesTrend = [
    { date: '01 Ott', revenue: 980, orders: 142 },
    { date: '03 Ott', revenue: 1120, orders: 165 },
    { date: '05 Ott', revenue: 1450, orders: 210 },
    { date: '08 Ott', revenue: 1210, orders: 180 },
    { date: '10 Ott', revenue: 1390, orders: 198 },
    { date: '12 Ott', revenue: 1580, orders: 232 },
    { date: '14 Ott', revenue: 1240, orders: 175 },
    { date: '16 Ott', revenue: 1490, orders: 215 },
    { date: '18 Ott', revenue: 1820, orders: 270 },
    { date: '20 Ott', revenue: 1650, orders: 245 },
  ];

  const maxRevenue = Math.max(...salesTrend.map(d => d.revenue));

  // Top products performance
  const topProducts = [
    { name_it: 'Aperol Spritz', name_fr: 'Aperol Spritz', category: 'Cocktail', qty: 894, revenue: 5364, margin: '76%' },
    { name_it: 'Espresso Arabica', name_fr: 'Espresso Arabica', category: 'Caffetteria', qty: 1420, revenue: 1846, margin: '82%' },
    { name_it: 'Negroni Classico', name_fr: 'Negroni Classique', category: 'Cocktail', qty: 412, revenue: 3296, margin: '74%' },
    { name_it: 'Bière Blonde Pression', name_fr: 'Bière Blonde Pression', category: 'Birra', qty: 580, revenue: 3190, margin: '71%' },
    { name_it: 'Tagliere Salumi & Formaggi', name_fr: 'Planchette Charcuterie', category: 'Food', qty: 165, revenue: 2310, margin: '65%' },
  ];

  // Category share
  const categoryBreakdown = [
    { name_it: 'Cocktail & Aperitivi', name_fr: 'Cocktails & Apéritifs', percent: 42, amount: '10.437 €', color: 'bg-orange-500' },
    { name_it: 'Caffetteria & Colazioni', name_fr: 'Café & Petits-déjeuners', percent: 24, amount: '5.964 €', color: 'bg-amber-500' },
    { name_it: 'Birre & Vini', name_fr: 'Bières & Vins', percent: 19, amount: '4.721 €', color: 'bg-yellow-500' },
    { name_it: 'Food & Cucina', name_fr: 'Planches & Cuisine', percent: 15, amount: '3.728 €', color: 'bg-emerald-500' },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Data,Fatturato_EUR,Comande\n' +
      salesTrend.map(e => `${e.date},${e.revenue},${e.orders}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `barpilot_rapporto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">
              {isIt ? 'Rapporti & Statistiche' : 'Rapports & Statistiques'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {isIt ? 'Dati consolidati' : 'Données consolidées'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Analisi delle vendite, scontrino medio, margini stimati e chiusura cassa con RT' 
              : 'Analyse des ventes, panier moyen, marges théoriques et pointage de caisse RT'}
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{dateRange}</span>
          </div>

          <select
            value={periodPreset}
            onChange={e => setPeriodPreset(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
          >
            <option value="today">{isIt ? 'Oggi' : 'Aujourd\'hui'}</option>
            <option value="7days">{isIt ? 'Ultimi 7 giorni' : '7 derniers jours'}</option>
            <option value="30days">{isIt ? 'Ultimi 30 giorni' : '30 derniers jours'}</option>
            <option value="month">{isIt ? 'Questo mese' : 'Ce mois-ci'}</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm hover:shadow transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isIt ? 'Esporta CSV' : 'Exporter CSV'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs (Vendite, Prodotti, Categorie, Personale, Margini) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'sales', label_it: 'Vendite', label_fr: 'Ventes' },
          { id: 'products', label_it: 'Prodotti', label_fr: 'Produits' },
          { id: 'categories', label_it: 'Categorie', label_fr: 'Catégories' },
          { id: 'personnel', label_it: 'Personale', label_fr: 'Personnel' },
          { id: 'margins', label_it: 'Margini & Food Cost', label_fr: 'Marges & Coûts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
              activeReportTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isIt ? tab.label_it : tab.label_fr}
          </button>
        ))}

        <div className="ml-auto pl-2">
          <Link
            href={`/${locale}/reports/reconciliation`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition"
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            <span>{isIt ? 'Riconciliazione RT' : 'Rapprochement RT'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3 Top Stat Cards (exact mockup numbers: 24.850 €, 3.692, 6,73 €) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Fatturato */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Fatturato Registrato' : 'Chiffre d\'Affaires'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +12%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">24.850 €</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'vs 22.180 € periodo precedente' : 'vs 22 180 € période précédente'}
          </span>
        </div>

        {/* Card 2: Comande */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Comande Totali' : 'Commandes'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +8%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">3.692</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'Media di 184 ordini / giorno' : 'Moyenne de 184 commandes / jour'}
          </span>
        </div>

        {/* Card 3: Scontrino medio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Scontrino Medio' : 'Panier Moyen'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +5%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">6,73 €</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'Aperitivo rush ore 18:30 a 14,20 €' : 'Pic apéritif 18h30 à 14,20 €'}
          </span>
        </div>
      </div>

      {/* Big SVG Line Trend Chart (matching mockup) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isIt ? 'Andamento Fatturato Giornaliero' : 'Évolution du Chiffre d\'Affaires'}
            </h3>
            <p className="text-xs text-slate-400">
              {isIt ? 'Ottobre 2025 • Curve spline con picchi nel weekend' : 'Octobre 2025 • Tendance des ventes'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-600" />
              <span className="text-slate-600 font-medium">{isIt ? 'Vendite effettive' : 'Ventes'}</span>
            </div>
          </div>
        </div>

        {/* High-quality SVG Chart */}
        <div className="relative w-full h-64">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 900 220" preserveAspectRatio="none">
            <defs>
              <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal guide lines */}
            <line x1="0" y1="30" x2="900" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="900" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="130" x2="900" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="180" x2="900" y2="180" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

            {/* Area under the curve */}
            <polygon
              fill="url(#orangeGradient)"
              points={`
                ${salesTrend
                  .map((d, i) => {
                    const x = (i / (salesTrend.length - 1)) * 900;
                    const y = 200 - (d.revenue / maxRevenue) * 160;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                900,200 0,200
              `}
            />

            {/* Main orange line */}
            <polyline
              fill="none"
              stroke="#ea580c"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={salesTrend
                .map((d, i) => {
                  const x = (i / (salesTrend.length - 1)) * 900;
                  const y = 200 - (d.revenue / maxRevenue) * 160;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Dots on data points */}
            {salesTrend.map((d, i) => {
              const x = (i / (salesTrend.length - 1)) * 900;
              const y = 200 - (d.revenue / maxRevenue) * 160;
              return (
                <g key={i} className="group cursor-pointer">
                  <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#ea580c" strokeWidth="3" />
                  <circle cx={x} cy={y} r="14" fill="transparent" />
                </g>
              );
            })}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-3 pt-2 border-t border-slate-100">
            {salesTrend.map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Products Table & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top 5 Products Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {isIt ? 'Classifica Prodotti per Fatturato' : 'Classement Produits'}
              </h4>
              <p className="text-xs text-slate-400">
                {isIt ? 'Volumi venduti e margine lordo stimato' : 'Volumes et marges théoriques'}
              </p>
            </div>

            <span className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer">
              {isIt ? 'Tutti i prodotti' : 'Tous'}
            </span>
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
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{isIt ? p.name_it : p.name_fr}</div>
                          <div className="text-[10px] text-slate-400">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{p.qty} pz</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{p.revenue.toLocaleString()} €</td>
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

        {/* Category Breakdown & Non-Fiscal Alert */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
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
                {isIt ? 'Margine lordo medio stimato:' : 'Marge brute moyenne estimée :'} {' '}
                <span className="font-extrabold text-emerald-600">73,5%</span>
              </span>
            </div>
          </div>

          {/* Legal Compliance Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                {isIt ? 'Nota di Conformità Fiscale RT' : 'Note de Conformité Fiscale RT'}
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {isIt
                  ? 'I dati operativi di BarPilot monitorano comande e magazzino. Per la chiusura fiscale e la trasmissione AdE, riconcilia con il tuo Registratore Telematico.'
                  : 'Les données BarPilot sont opérationnelles. Pour la clôture fiscale, effectuez le rapprochement avec votre caisse enregistreuse certifiée.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
