'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useBarPilotStore, DiningTable } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  Grid,
  Plus,
  UtensilsCrossed,
  QrCode,
  Printer,
  X,
  Users,
  Clock
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function TablesPlanPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { tables, orders } = useBarPilotStore();
  const [selectedArea, setSelectedArea] = useState<string>('indoor');
  const [qrModalTable, setQrModalTable] = useState<any | null>(null);

  const areas = [
    { id: 'all', label: isIt ? 'Tutti' : 'Tous' },
    { id: 'indoor', label: isIt ? 'Interno' : 'Intérieur' },
    { id: 'outdoor', label: isIt ? 'Terrazza' : 'Terrasse' },
    { id: 'bar', label: isIt ? 'Comptoir' : 'Comptoir' },
    { id: 'vip', label: 'VIP' },
  ];

  // Visual tables configuration matching the photo floor plan
  const visualTables = [
    { id: 'T01', number: 'T01', capacity: 4, status: 'free', total: null, time: null, color: 'bg-[#dcfce7] border-[#86efac] text-slate-800' },
    { id: 'T02', number: 'T02', capacity: 2, status: 'occupied', total: '12,50 €', time: null, color: 'bg-[#ffedd5] border-[#fdba74] text-slate-900' },
    { id: 'T03', number: 'T03', capacity: 4, status: 'free', total: null, time: null, color: 'bg-[#dcfce7] border-[#86efac] text-slate-800' },
    { id: 'T04', number: 'T04', capacity: 4, status: 'bill', total: '25,00 €', time: null, color: 'bg-[#dbeafe] border-[#93c5fd] text-slate-900' },
    { id: 'T05', number: 'T05', capacity: 2, status: 'occupied', total: '15,00 €', time: '23 min', color: 'bg-[#ffedd5] border-[#fdba74] text-slate-900' },
    { id: 'T06', number: 'T06', capacity: 6, status: 'free', total: null, time: null, color: 'bg-[#dcfce7] border-[#86efac] text-slate-800' },
    { id: 'T07', number: 'T07', capacity: 4, status: 'reserved', total: 'Reservation 20:00', time: null, color: 'bg-[#ede9fe] border-[#c4b5fd] text-slate-900' },
    { id: 'T08', number: 'T08', capacity: 4, status: 'occupied', total: '18,50 €', time: null, color: 'bg-[#ffedd5] border-[#fdba74] text-slate-900' },
    { id: 'T09', number: 'T09', capacity: 4, status: 'free', total: null, time: null, color: 'bg-[#dcfce7] border-[#86efac] text-slate-800' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* Header matching photo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Plan de salle
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt ? 'Gestione visiva della sala e dei tavoli in tempo reale' : 'Gestion visuelle de la salle et des tables en direct'}
          </p>
        </div>

        <button
          onClick={() => alert(isIt ? 'Configurazione nuovo tavolo' : 'Ajout de table')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-orange-500" />
          <span>{isIt ? '+ Aggiungi tavolo' : '+ Ajouter une table'}</span>
        </button>
      </div>

      {/* Area Filter Tabs matching photo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {areas.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedArea(a.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all ${
              selectedArea === a.id
                ? 'bg-[#ea580c] text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Floor Plan Canvas matching photo */}
      <div className="bg-[#edeae3] rounded-3xl p-6 sm:p-10 border border-[#d6d0c4] shadow-inner relative overflow-hidden min-h-[560px]">
        
        {/* Subtle wooden floor tile grid texture */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {visualTables.map(t => (
            <div
              key={t.id}
              className={`relative rounded-3xl p-5 border-2 ${t.color} shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] cursor-pointer group`}
              onClick={() => setQrModalTable(t)}
            >
              {/* Urgent time tag if any */}
              {t.time && (
                <div className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] shadow-md flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" />
                  <span>{t.time}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-slate-900 tracking-tight">{t.number}</span>
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span>{t.capacity} pers.</span>
                  </span>
                </div>

                <div className="mt-2">
                  {t.status === 'free' ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                      {isIt ? 'Libero' : 'Libre'}
                    </span>
                  ) : t.status === 'reserved' ? (
                    <span className="text-xs font-bold text-purple-900 bg-purple-200/60 px-2 py-0.5 rounded-md">
                      {t.total}
                    </span>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-base font-black text-slate-900 block">{t.total}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        {t.status === 'bill' ? (isIt ? 'Da pagare' : 'À payer') : (isIt ? 'In corso' : 'En cours')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons inside card */}
              <div className="pt-3 mt-3 border-t border-black/10 flex items-center justify-between text-xs">
                <Link
                  href={`/${locale}/orders`}
                  className="font-bold text-orange-700 hover:text-orange-800 hover:underline flex items-center gap-1"
                  onClick={e => e.stopPropagation()}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>{t.status === 'free' ? (isIt ? 'Apri' : 'Ouvrir') : (isIt ? 'Comanda' : 'Commande')}</span>
                </Link>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setQrModalTable(t);
                  }}
                  className="p-1 rounded-lg bg-white/70 hover:bg-white text-slate-700 transition"
                  title="QR Menu"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floor Plan Legend Bar at Bottom (matching photo) */}
        <div className="mt-8 bg-white/90 backdrop-blur-xs rounded-2xl p-3 max-w-md mx-auto shadow-sm border border-slate-200 flex items-center justify-around text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#86efac] border border-[#22c55e]" />
            <span>{isIt ? 'Libero' : 'Libre'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#fdba74] border border-[#ea580c]" />
            <span>{isIt ? 'Occupato' : 'Occupé'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#93c5fd] border border-[#3b82f6]" />
            <span>{isIt ? 'Da pagare' : 'À payer'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#c4b5fd] border border-[#8b5cf6]" />
            <span>{isIt ? 'Prenotato' : 'Réservé'}</span>
          </div>
        </div>

      </div>

      {/* QR Code Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center shadow-2xl relative border border-slate-200">
            <button onClick={() => setQrModalTable(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-lg text-slate-900 mt-1">Bar Centrale</h3>
            <p className="text-xs font-bold text-orange-600 mb-3">{qrModalTable.number}</p>
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl mx-auto w-40 h-40 flex flex-col items-center justify-center shadow-inner">
              <QrCode className="w-28 h-28 text-slate-900" />
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-snug">
              {isIt ? 'Menu digitale tavolo per smartphone' : 'Menu digital pour smartphone'}
            </p>
            <button
              onClick={() => setQrModalTable(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
