'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import { useBarPilotStore, Order } from '@/lib/store';
import { ProductThumb } from '@/components/ui/ProductThumb';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Play,
  CheckCheck,
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCw,
  Sparkles
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function KitchenKdsPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { orders, updateOrderStatus, updateOrderItemStatus } = useBarPilotStore();
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'preparing' | 'ready'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Demo fallback orders if store has few active orders, matching mockup exact orders
  const displayOrders = orders.filter(o => o.status === 'sent' || o.status === 'preparing' || o.status === 'ready');

  const incomingOrders = orders.filter(o => o.status === 'sent');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const filteredOrders = displayOrders.filter(o => {
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

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
      playTone(587.33, 0, 0.4);
      playTone(880.00, 0.18, 0.6);
    } catch {
      // Audio context may require gesture
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
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 bp-fade-up">
      {/* Outer KDS Dark Container matching mockup */}
      <div className="bg-[#0f172a] rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl text-white">
        
        {/* Top Header Row matching mockup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{isIt ? 'Preparazione · Comptoir' : 'Préparation · Comptoir'}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </h1>
              <p className="text-xs text-slate-400">
                {isIt ? 'Schermo KDS barman · Ricezione comande in tempo reale' : 'Écran KDS barman · Commandes en direct'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playChime();
              }}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'Suono attivo' : 'Muto'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Aggiorna"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="font-mono font-bold text-sm bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              {currentTime || '09:41'}
            </div>
          </div>
        </div>

        {/* Status Filter Tabs matching mockup */}
        <div className="flex items-center gap-2 py-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{isIt ? 'Tutte' : 'Toutes'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
              {displayOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              activeTab === 'sent'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{isIt ? 'Da preparare' : 'À préparer'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
              {incomingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('preparing')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              activeTab === 'preparing'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{isIt ? 'In preparazione' : 'En préparation'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
              {preparingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ready')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              activeTab === 'ready'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{isIt ? 'Pronte' : 'Prêtes'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
              {readyOrders.length}
            </span>
          </button>
        </div>

        {/* Orders Grid matching mockup cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-sm">
              {isIt ? 'Nessuna comanda attiva in questo stato' : 'Aucune commande dans cet état'}
            </div>
          ) : (
            filteredOrders.map(order => {
              const waitMins = getWaitingMinutes(order.created_at);
              const isUrgent = waitMins >= 4;

              return (
                <div
                  key={order.id}
                  className="bg-[#1e293b]/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg relative group"
                >
                  <div>
                    {/* Card Top: Order Number + Table + Timer */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                      <div>
                        <span className="font-mono font-bold text-xs text-orange-400">
                          #{order.order_number}
                        </span>
                        <h3 className="font-black text-lg text-white leading-tight">
                          {order.table_number}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-xs font-bold">
                        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500' : 'text-emerald-400'}`} />
                        <span className={isUrgent ? 'text-rose-500' : 'text-emerald-400'}>
                          {waitMins} min
                        </span>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {order.notes && (
                      <div className="mb-3 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{order.notes}</span>
                      </div>
                    )}

                    {/* Items List with Real Product Photos */}
                    <div className="space-y-2.5 my-3">
                      {order.items.map(item => {
                        const isReady = item.status === 'ready' || order.status === 'ready';

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              const nextStatus = item.status === 'ready' ? 'preparing' : 'ready';
                              updateOrderItemStatus(order.id, item.id, nextStatus);
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer select-none transition ${
                              isReady
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200 line-through opacity-60'
                                : 'bg-[#0f172a]/90 border-slate-800 text-white hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <ProductThumb name={item.product_name} size={36} rounded="rounded-lg" />
                              <div>
                                <span className="font-bold text-sm text-white">
                                  {item.quantity}× {item.product_name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center">
                              {isReady ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-600 hover:border-orange-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Button Footer matching mockup */}
                  <div className="pt-3 border-t border-slate-800/80">
                    {order.status === 'sent' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isIt ? 'Inizia preparazione' : 'Commencer la préparation'}</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>{isIt ? 'Segna come pronta' : 'Marquer comme prête'}</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isIt ? 'Consegnata al tavolo' : 'Servie à table'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
