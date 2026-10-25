'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  Plus,
  QrCode,
  X,
  Users,
  Clock,
  ClipboardList,
  Receipt,
  CalendarClock,
  Printer,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useBarPilotStore } from '@/lib/store';

interface PageProps {
  params: Promise<{ locale: string }>;
}

type Status = 'free' | 'occupied' | 'bill' | 'reserved';
type Area = 'indoor' | 'outdoor' | 'bar' | 'vip';

interface FloorTable {
  id: string;
  seats: number;
  status: Status;
  area: Area;
  x: number; // % left
  y: number; // % top
  w: number; // px
  h: number; // px
  round?: boolean;
  total?: string;
  minutes?: number;
  reservation?: string;
  items?: string[];
}

const STATUS_THEME: Record<Status, { fill: string; border: string; chair: string; dot: string; it: string; fr: string }> = {
  free: { fill: '#dcfce7', border: '#86efac', chair: '#bbf7d0', dot: '#22c55e', it: 'Libero', fr: 'Libre' },
  occupied: { fill: '#ffedd5', border: '#fdba74', chair: '#fed7aa', dot: '#f97316', it: 'Occupato', fr: 'Occupé' },
  bill: { fill: '#dbeafe', border: '#93c5fd', chair: '#bfdbfe', dot: '#3b82f6', it: 'Da pagare', fr: 'À payer' },
  reserved: { fill: '#ede9fe', border: '#c4b5fd', chair: '#ddd6fe', dot: '#8b5cf6', it: 'Prenotato', fr: 'Réservé' },
};

const INITIAL_FLOOR: FloorTable[] = [
  { id: 'T01', seats: 4, status: 'free', area: 'indoor', x: 6, y: 10, w: 92, h: 72 },
  { id: 'T02', seats: 2, status: 'occupied', area: 'indoor', x: 30, y: 8, w: 78, h: 78, total: '12,50 €', minutes: 14, items: ['2× Spritz'] },
  { id: 'T03', seats: 4, status: 'free', area: 'indoor', x: 52, y: 10, w: 92, h: 72 },
  { id: 'T04', seats: 4, status: 'bill', area: 'outdoor', x: 78, y: 8, w: 92, h: 80, total: '25,00 €', minutes: 41, items: ['2× Cappuccino', '1× Espresso', '2× Croissant', '1× Tagliere'] },
  { id: 'T05', seats: 2, status: 'occupied', area: 'indoor', x: 8, y: 44, w: 92, h: 76, total: '15,00 €', minutes: 23, items: ['2× Birra bionda', '1× Panino'] },
  { id: 'T06', seats: 6, status: 'free', area: 'outdoor', x: 50, y: 44, w: 120, h: 76 },
  { id: 'T07', seats: 4, status: 'reserved', area: 'vip', x: 8, y: 74, w: 104, h: 76, reservation: '20:00' },
  { id: 'T08', seats: 4, status: 'occupied', area: 'indoor', x: 36, y: 74, w: 92, h: 76, total: '18,50 €', minutes: 9, items: ['3× Birra bionda', '1× Acqua'] },
  { id: 'T09', seats: 4, status: 'free', area: 'bar', x: 64, y: 74, w: 92, h: 76 },
];

