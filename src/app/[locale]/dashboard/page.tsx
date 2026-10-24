'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useBarPilotStore } from '@/lib/store';
import {
  BarChart3,
  FileText,
  Users,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { BarPilotAICopilot } from '@/components/dashboard/BarPilotAICopilot';
import { ProductThumb } from '@/components/ui/ProductThumb';

interface PageProps {
  params: Promise<{ locale: string }>;
}

type StatusKey = 'preparing' | 'ready' | 'served';

const STATUS_STYLE: Record<StatusKey, { it: string; fr: string; cls: string }> = {
  preparing: { it: 'In preparazione', fr: 'En préparation', cls: 'bg-orange-50 text-orange-600 ring-orange-200' },
  ready: { it: 'Pronta', fr: 'Prête', cls: 'bg-sky-50 text-sky-600 ring-sky-200' },
  served: { it: 'Servita', fr: 'Servie', cls: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
};

export default function DashboardPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const { inventory } = useBarPilotStore();
  const [hoverBar, setHoverBar] = useState<number | null>(null);

  const lowStockCount = inventory.filter(i => i.current_quantity <= i.reorder_level).length;

  // Hourly sales (€) — 08:00 → 22:00, one bar per hour
  const hourly = [42, 68, 95, 120, 150, 185, 160, 130, 145, 170, 240, 290, 330, 260, 200];
  const maxHourly = 400;

  const recentOrders: { id: string; table: string; items: string; total: string; status: StatusKey; time: string }[] = [
    { id: '#1042', table: isIt ? 'Tavolo 04' : 'Table 04', items: isIt ? '2 cappuccini, 1 espresso' : '2 cappuccinos, 1 espresso', total: '8,50 €', status: 'preparing', time: '2 min' },
    { id: '#1041', table: isIt ? 'Tavolo 08' : 'Table 08', items: isIt ? '3 birre, 1 acqua' : '3 bières, 1 eau', total: '15,00 €', status: 'ready', time: '5 min' },
    { id: '#1040', table: 'Comptoir', items: isIt ? '1 caffè latte' : '1 café latte', total: '3,20 €', status: 'served', time: '8 min' },
    { id: '#1039', table: isIt ? 'Tavolo 02' : 'Table 02', items: isIt ? '2 cocktail, 1 tagliere' : '2 cocktails, 1 planche', total: '24,00 €', status: 'preparing', time: '6 min' },
    { id: '#1038', table: isIt ? 'Tavolo 06' : 'Table 06', items: isIt ? '1 birra, 1 panino' : '1 bière, 1 sandwich', total: '9,50 €', status: 'served', time: '12 min' },
  ];

  const topProducts = [
    { name: 'Espresso', qty: 48, total: '72,00 €' },
    { name: 'Cappuccino', qty: 35, total: '98,00 €' },
    { name: isIt ? 'Birra bionda' : 'Bière blonde', qty: 28, total: '140,00 €' },
    { name: 'Spritz', qty: 24, total: '168,00 €' },
    { name: 'Caffè latte', qty: 22, total: '70,40 €' },
  ];

  const categories = [
    { label: isIt ? 'Bevande' : 'Boissons', pct: 42, color: '#3b82f6' },
    { label: isIt ? 'Caffè' : 'Café', pct: 28, color: '#f59e0b' },
    { label: 'Cocktail', pct: 15, color: '#22c55e' },
    { label: isIt ? 'Cibo' : 'Cuisine', pct: 10, color: '#a855f7' },
    { label: isIt ? 'Altro' : 'Autre', pct: 5, color: '#94a3b8' },
  ];

  const kpis = [
    { label: isIt ? 'Fatturato registrato' : "Chiffre d'affaires", value: '1.248 €', delta: '+12%', icon: BarChart3, tone: 'bg-orange-50 text-orange-500' },
    { label: isIt ? 'Comande' : 'Commandes', value: '186', delta: '+8%', icon: FileText, tone: 'bg-sky-50 text-sky-500' },
    { label: isIt ? 'Scontrino medio' : 'Panier moyen', value: '6,71 €', delta: '+5%', icon: Users, tone: 'bg-emerald-50 text-emerald-500' },
  ];

  // Donut geometry
  const R = 54;
  const C = 2 * Math.PI * R;
  let offsetAcc = 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 bp-fade-up">
      {/* Greeting */}
      <div>
        <h1 className="text-[26px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
          {isIt ? 'Buongiorno, Marco' : 'Bonjour, Marco'} <span className="inline-block origin-[70%_70%] hover:animate-bounce">👋</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isIt ? 'Ecco cosa sta succedendo nel tuo bar oggi' : "Voici ce qui se passe dans votre bar aujourd'hui"}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bp-card bp-card-hover p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 truncate">{k.label}</p>
                <p className="mt-1.5 text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">{k.value}</p>
              </div>
              <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}>
                <k.icon className="w-5 h-5" />
              </span>
            </div>
            <p className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {k.delta}
              <span className="text-slate-400 font-medium ml-1 hidden sm:inline">{isIt ? 'vs ieri' : 'vs hier'}</span>
            </p>
          </div>
        ))}

        <div className="bp-card bp-card-hover p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] sm:text-[13px] font-medium text-slate-500">{isIt ? 'Prodotti in allerta' : 'Produits en alerte'}</p>
              <p className="mt-1.5 text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">{lowStockCount || 4}</p>
            </div>
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <Link href={`/${locale}/inventory`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-orange-600 hover:text-orange-700">
            {isIt ? 'Vedi stock' : 'Voir stock'} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        {/* Hourly bars */}
        <section className="xl:col-span-8 bp-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[15px] text-slate-900">{isIt ? 'Vendite per fascia oraria' : 'Ventes par tranche horaire'}</h2>
            <PeriodPill label={isIt ? 'Oggi' : "Aujourd'hui"} />
          </div>

          <div className="flex gap-3">
            {/* Y axis */}
            <div className="flex flex-col justify-between h-56 text-[11px] text-slate-400 font-medium pb-0.5 shrink-0">
              {[400, 300, 200, 100, 0].map(v => (
                <span key={v}>€{v}</span>
              ))}
            </div>

            <div className="relative flex-1 h-56">
              {/* Grid */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`border-t ${i === 4 ? 'border-slate-200' : 'border-dashed border-slate-100'}`} />
                ))}
              </div>

              {/* Bars */}
              <div className="absolute inset-0 flex items-end justify-between gap-1.5 sm:gap-2.5 px-1">
                {hourly.map((v, i) => (
                  <div
                    key={i}
                    className="relative flex-1 h-full flex items-end"
                    onMouseEnter={() => setHoverBar(i)}
                    onMouseLeave={() => setHoverBar(null)}
                  >
                    {hoverBar === i && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap shadow-lg"
                        style={{ bottom: `${(v / maxHourly) * 100 + 4}%`, top: 'auto' }}>
                        {String(8 + i).padStart(2, '0')}:00 · {v} €
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        hoverBar === i ? 'bg-orange-500' : 'bg-gradient-to-t from-orange-400 to-orange-300'
                      }`}
                      style={{ height: `${(v / maxHourly) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2.5 pl-10 pr-1">
            {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </section>

        {/* Donut */}
        <section className="xl:col-span-4 bp-card p-5 sm:p-6">
          <h2 className="font-bold text-[15px] text-slate-900 mb-4">{isIt ? 'Vendite per categoria' : 'Ventes par catégorie'}</h2>

          <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-6">
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r={R} fill="none" stroke="#f1f5f9" strokeWidth="20" />
                {categories.map(c => {
                  const len = (c.pct / 100) * C;
                  const el = (
                    <circle
                      key={c.label}
                      cx="70"
                      cy="70"
                      r={R}
                      fill="none"
                      stroke={c.color}
                      strokeWidth="20"
                      strokeDasharray={`${Math.max(len - 2, 0)} ${C}`}
                      strokeDashoffset={-offsetAcc}
                    />
                  );
                  offsetAcc += len;
                  return el;
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-slate-900 leading-none">1.248 €</span>
                <span className="text-[11px] text-slate-400 font-medium mt-1">{isIt ? 'Totale' : 'Total'}</span>
              </div>
            </div>

            <ul className="w-full space-y-2.5">
              {categories.map(c => (
                <li key={c.label} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </span>
                  <span className="font-semibold text-slate-900">{c.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <section className="xl:col-span-7 bp-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[15px] text-slate-900">{isIt ? 'Comande recenti' : 'Commandes récentes'}</h2>
            <Link href={`/${locale}/orders`} className="text-[13px] font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">
              {isIt ? 'Vedi tutte' : 'Voir tout'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left text-[13px] min-w-[560px]">
              <thead>
                <tr className="text-[12px] text-slate-400 font-medium">
                  <th className="py-2.5 px-2 font-medium">#</th>
                  <th className="py-2.5 px-2 font-medium">{isIt ? 'Tavolo' : 'Table'}</th>
                  <th className="py-2.5 px-2 font-medium">{isIt ? 'Articoli' : 'Articles'}</th>
                  <th className="py-2.5 px-2 font-medium">{isIt ? 'Totale' : 'Total'}</th>
                  <th className="py-2.5 px-2 font-medium">{isIt ? 'Stato' : 'Statut'}</th>
                  <th className="py-2.5 px-2 font-medium text-right">{isIt ? 'Tempo' : 'Temps'}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => {
                  const st = STATUS_STYLE[o.status];
                  return (
                    <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2 font-bold text-slate-900">{o.id}</td>
                      <td className="py-3 px-2 font-semibold text-slate-800">{o.table}</td>
                      <td className="py-3 px-2 text-slate-500 truncate max-w-[200px]">{o.items}</td>
                      <td className="py-3 px-2 font-semibold text-slate-900">{o.total}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ring-1 ring-inset ${st.cls}`}>
                          {isIt ? st.it : st.fr}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-400">{o.time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="xl:col-span-5 bp-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[15px] text-slate-900">{isIt ? 'Prodotti più venduti' : 'Produits les plus vendus'}</h2>
            <PeriodPill label={isIt ? 'Oggi' : "Aujourd'hui"} />
          </div>

          <div className="flex text-[12px] text-slate-400 font-medium py-2.5">
            <span className="w-8">#</span>
            <span className="flex-1">{isIt ? 'Prodotto' : 'Produit'}</span>
            <span className="w-14 text-right">{isIt ? 'Q.tà' : 'Qté'}</span>
            <span className="w-20 text-right">{isIt ? 'Totale' : 'Total'}</span>
          </div>

          <ul>
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center py-2 border-t border-slate-100 text-[13px]">
                <span className="w-8">
                  <span
                    className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      i === 0 ? 'bg-orange-500 text-white' : i < 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                </span>
                <span className="flex-1 flex items-center gap-3 min-w-0">
                  <ProductThumb name={p.name} size={36} rounded="rounded-lg" />
                  <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                </span>
                <span className="w-14 text-right text-slate-600 font-medium">{p.qty}</span>
                <span className="w-20 text-right font-semibold text-slate-900">{p.total}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <BarPilotAICopilot locale={locale as 'it' | 'fr'} />
    </div>
  );
}

function PeriodPill({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition">
      {label}
      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
    </button>
  );
}
