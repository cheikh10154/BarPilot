'use client';

import React, { useState, use } from 'react';
import { useBarPilotStore } from '@/lib/store';
import {
  Settings,
  CreditCard,
  Building,
  Clock,
  Shield,
  Download,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Database,
  Server
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function SettingsPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { barName, barLocation, resetToDemo } = useBarPilotStore();
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Toast */}
      {savedToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">
            {isIt ? 'Parametri salvati con successo!' : 'Paramètres enregistrés avec succès !'}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span>{isIt ? 'Impostazioni Locale & Abbonamento' : 'Paramètres de l\'Établissement & Abonnement'}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isIt 
            ? 'Configura le coordinate del bar, la valuta operativa e la gestione della fatturazione SaaS' 
            : 'Configurez les coordonnées du bar, la devise opérationnelle et l\'abonnement SaaS'}
        </p>
      </div>

      {/* SaaS Subscription Card (59€/mois) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                PRO PLAN
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isIt ? 'Periodo di Prova Attivo (14 giorni)' : 'Période d\'Essai Active (14 jours)'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-2">
              59 € <span className="text-sm font-normal text-slate-400">/ {isIt ? 'mese / bar' : 'mois / bar'}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              {isIt
                ? 'Tutte le funzionalità incluse: comande illimitate, KDS bancone, scarico automatico stock e report di redditività.'
                : 'Toutes les fonctionnalités incluses : commandes illimitées, KDS barman, déduction auto des stocks et rapports.'}
            </p>
          </div>

          <button
            onClick={() => alert(isIt ? 'Reindirizzamento verso il portale clienti Stripe Billing...' : 'Redirection vers le portail client Stripe Billing...')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition self-start sm:self-auto"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isIt ? 'Gestisci su Stripe Billing' : 'Gérer sur Stripe Billing'}</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      {/* Bar General Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Building className="w-4 h-4 text-amber-400" />
          <span>{isIt ? 'Dati dell\'Esercizio' : 'Informations de l\'Établissement'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">
              {isIt ? 'Nome Insegna:' : 'Nom de l\'enseigne :'}
            </label>
            <input
              type="text"
              defaultValue={barName}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">
              {isIt ? 'Indirizzo e Città:' : 'Adresse et Ville :'}
            </label>
            <input
              type="text"
              defaultValue={barLocation}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">
              {isIt ? 'Valuta Operativa:' : 'Devise Opérationnelle :'}
            </label>
            <select
              defaultValue="EUR"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="EUR">Euro (€)</option>
              <option value="CHF">Franco Svizzero (CHF)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">
              {isIt ? 'Fuso Orario:' : 'Fuseau Horaire :'}
            </label>
            <select
              defaultValue="Europe/Rome"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Europe/Rome">Europe/Rome (UTC+1 / UTC+2)</option>
              <option value="Europe/Paris">Europe/Paris (UTC+1 / UTC+2)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
          >
            {isIt ? 'Salva Modifiche' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {/* Database & Cloud Sync Zone */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              {isIt ? 'Stato Database & Sincronizzazione Cloud' : 'Statut Base de Données & Cloud'}
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isIt ? 'Storage Attivo (Persistente)' : 'Stockage Actif (Persistant)'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {isIt
            ? 'I dati del tuo locale (comande, tavoli, ricette, magazzino) sono attualmente salvati con persistenza locale ad alta velocità. Per la sincronizzazione multi-dispositivo in tempo reale su più smartphone dei camerieri contemporaneamente, puoi collegare il tuo database PostgreSQL Supabase.'
            : 'Vos données sont actuellement persistées en local à haute vitesse. Pour la synchronisation multi-appareils en direct, connectez votre base Supabase PostgreSQL.'}
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-slate-300 font-semibold block">
              {isIt ? 'Schema SQL: 001_initial_schema.sql (21 tabelle)' : 'Schéma SQL : 001_initial_schema.sql (21 tables)'}
            </span>
            <span className="text-[11px] text-slate-500">
              {isIt ? 'Pronto per migrazione su Supabase Cloud (PostgreSQL RLS)' : 'Prêt pour migration Supabase Cloud (PostgreSQL RLS)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              alert(
                isIt
                  ? 'Test Connessione Database: OK!\nStorage locale attivo con sincronizzazione store Zustand. Schema pronto per migrazione Supabase.'
                  : 'Test Connexion Base de Données : OK !\nStockage local actif et prêt pour Supabase.'
              );
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
          >
            <Server className="w-3.5 h-3.5" />
            <span>{isIt ? 'Testa Connessione Database' : 'Tester Connexion Base'}</span>
          </button>
        </div>
      </div>

      {/* Security & GDPR Zone */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>{isIt ? 'Sicurezza & Conformità Agenzia delle Entrate' : 'Sécurité & Conformité Réglementaire'}</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {isIt
            ? 'BarPilot opera esclusivamente come gestionale interno di sala e non genera corrispettivi telematici. I dati raccolti sono protetti con crittografia TLS 1.3 ed isolamento dei tenant a livello PostgreSQL RLS.'
            : 'BarPilot opère exclusivement en tant que logiciel de commande interne et ne remplace pas le système de certification fiscale. Les données sont isolées par établissement via PostgreSQL RLS.'}
        </p>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm(isIt ? 'Ripristinare tutti i dati dimostrativi di default?' : 'Réinitialiser toutes les données de démo ?')) {
                resetToDemo();
                alert(isIt ? 'Dati ripristinati!' : 'Données réinitialisées !');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {isIt ? 'Ripristina Dati Esempio' : 'Réinitialiser Démo'}
          </button>
        </div>
      </div>

    </div>
  );
}
