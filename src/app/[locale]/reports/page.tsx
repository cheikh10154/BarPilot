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
  const [periodPreset, setPeriodPreset] = useState<'today' | '7days' | '30days'>('7days');
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);

  // Dynamic datasets for Giornaliero, Settimanale, Mensile
  const datasets = {
    today: {
      range: isIt ? 'Oggi · ' + new Date().toLocaleDateString('it-IT') : "Aujourd'hui",
      kpiRevenue: '1.550 €',
      kpiOrders: '278',
      kpiAvg: '5,58 €',
      kpiGrowth: '+14.2%',
      maxRevenue: 400,
      yLabels: ['400 €', '300 €', '200 €', '100 €', '0 €'],
      trend: [
        { date: '08:00', revenue: 65, orders: 24 },
        { date: '10:00', revenue: 140, orders: 42 },
        { date: '12:00', revenue: 210, orders: 35 },
        { date: '14:00', revenue: 160, orders: 30 },
        { date: '16:00', revenue: 95, orders: 18 },
        { date: '18:00', revenue: 380, orders: 58 },
        { date: '20:00', revenue: 320, orders: 45 },
        { date: '22:00', revenue: 180, orders: 26 },
      ],
    },
    '7days': {
      range: isIt ? 'Ultimi 7 giorni (Lun 19 - Dom 25 Ottobre)' : '7 derniers jours',
      kpiRevenue: '11.220 €',
      kpiOrders: '1.540',
      kpiAvg: '7,29 €',
      kpiGrowth: '+9.4%',
      maxRevenue: 2500,
      yLabels: ['2.500 €', '2.000 €', '1.500 €', '1.000 €', '500 €', '0 €'],
      trend: [
        { date: 'Lun 19', revenue: 980, orders: 145 },
        { date: 'Mar 20', revenue: 1150, orders: 168 },
        { date: 'Mer 21', revenue: 1280, orders: 182 },
        { date: 'Gio 22', revenue: 1420, orders: 195 },
        { date: 'Ven 23', revenue: 2180, orders: 290 },
        { date: 'Sab 24', revenue: 2450, orders: 320 },
        { date: 'Dom 25', revenue: 1760, orders: 240 },
      ],
    },
    '30days': {
      range: isIt ? 'Mese Corrente (1 - 31 Ottobre)' : '30 derniers jours',
      kpiRevenue: '42.850 €',
      kpiOrders: '5.860',
      kpiAvg: '7,31 €',
      kpiGrowth: '+12.8%',
      maxRevenue: 2500,
      yLabels: ['2.500 €', '2.000 €', '1.500 €', '1.000 €', '500 €', '0 €'],
      trend: [
        { date: '01 Ott', revenue: 1120, orders: 160 },
        { date: '05 Ott', revenue: 1350, orders: 185 },
        { date: '10 Ott', revenue: 1280, orders: 175 },
        { date: '15 Ott', revenue: 1640, orders: 215 },
        { date: '20 Ott', revenue: 1520, orders: 200 },
        { date: '25 Ott', revenue: 2150, orders: 280 },
        { date: '31 Ott', revenue: 1840, orders: 245 },
      ],
    },
  };

  const currentData = datasets[periodPreset];
  const salesTrend = currentData.trend;
  const maxRevenue = currentData.maxRevenue;

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
      'Data_Orario,Fatturato_EUR,Comande\n' +
      salesTrend.map(e => `${e.date},${e.revenue},${e.orders}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `barpilot_rapporto_${periodPreset}_${new Date().toISOString().slice(0, 10)}.csv`);
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
              {isIt ? 'Rapporti & Statistiche' : 'Rapports & Statistiques'}
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

        {/* Date Filter & Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Tabs: Giornaliero, Settimanale, Mensile */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPeriodPreset('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodPreset === 'today'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 {isIt ? 'Giornaliero' : 'Jour'}
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodPreset === '7days'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 {isIt ? 'Settimanale' : 'Semaine'}
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('30days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodPreset === '30days'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗓️ {isIt ? 'Mensile' : 'Mois'}
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 bp-btn-primary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIt ? 'Esporta CSV' : 'Exporter CSV'}</span>
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

      {/* 3 Top Stat Cards matching dynamic timeframe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Fatturato */}
        <div className="bp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Fatturato Totale' : "Chiffre d'affaires"}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              {currentData.kpiGrowth}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{currentData.kpiRevenue}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {currentData.range}
          </span>
        </div>

        {/* Card 2: Comande */}
        <div className="bp-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Comande Servite' : 'Commandes'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +8%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{currentData.kpiOrders}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'Media transazioni periodo' : 'Moyenne période'}
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
            <span className="text-3xl font-black text-slate-900 tracking-tight">{currentData.kpiAvg}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isIt ? 'Picco serale a 14,20 €' : 'Pic apéritif à 14,20 €'}
          </span>
        </div>
      </div>

      {/* Big SVG Line Trend Chart with X-Axis (Date) and Y-Axis (Valori) */}
      <div className="bp-card p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isIt ? 'Andamento Incassi' : "Évolution du Chiffre d'Affaires"}
            </h3>
            <p className="text-xs text-slate-400">
              {currentData.range} · {isIt ? 'Ascisse (X): Date / Orari · Bississe (Y): Valori in Euro (€)' : 'Axes X & Y'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs font-semibold text-slate-600">
              {isIt ? 'Fatturato (€)' : 'Ventes (€)'}
            </span>
          </div>
        </div>

        {/* SVG Chart with real X and Y axes */}
        <div className="relative w-full h-72">
          {/* Y Axis Labels (Bississe) */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[11px] font-bold text-slate-400 w-16 text-right pr-2">
            {currentData.yLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>

          {/* SVG Canvas */}
          <div className="ml-16 h-56 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Y Guide lines */}
              {[10, 55, 100, 145, 190].map((y, idx) => (
                <line
                  key={idx}
                  x1="0"
                  y1={y}
                  x2="800"
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
              <line x1="0" y1="190" x2="800" y2="190" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Area */}
              <polygon
                fill="url(#chartGradient)"
                points={`
                  0,190
                  ${salesTrend
                    .map((d, i) => {
                      const x = (i / (salesTrend.length - 1)) * 800;
                      const y = 190 - (d.revenue / maxRevenue) * 180;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  800,190
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
                    const y = 190 - (d.revenue / maxRevenue) * 180;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Dots and Labels */}
              {salesTrend.map((d, i) => {
                const x = (i / (salesTrend.length - 1)) * 800;
                const y = 190 - (d.revenue / maxRevenue) * 180;
                const isSelected = selectedPointIdx === i;

                return (
                  <g key={i} className="cursor-pointer" onClick={() => setSelectedPointIdx(i)}>
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-[11px] font-extrabold fill-orange-600"
                    >
                      {d.revenue} €
                    </text>
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? '7' : '5'}
                      className="fill-white stroke-orange-500 stroke-[3] transition-all hover:stroke-[4]"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X Labels (Ascisse: Date / Ore) directly aligned under each point */}
            <div className="flex justify-between text-[11px] font-bold text-slate-700 pt-3">
              {salesTrend.map((d, idx) => (
                <span
                  key={idx}
                  className={`cursor-pointer transition-colors ${
                    selectedPointIdx === idx ? 'text-orange-600 underline font-black' : 'hover:text-orange-500'
                  }`}
                  onClick={() => setSelectedPointIdx(idx)}
                >
                  {d.date}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Selected point interactive bar */}
        {selectedPointIdx !== null && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between text-xs text-orange-950 animate-in fade-in">
            <div>
              <span className="font-bold">📅 {salesTrend[selectedPointIdx].date}:</span>
              <span className="ml-2 font-black text-orange-600 text-sm">{salesTrend[selectedPointIdx].revenue} €</span>
              <span className="ml-3 text-slate-500">· {salesTrend[selectedPointIdx].orders} comande</span>
            </div>
            <button
              onClick={() => setSelectedPointIdx(null)}
              className="text-xs text-orange-700 font-bold hover:underline"
            >
              Chiudi
            </button>
          </div>
        )}
      </div>

      {/* Top Products & Categories tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bp-card p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">
            {isIt ? 'Top Prodotti per Fatturato' : 'Top Produits'}
          </h3>
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <ProductThumb name={p.name_it} size={36} rounded="rounded-xl" />
                  <div>
                    <div className="font-bold text-slate-900">{isIt ? p.name_it : p.name_fr}</div>
                    <div className="text-[10px] text-slate-400">{p.qty} venduti · Margine {p.margin}</div>
                  </div>
                </div>
                <span className="font-black text-slate-900">{p.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bp-card p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">
            {isIt ? 'Ripartizione per Categorie' : 'Répartition Catégories'}
          </h3>
          <div className="space-y-3.5">
            {categoryBreakdown.map((c, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{isIt ? c.name_it : c.name_fr}</span>
                  <span className="font-bold text-slate-900">{c.amount} ({c.percent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
