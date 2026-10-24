'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import { useBarPilotStore, Order } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Play,
  CheckCheck,
  AlertOctagon,
  Sparkles,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function KitchenKdsPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { orders, updateOrderStatus, updateOrderItemStatus, toggleProductAvailability } = useBarPilotStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mobileKdsTab, setMobileKdsTab] = useState<'all' | 'incoming' | 'preparing' | 'ready'>('all');
  const prevCountRef = useRef<number | null>(null);

  // KDS displays orders in active lifecycle: sent, preparing, ready
  const incomingOrders = orders.filter(o => o.status === 'sent');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // Play synthetic pleasant double-bell chime when a new order arrives
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(587.33, 0, 0.4); // D5
      playTone(880.00, 0.18, 0.6); // A5
    } catch {
      // Audio context might be restricted until user gesture
    }
  };

  useEffect(() => {
    if (prevCountRef.current !== null && incomingOrders.length > prevCountRef.current) {
      playChime();
    }
    prevCountRef.current = incomingOrders.length;
  }, [incomingOrders.length]);

  const getWaitingMinutes = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diffMs / 60000);
  };

  const renderOrderCard = (order: Order, stage: 'incoming' | 'preparing' | 'ready') => {
    const waitMins = getWaitingMinutes(order.created_at);
    const isUrgent = waitMins >= 6;
    const isWarning = waitMins >= 4 && !isUrgent;

    const stageBorder =
      stage === 'ready'
        ? 'border-l-emerald-500'
        : stage === 'preparing'
        ? 'border-l-blue-500'
        : 'border-l-amber-500';

    return (
      <div
        key={order.id}
        className={`rounded-2xl border border-l-4 p-4 flex flex-col justify-between transition-all shadow-xl hover:shadow-2xl ${stageBorder} ${
          isUrgent
            ? 'bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-950 border-rose-500/50 shadow-rose-950/20 ring-1 ring-rose-500/30'
            : stage === 'preparing'
            ? 'bg-gradient-to-br from-blue-950/20 via-slate-900 to-slate-950 border-slate-800'
            : stage === 'ready'
            ? 'bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 border-slate-800'
            : 'bg-gradient-to-br from-amber-950/15 via-slate-900 to-slate-950 border-slate-800'
        }`}
      >
        <div>
          {/* Card Header: Table + Number + Wait Timer */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">
                  {order.table_number}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  #{order.order_number}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isIt ? 'Cameriere:' : 'Serveur:'} <span className="text-slate-300 font-semibold">{order.server_name}</span>
              </p>
            </div>

            <div
              className={`flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-full shadow-inner ${
                isUrgent
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {isUrgent ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{waitMins} min</span>
            </div>
          </div>

          {/* Notes if any */}
          {order.notes && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="leading-tight">{order.notes}</span>
            </div>
          )}

          {/* Items list with individual check */}
          <div className="space-y-2 mb-4">
            {order.items.map(item => {
              const isItemReady = item.status === 'ready' || order.status === 'ready';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    const nextStatus = item.status === 'ready' ? 'preparing' : 'ready';
                    updateOrderItemStatus(order.id, item.id, nextStatus);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer select-none transition ${
                    isItemReady
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200 line-through opacity-70'
                      : 'bg-slate-950/70 border-slate-800 text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                      {item.quantity}
                    </span>
                    <span className="font-semibold text-sm">{item.product_name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isItemReady ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 hover:border-amber-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          {stage === 'incoming' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isIt ? 'Inizia Preparazione' : 'Commencer la Préparation'}</span>
            </button>
          )}

          {stage === 'preparing' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'ready')}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{isIt ? 'Tutto Pronto al Banco!' : 'Tout Prêt au Comptoir !'}</span>
            </button>
          )}

          {stage === 'ready' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'served')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isIt ? 'Consegnato / Servito' : 'Remis / Servi'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* KDS Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{isIt ? 'KDS Bancone · Schermo Barista' : 'KDS Comptoir · Écran Barman'}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400">
              {isIt 
                ? 'Ordini in tempo reale · Notifiche acustiche e timer di attesa attivi' 
                : 'Commandes en temps réel · Alertes sonores et minuteurs de préparation actifs'}
            </p>
          </div>
        </div>

        {/* Quick summary counters and audio toggle */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`p-2 rounded-xl border flex items-center gap-1.5 font-semibold transition ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Suono attivo' : 'Muto'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? (isIt ? 'Audio KDS' : 'Son KDS') : (isIt ? 'Muto' : 'Muet')}</span>
          </button>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            {isIt ? 'In Arrivo:' : 'En Attente:'}{' '}
            <strong className="text-amber-400 ml-1">{incomingOrders.length}</strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            {isIt ? 'In Corso:' : 'En Cours:'}{' '}
            <strong className="text-blue-400 ml-1">{preparingOrders.length}</strong>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            {isIt ? 'Pronti:' : 'Prêts:'}{' '}
            <strong className="text-emerald-400 ml-1">{readyOrders.length}</strong>
          </div>
        </div>
      </div>

      {/* Mobile Stage Segmented Filter (visible on md:hidden) */}
      <div className="md:hidden flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setMobileKdsTab('all')}
          className={`flex-1 py-2 px-2.5 rounded-xl transition text-center shrink-0 ${
            mobileKdsTab === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {isIt ? 'Tutti' : 'Tous'} ({incomingOrders.length + preparingOrders.length + readyOrders.length})
        </button>
        <button
          onClick={() => setMobileKdsTab('incoming')}
          className={`flex-1 py-2 px-2.5 rounded-xl transition text-center shrink-0 ${
            mobileKdsTab === 'incoming'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🟡 {isIt ? 'In Arrivo' : 'Attente'} ({incomingOrders.length})
        </button>
        <button
          onClick={() => setMobileKdsTab('preparing')}
          className={`flex-1 py-2 px-2.5 rounded-xl transition text-center shrink-0 ${
            mobileKdsTab === 'preparing'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🔵 {isIt ? 'In Corso' : 'En cours'} ({preparingOrders.length})
        </button>
        <button
          onClick={() => setMobileKdsTab('ready')}
          className={`flex-1 py-2 px-2.5 rounded-xl transition text-center shrink-0 ${
            mobileKdsTab === 'ready'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🟢 {isIt ? 'Pronti' : 'Prêts'} ({readyOrders.length})
        </button>
      </div>

      {/* KDS 3 Columns Layout: Incoming / Preparing / Ready */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Col 1: Incoming (Inviate / In arrivo) */}
        <div className={`space-y-3 ${mobileKdsTab !== 'all' && mobileKdsTab !== 'incoming' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between px-2">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>{isIt ? 'In Arrivo / Da Fare' : 'Nouvelles Commandes'}</span>
            </h2>
            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
              {incomingOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            {incomingOrders.length === 0 ? (
              <div className="h-40 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs text-center p-4">
                {isIt ? 'Nessun ordine in arrivo.' : 'Aucune commande en attente.'}
              </div>
            ) : (
              incomingOrders.map(order => renderOrderCard(order, 'incoming'))
            )}
          </div>
        </div>

        {/* Col 2: In Preparation (In preparazione) */}
        <div className={`space-y-3 ${mobileKdsTab !== 'all' && mobileKdsTab !== 'preparing' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between px-2">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>{isIt ? 'In Preparazione' : 'En Préparation'}</span>
            </h2>
            <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            {preparingOrders.length === 0 ? (
              <div className="h-40 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs text-center p-4">
                {isIt ? 'Nessuna bevanda in preparazione.' : 'Aucune préparation en cours.'}
              </div>
            ) : (
              preparingOrders.map(order => renderOrderCard(order, 'preparing'))
            )}
          </div>
        </div>

        {/* Col 3: Ready to serve (Pronti al banco) */}
        <div className={`space-y-3 ${mobileKdsTab !== 'all' && mobileKdsTab !== 'ready' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between px-2">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>{isIt ? 'Pronti al Banco' : 'Prêts au Comptoir'}</span>
            </h2>
            <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <div className="h-40 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs text-center p-4">
                {isIt ? 'Nessun ordine pronto da ritirare.' : 'Aucune commande prête.'}
              </div>
            ) : (
              readyOrders.map(order => renderOrderCard(order, 'ready'))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