export default function TablesPlanPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { currentRole } = useBarPilotStore();
  const isOwner = currentRole === 'owner';

  const [tables, setTables] = useState<FloorTable[]>(INITIAL_FLOOR);
  const [area, setArea] = useState<'all' | Area>('indoor');
  const [selectedId, setSelectedId] = useState<string>('T04');
  const [qrTable, setQrTable] = useState<FloorTable | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<FloorTable | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableArea, setNewTableArea] = useState<Area>('indoor');
  const [newTableSeats, setNewTableSeats] = useState(4);

  const areas: { id: 'all' | Area; label: string }[] = [
    { id: 'all', label: isIt ? 'Tutti' : 'Tous' },
    { id: 'indoor', label: isIt ? 'Interno' : 'Intérieur' },
    { id: 'outdoor', label: isIt ? 'Terrazza' : 'Terrasse' },
    { id: 'bar', label: 'Comptoir' },
    { id: 'vip', label: 'VIP' },
  ];

  const selected = tables.find(t => t.id === selectedId) ?? null;
  const counts = tables.reduce<Record<Status, number>>(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }),
    { free: 0, occupied: 0, bill: 0, reserved: 0 }
  );

  const openAddModal = () => {
    if (!isOwner) return;
    const nums = tables.map(t => parseInt(t.id.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    setNewTableNumber(`T${next < 10 ? '0' + next : next}`);
    setNewTableSeats(4);
    setNewTableArea(area === 'all' ? 'indoor' : area);
    setIsAddModalOpen(true);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    const id = newTableNumber.trim().toUpperCase();
    if (!id) return;

    if (tables.some(t => t.id.toUpperCase() === id)) {
      alert(isIt ? `Esiste già un tavolo con sigla ${id}` : `Une table avec l'identifiant ${id} existe déjà`);
      return;
    }

    const countInArea = tables.filter(t => t.area === newTableArea).length;
    const col = countInArea % 3;
    const row = Math.floor(countInArea / 3);
    const x = Math.min(6 + col * 26, 78);
    const y = Math.min(10 + row * 34, 76);

    const newTable: FloorTable = {
      id,
      seats: newTableSeats,
      status: 'free',
      area: newTableArea,
      x,
      y,
      w: newTableSeats <= 2 ? 78 : newTableSeats >= 6 ? 120 : 92,
      h: 76,
    };

    setTables(prev => [...prev, newTable]);
    setSelectedId(id);
    setIsAddModalOpen(false);
    setNewTableNumber('');
  };

  const confirmDeleteTable = () => {
    if (!isOwner || !tableToDelete) return;
    setTables(prev => prev.filter(t => t.id !== tableToDelete.id));
    if (selectedId === tableToDelete.id) {
      const remaining = tables.filter(t => t.id !== tableToDelete.id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : '');
    }
    setTableToDelete(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 bp-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight">Plan de salle</h1>
          <p className="text-sm text-slate-500">
            {counts.occupied + counts.bill} {isIt ? 'tavoli occupati' : 'tables occupées'} · {counts.free} {isIt ? 'liberi' : 'libres'} ·{' '}
            {counts.reserved} {isIt ? 'prenotati' : 'réservées'}
          </p>
        </div>

        {/* Solo il proprietario può aggiungere tavoli */}
        {isOwner && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-[13px] font-semibold shadow-md shadow-orange-500/25 transition self-start"
          >
            <Plus className="w-4 h-4" />
            {isIt ? 'Aggiungi tavolo' : 'Ajouter une table'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 sm:gap-5">
        {/* ============ Floor ============ */}
        <section className="bp-card p-3 sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-1 px-1">
            {areas.map(a => (
              <button
                key={a.id}
                onClick={() => setArea(a.id)}
                className={`h-9 px-4 rounded-xl text-[13px] font-semibold shrink-0 transition ${
                  area === a.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl">
            <div className="relative bp-wood-floor rounded-2xl min-w-[720px] h-[540px] ring-1 ring-inset ring-black/5 overflow-hidden">
              {/* Bar counter */}
              <div className="absolute right-0 top-[34%] h-[30%] w-[7%] bg-gradient-to-l from-[#5b3a22] to-[#7a4f2e] rounded-l-2xl shadow-[-6px_0_18px_rgba(0,0,0,0.18)] flex items-center justify-center">
                <span className="text-[10px] font-bold tracking-[0.25em] text-amber-100/80 [writing-mode:vertical-rl] rotate-180">COMPTOIR</span>
              </div>

              {/* Plants */}
              {[
                { l: '1%', t: '1%' },
                { l: '94%', t: '88%' },
                { l: '1%', t: '88%' },
                { l: '45%', t: '42%' },
                { l: '94%', t: '1%' },
              ].map((p, i) => (
                <span
                  key={i}
                  className="absolute text-[34px] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] select-none"
                  style={{ left: p.l, top: p.t }}
                  aria-hidden
                >
                  🪴
                </span>
              ))}

              {/* Tables */}
              {tables.map(t => {
                const theme = STATUS_THEME[t.status];
                const dimmed = area !== 'all' && t.area !== area;
                const isSel = selectedId === t.id;
                const top = Math.ceil(t.seats / 2);
                const bottom = Math.floor(t.seats / 2);

                return (
                  <div
                    key={t.id}
                    className={`absolute group transition-all duration-300 ${dimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}
                    style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.w, height: t.h + 28 }}
                  >
                    {/* chairs top */}
                    <div className="absolute left-0 right-0 top-0 flex justify-center gap-2 pointer-events-none">
                      {Array.from({ length: top }).map((_, i) => (
                        <span key={i} className="w-6 h-3 rounded-t-lg shadow-sm" style={{ background: theme.chair, border: `1px solid ${theme.border}` }} />
                      ))}
                    </div>

                    {/* table top */}
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`absolute left-0 right-0 top-[14px] flex flex-col items-center justify-center text-center transition-all ${
                        t.round ? 'rounded-full' : 'rounded-2xl'
                      } ${isSel ? 'scale-[1.06]' : 'group-hover:scale-[1.03]'}`}
                      style={{
                        height: t.h,
                        background: theme.fill,
                        border: `2px solid ${isSel ? '#f97316' : theme.border}`,
                        boxShadow: isSel
                          ? '0 0 0 4px rgba(249,115,22,0.25), 0 10px 22px -8px rgba(0,0,0,0.35)'
                          : '0 8px 18px -10px rgba(0,0,0,0.35)',
                      }}
                    >
                      <span className="text-[13px] font-extrabold text-slate-900 leading-none">{t.id}</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {t.seats} pers.
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 mt-0.5">
                        {t.total ?? (t.status === 'reserved' ? `${isIt ? 'Prenot.' : 'Réserv.'} ${t.reservation}` : isIt ? 'Libero' : 'Libre')}
                      </span>
                    </button>

                    {/* Owner only delete badge */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTableToDelete(t);
                        }}
                        title={isIt ? `Elimina tavolo ${t.id}` : `Supprimer table ${t.id}`}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md transition z-20 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}

                    {/* chairs bottom */}
                    <div className="absolute left-0 right-0 bottom-0 flex justify-center gap-2 pointer-events-none">
                      {Array.from({ length: bottom }).map((_, i) => (
                        <span key={i} className="w-6 h-3 rounded-b-lg shadow-sm" style={{ background: theme.chair, border: `1px solid ${theme.border}` }} />
                      ))}
                    </div>

                    {/* timer badge */}
                    {t.minutes && t.minutes > 20 && (
                      <span className="absolute -top-1 -right-3 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-md bp-ring-urgent flex items-center gap-0.5 pointer-events-none">
                        <Clock className="w-2.5 h-2.5" />
                        {t.minutes} min
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Legend */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-4 px-4 py-2 rounded-xl bg-white/90 backdrop-blur shadow-md text-[12px] font-medium text-slate-600">
                {(Object.keys(STATUS_THEME) as Status[]).map(s => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_THEME[s].dot }} />
                    {isIt ? STATUS_THEME[s].it : STATUS_THEME[s].fr}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ Detail panel ============ */}
        <aside className="bp-card p-5 h-fit xl:sticky xl:top-4">
          {selected ? (
            <TableDetail
              table={selected}
              isIt={isIt}
              locale={locale}
              isOwner={isOwner}
              onQr={() => setQrTable(selected)}
              onDelete={(tbl) => setTableToDelete(tbl)}
            />
          ) : (
            <p className="text-sm text-slate-400">{isIt ? 'Seleziona un tavolo' : 'Sélectionnez une table'}</p>
          )}
        </aside>
      </div>

      {/* Owner Add Table Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative bp-fade-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">
              🪑 {isIt ? 'Aggiungi tavolo' : 'Ajouter une table'}
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">
              {isIt ? 'Configura il tavolo nella piantina (Solo proprietario)' : 'Configurer la table sur le plan (Propriétaire uniquement)'}
            </p>

            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  {isIt ? 'Identificativo / Sigla tavolo' : 'Numéro / Identifiant'}
                </label>
                <input
                  type="text"
                  required
                  value={newTableNumber}
                  onChange={e => setNewTableNumber(e.target.value)}
                  placeholder="es. T10"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold uppercase"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  {isIt ? 'Area / Sala' : 'Zone'}
                </label>
                <select
                  value={newTableArea}
                  onChange={e => setNewTableArea(e.target.value as Area)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="indoor">{isIt ? 'Interno (Sala Principale)' : 'Intérieur'}</option>
                  <option value="outdoor">{isIt ? 'Terrazza / Dehors' : 'Terrasse'}</option>
                  <option value="bar">Comptoir / Bancone</option>
                  <option value="vip">Spazio VIP / Privé</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  {isIt ? 'Posti a sedere (Capiènza)' : 'Places assises'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={newTableSeats}
                  onChange={e => setNewTableSeats(parseInt(e.target.value, 10) || 2)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bp-btn-primary text-[13px]"
                >
                  {isIt ? 'Crea tavolo' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Delete Table Modal */}
      {tableToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTableToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative bp-fade-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setTableToDelete(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-lg text-slate-900 text-center mb-1">
              {isIt ? `Eliminare il tavolo ${tableToDelete.id}?` : `Supprimer la table ${tableToDelete.id} ?`}
            </h3>
            <p className="text-[12px] text-slate-500 text-center mb-4">
              {isIt
                ? 'Questa operazione è riservata esclusivamente al proprietario.'
                : 'Cette opération est réservée exclusivement au propriétaire.'}
            </p>

            {(tableToDelete.status === 'occupied' || tableToDelete.status === 'bill' || tableToDelete.total) && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[12px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {isIt
                    ? 'Attenzione: questo tavolo ha un conto o comande aperte in sospeso!'
                    : 'Attention : cette table a des consommations ou une addition en cours !'}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {isIt ? 'Annulla' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteTable}
                className="flex-1 h-11 rounded-xl bg-rose-600 text-white font-semibold text-[13px] hover:bg-rose-700 transition"
              >
                {isIt ? 'Elimina' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR modal */}
      {qrTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQrTable(null)}>
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center shadow-2xl relative bp-fade-up" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrTable(null)} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-lg text-slate-900">Bar Centrale</h3>
            <p className="text-[13px] font-semibold text-orange-600 mb-4">{qrTable.id}</p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mx-auto w-44 h-44 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900" strokeWidth={1.25} />
            </div>
            <p className="text-[12px] text-slate-500 mt-3">{isIt ? 'Menu digitale del tavolo' : 'Menu digital de la table'}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => window.print()} className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5 hover:bg-slate-50">
                <Printer className="w-4 h-4" /> {isIt ? 'Stampa' : 'Imprimer'}
              </button>
              <Link href={`/${locale}/menu?table=${qrTable.id.replace('T', '')}`} className="flex-1 h-11 bp-btn-primary text-[13px]">
                {isIt ? 'Apri' : 'Ouvrir'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TableDetail({
  table,
  isIt,
  locale,
  isOwner,
  onQr,
  onDelete,
}: {
  table: FloorTable;
  isIt: boolean;
  locale: string;
  isOwner: boolean;
  onQr: () => void;
  onDelete: (table: FloorTable) => void;
}) {
  const theme = STATUS_THEME[table.status];
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-slate-400">{isIt ? 'Tavolo selezionato' : 'Table sélectionnée'}</p>
          <p className="text-[26px] font-extrabold text-slate-900 leading-tight">{table.id}</p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold"
          style={{ background: theme.fill, color: '#0f172a', boxShadow: `inset 0 0 0 1px ${theme.border}` }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: theme.dot }} />
          {isIt ? theme.it : theme.fr}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={Users} label={isIt ? 'Posti' : 'Places'} value={String(table.seats)} />
        <Stat icon={Clock} label={isIt ? 'Tempo' : 'Temps'} value={table.minutes ? `${table.minutes}′` : '—'} warn={!!table.minutes && table.minutes > 20} />
        <Stat icon={Receipt} label={isIt ? 'Conto' : 'Addition'} value={table.total ?? '—'} />
      </div>

      {table.status === 'reserved' && (
        <div className="rounded-2xl bg-violet-50 ring-1 ring-inset ring-violet-200 p-3 flex items-center gap-3">
          <CalendarClock className="w-5 h-5 text-violet-500" />
          <div className="text-[13px]">
            <p className="font-semibold text-slate-900">{isIt ? 'Prenotazione' : 'Réservation'} · {table.reservation}</p>
            <p className="text-slate-500">Famiglia Bianchi · 4 pers.</p>
          </div>
        </div>
      )}

      {table.items && (
        <div>
          <p className="text-[12px] font-medium text-slate-400 mb-2">{isIt ? 'Ordinato' : 'Commandé'}</p>
          <ul className="space-y-1.5">
            {table.items.map(it => (
              <li key={it} className="flex items-center justify-between text-[13px] text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                {it}
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2 pt-1">
        <Link href={`/${locale}/orders`} className="w-full h-11 bp-btn-primary text-[13px]">
          <ClipboardList className="w-4 h-4" />
          {table.status === 'free' ? (isIt ? 'Apri tavolo' : 'Ouvrir la table') : isIt ? 'Aggiungi comanda' : 'Ajouter une commande'}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <button className="h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5">
            <Receipt className="w-4 h-4" /> {isIt ? 'Pre-conto' : 'Addition'}
          </button>
          <button onClick={onQr} className="h-11 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5">
            <QrCode className="w-4 h-4" /> QR menu
          </button>
        </div>

        {/* Solo il proprietario può eliminare il tavolo */}
        {isOwner && (
          <button
            type="button"
            onClick={() => onDelete(table)}
            className="w-full h-10 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition"
          >
            <Trash2 className="w-4 h-4" />
            {isIt ? 'Elimina tavolo' : 'Supprimer la table'}
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, warn }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl p-2.5 ${warn ? 'bg-rose-50 ring-1 ring-inset ring-rose-200' : 'bg-slate-50'}`}>
      <Icon className={`w-4 h-4 ${warn ? 'text-rose-500' : 'text-slate-400'}`} />
      <p className={`mt-1.5 text-[14px] font-bold leading-none ${warn ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{label}</p>
    </div>
  );
}
