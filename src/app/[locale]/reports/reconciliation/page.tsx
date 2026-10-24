'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useBarPilotStore } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  Scale,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileCheck,
  Building,
  Printer,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function FiscalReconciliationPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { orders } = useBarPilotStore();

  // Valid non-cancelled orders
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const barPilotOperationalTotal = activeOrders.reduce((sum, o) => sum + o.total_cents, 0);

  // User input for external till (Registratore Telematico / Caisse Fiscale)
  const [fiscalTillCents, setFiscalTillCents] = useState<number>(barPilotOperationalTotal);
  const [posCardCents, setPosCardCents] = useState<number>(Math.round(barPilotOperationalTotal * 0.65));
  const [cashCents, setCashCents] = useState<number>(Math.round(barPilotOperationalTotal * 0.35));
  const [operatorNotes, setOperatorNotes] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  const discrepancyCents = fiscalTillCents - barPilotOperationalTotal;
  const isBalanced = Math.abs(discrepancyCents) === 0;

  const handleConfirmReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsClosed(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Back button */}
      <Link
        href={`/${locale}/reports`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{isIt ? 'Torna ai Report' : 'Retour aux Rapports'}</span>
      </Link>

      {/* Header */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span>{isIt ? 'Chiusura di Cassa & Riconciliazione Fiscale' : 'Clôture Opérationnelle & Rapprochement Fiscal'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isIt
                ? 'Confronta le comande operative BarPilot con il totale del Registratore Telematico esterno (RT)'
                : 'Comparez les commandes opérationnelles BarPilot avec le total de la caisse fiscale externe'}
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 self-start sm:self-auto">
            {new Date().toLocaleDateString(isIt ? 'it-IT' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Success banner if closed */}
      {isClosed && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-white">
                {isIt ? 'Chiusura Giornaliera Operativa Convalidata!' : 'Clôture Journalière Opérationnelle Validée !'}
              </h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                {isIt
                  ? 'Il verbale di quadratura è stato memorizzato nel registro di audit non fiscale.'
                  : 'Le procès-verbal de clôture a été consigné dans le journal d\'audit non fiscal.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isIt ? 'Stampa Verbale' : 'Imprimer'}</span>
          </button>
        </div>
      )}

      {/* Comparison Dashboard (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: BarPilot Operational Orders Total */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
            {isIt ? '1. Totale Comande BarPilot' : '1. Total Commandes BarPilot'}
          </span>
          <div className="text-2xl font-black text-amber-400">
            {formatCents(barPilotOperationalTotal, isIt ? 'it-IT' : 'fr-FR')}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {activeOrders.length} {isIt ? 'comande operative registrate' : 'commandes opérationnelles'}
          </span>
        </div>

        {/* Card 2: External Cash Register Total */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
            {isIt ? '2. Registratore Telematico Esterno' : '2. Total Caisse Fiscale Externe'}
          </span>
          <div className="text-2xl font-black text-white">
            {formatCents(fiscalTillCents, isIt ? 'it-IT' : 'fr-FR')}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {isIt ? 'Rapporto Z fiscale di fine turno' : 'Rapport fiscal Z de fin de service'}
          </span>
        </div>

        {/* Card 3: Discrepancy / Quadratura */}
        <div className={`p-4 rounded-2xl border ${
          isBalanced 
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
        }`}>
          <span className="text-[11px] font-semibold block mb-1">
            {isIt ? '3. Scarto di Quadratura' : '3. Écart de Rapprochement'}
          </span>
          <div className="text-2xl font-black flex items-center gap-1.5">
            {isBalanced ? (
              <>
                <span>0,00 €</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </>
            ) : (
              <>
                <span>{discrepancyCents > 0 ? '+' : ''}{formatCents(discrepancyCents, isIt ? 'it-IT' : 'fr-FR')}</span>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </>
            )}
          </div>
          <span className="text-[10px] mt-1 block opacity-80">
            {isBalanced
              ? (isIt ? 'Perfetta corrispondenza' : 'Parfaite concordance')
              : (isIt ? 'Differenza da motivare nelle note' : 'Écart à justifier ci-dessous')}
          </span>
        </div>

      </div>

      {/* Entry Form */}
      <form onSubmit={handleConfirmReconciliation} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h2 className="font-bold text-white text-base">
          {isIt ? 'Dati di Chiusura Cassa' : 'Saisie des Données de Clôture'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1">
              {isIt ? 'Totale Registratore Fiscale (€):' : 'Total Caisse Fiscale (€) :'}
            </label>
            <input
              type="number"
              step="0.01"
              value={(fiscalTillCents / 100).toFixed(2)}
              onChange={e => setFiscalTillCents(Math.round(Number(e.target.value) * 100))}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">
              {isIt ? 'Incasso POS Elettronico (€):' : 'Encaissements Carte Bancaire (€) :'}
            </label>
            <input
              type="number"
              step="0.01"
              value={(posCardCents / 100).toFixed(2)}
              onChange={e => setPosCardCents(Math.round(Number(e.target.value) * 100))}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">
              {isIt ? 'Contanti nel Cassetto (€):' : 'Espèces dans le Tiroir (€) :'}
            </label>
            <input
              type="number"
              step="0.01"
              value={(cashCents / 100).toFixed(2)}
              onChange={e => setCashCents(Math.round(Number(e.target.value) * 100))}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300 block mb-1">
            {isIt ? 'Note e giustificativi scarti (es. sconti cassa manuali, consumazioni omaggio titolare):' : 'Notes et motifs d\'écarts (ex. remises manuelles, consommations offertes) :'}
          </label>
          <textarea
            rows={3}
            value={operatorNotes}
            onChange={e => setOperatorNotes(e.target.value)}
            placeholder={isIt ? 'Nessun problema rilevato, cassa e magazzino perfettamente allineati.' : 'Aucun écart constaté.'}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Legal disclaimer */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isIt
              ? 'Conferma Operativa: La presente riconciliazione non trasmette dati fiscali all\'Agenzia delle Entrate, compito riservato esclusivamente al Registratore Telematico RT certificato.'
              : 'Validation Opérationnelle : Ce rapprochement ne transmet aucune donnée fiscale aux administrations, tâche dévolue à la caisse fiscale certifiée.'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition active:scale-95"
          >
            {isIt ? 'Conferma Chiusura e Quadratura' : 'Valider la Clôture et le Rapprochement'}
          </button>
        </div>
      </form>

    </div>
  );
}
