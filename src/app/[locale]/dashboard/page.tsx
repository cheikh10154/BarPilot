'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useBarPilotStore } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  TrendingUp,
  FileText,
  Users,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { BarPilotAICopilot } from '@/components/dashboard/BarPilotAICopilot';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function DashboardPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const { orders, inventory } = useBarPilotStore();

  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const lowStockCount = inventory.filter(i => i.current_quantity <= i.reorder_level).length;

  // Realistic mock data matching photo
  const hourlyBars = [
    { hour: '08:00', height: 25 },
    { hour: '', height: 35 },
    { hour: '10:00', height: 45 },
    { hour: '', height: 40 },
    { hour: '12:00', height: 65 },
    { hour: '', height: 55 },
    { hour: '14:00', height: 48 },
    { hour: '', height: 38 },
    { hour: '16:00', height: 52 },
    { hour: '', height: 60 },
    { hour: '18:00', height: 78 },
    { hour: '', height: 88 },
    { hour: '20:00', height: 98 },
    { hour: '', height: 75 },
    { hour: '22:00', height: 60 },
  ];

  const recentOrdersList = [
    { id: '#1042', table: 'Tavolo 04', items: '2 cappuccini, 1 espresso', total: '8,50 €', status: 'In preparazione', statusColor: 'bg-orange-50 text-orange-600 border-orange-200', time: '2 min' },
    { id: '#1041', table: 'Tavolo 08', items: '3 birre, 1 acqua', total: '15,00 €', status: 'Pronta', statusColor: 'bg-blue-50 text-blue-600 border-blue-200', time: '5 min' },
    { id: '#1040', table: 'Comptoir', items: '1 caffè latte', total: '3,20 €', status: 'Servita', statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-200', time: '8 min' },
    { id: '#1039', table: 'Tavolo 02', items: '2 cocktail, 1 tagliere', total: '24,00 €', status: 'In preparazione', statusColor: 'bg-orange-50 text-orange-600 border-orange-200', time: '6 min' },
    { id: '#1038', table: 'Tavolo 06', items: '1 birra, 1 panino', total: '9,50 €', status: 'Servita', statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-200', time: '12 min' },
  ];

  const topProducts = [
    { rank: 1, name: 'Espresso', icon: '☕', qty: 48, total: '72,00 €' },
    { rank: 2, name: 'Cappuccino', icon: '☕', qty: 35, total: '98,00 €' },
    { rank: 3, name: 'Bière blonde', icon: '🍺', qty: 28, total: '140,00 €' },
    { rank: 4, name: 'Spritz', icon: '🍹', qty: 24, total: '168,00 €' },
    { rank: 5, name: 'Caffè latte', icon: '🥛', qty: 22, total: '70,40 €' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      
      {/* Title & Greeting Banner matching photo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isIt ? 'Buongiorno, Marco' : 'Bonjour, Marco'}</span>
            <span>👋</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            {isIt ? 'Ecco cosa sta succedendo nel tuo bar oggi' : 'Voici ce qui se passe dans votre bar aujourd\'hui'}
          </p>
        </div>
      </div>

      {/* 4 Top KPI Cards (Matching exact photo layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Fatturato registrato */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">
              {isIt ? 'Fatturato registrato' : 'Chiffre d\'affaires'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            1.248 €
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <span>↑</span>
              <span>+12%</span>
            </span>
          </div>
        </div>

        {/* Card 2: Comande */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">
              {isIt ? 'Comande' : 'Commandes'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            186
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <span>↑</span>
              <span>+8%</span>
            </span>
          </div>
        </div>

        {/* Card 3: Scontrino medio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">
              {isIt ? 'Scontrino medio' : 'Panier moyen'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            6,71 €
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <span>↑</span>
              <span>+5%</span>
            </span>
          </div>
        </div>

        {/* Card 4: Prodotti in allerta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">
              {isIt ? 'Prodotti in allerta' : 'Produits en alerte'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {lowStockCount || 4}
          </div>
          <div className="mt-2">
            <Link
              href={`/${locale}/inventory`}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
            >
              <span>{isIt ? 'Vedi stock →' : 'Voir stock →'}</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Row 2: Charts Row (Matching photo) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Chart: Vendite per fascia oraria (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-extrabold text-base text-slate-900">
              {isIt ? 'Vendite per fascia oraria' : 'Ventes par tranche horaire'}
            </h2>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200 transition">
              <span>{isIt ? 'Oggi' : 'Aujourd\'hui'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          {/* Bar Chart Graphics */}
          <div className="h-52 flex items-end justify-between gap-1.5 sm:gap-3 px-2 border-b border-slate-100 pb-3">
            {hourlyBars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${bar.height}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-2 pt-3">
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>22:00</span>
          </div>
        </div>

        {/* Right Chart: Vendite per categoria (4 cols Donut) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h2 className="font-extrabold text-base text-slate-900 mb-4">
            {isIt ? 'Vendite per categoria' : 'Ventes par catégorie'}
          </h2>

          <div className="flex items-center justify-center py-2">
            {/* Visual Donut representation matching photo */}
            <div className="relative w-36 h-36 rounded-full border-[18px] border-blue-500 flex items-center justify-center shadow-inner">
              <div className="text-center">
                <span className="text-base font-black text-slate-900 block leading-tight">1.248 €</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isIt ? 'Totale' : 'Total'}</span>
              </div>
            </div>
          </div>

          {/* Legend Breakdown matching photo */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Bevande
              </span>
              <span className="font-bold text-slate-900">42%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Caffè
              </span>
              <span className="font-bold text-slate-900">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Cocktail
              </span>
              <span className="font-bold text-slate-900">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Cibo
              </span>
              <span className="font-bold text-slate-900">10%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Comande recenti + Prodotti più venduti (Matching photo) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Comande recenti table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base text-slate-900">
              {isIt ? 'Comande recenti' : 'Commandes récentes'}
            </h2>
            <Link
              href={`/${locale}/orders`}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>{isIt ? 'Vedi tutte →' : 'Voir toutes →'}</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 pr-2">#</th>
                  <th className="py-2.5 px-2">{isIt ? 'Tavolo' : 'Table'}</th>
                  <th className="py-2.5 px-2">{isIt ? 'Articoli' : 'Articles'}</th>
                  <th className="py-2.5 px-2">{isIt ? 'Totale' : 'Total'}</th>
                  <th className="py-2.5 px-2">{isIt ? 'Stato' : 'Statut'}</th>
                  <th className="py-2.5 pl-2 text-right">{isIt ? 'Tempo' : 'Temps'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentOrdersList.map((ord, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 pr-2 font-mono font-bold text-slate-900">{ord.id}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">{ord.table}</td>
                    <td className="py-3 px-2 text-slate-500 max-w-[160px] truncate">{ord.items}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">{ord.total}</td>
                    <td className="py-3 px-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ord.statusColor}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-right text-slate-400 text-[11px]">{ord.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prodotti più venduti list (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base text-slate-900">
              {isIt ? 'Prodotti più venduti' : 'Produits les plus vendus'}
            </h2>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200 transition">
              <span>{isIt ? 'Oggi' : 'Aujourd\'hui'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex justify-between pb-2">
              <span># {isIt ? 'Prodotto' : 'Produit'}</span>
              <div className="flex gap-6">
                <span>Q.tà</span>
                <span className="w-14 text-right">Totale</span>
              </div>
            </div>

            {topProducts.map((p) => (
              <div key={p.rank} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-400 w-3">{p.rank}</span>
                  <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-sm shadow-xs">
                    {p.icon}
                  </div>
                  <span className="font-bold text-slate-800">{p.name}</span>
                </div>

                <div className="flex items-center gap-6">
                  <span className="font-semibold text-slate-600">{p.qty}</span>
                  <span className="font-bold text-slate-900 w-14 text-right">{p.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BarPilot AI Copilot Assistant */}
      <BarPilotAICopilot locale={locale as 'it' | 'fr'} />

    </div>
  );
}
