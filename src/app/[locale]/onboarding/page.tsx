'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  Building2,
  Coffee,
  Grid,
  Users2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UtensilsCrossed,
  ChefHat,
  Plus,
  Trash2,
  CreditCard
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function OnboardingPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const router = useRouter();

  const { addProduct, createOrder, setRole } = useBarPilotStore();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Bar Details
  const [barDetails, setBarDetails] = useState({
    name: 'Caffè Garibaldi',
    address: 'Corso Como 14',
    city: 'Milano',
    currency: 'EUR',
    timezone: 'Europe/Rome',
  });

  // Step 2: First Products
  const [firstProducts, setFirstProducts] = useState([
    { name_it: 'Espresso Arabica', name_fr: 'Espresso Arabica', price_cents: 140, category: 'coffee' as const },
    { name_it: 'Aperol Spritz', name_fr: 'Aperol Spritz', price_cents: 650, category: 'cocktails' as const },
    { name_it: 'Brioche Crema', name_fr: 'Brioche Crème', price_cents: 180, category: 'food' as const },
  ]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(350);

  // Step 3: Tables
  const [tableCount, setTableCount] = useState(8);
  const [hasOutdoor, setHasOutdoor] = useState(true);

  // Step 4: First Order Test
  const [demoOrderSent, setDemoOrderSent] = useState(false);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAddProduct = () => {
    if (!newProductName.trim()) return;
    setFirstProducts(prev => [
      ...prev,
      {
        name_it: newProductName,
        name_fr: newProductName,
        price_cents: Math.round(newProductPrice),
        category: 'coffee',
      },
    ]);
    setNewProductName('');
  };

  const handleRemoveProduct = (index: number) => {
    setFirstProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleRunDemoOrder = () => {
    // Add custom products to store
    firstProducts.forEach(p => {
      addProduct({
        name_it: p.name_it,
        name_fr: p.name_fr,
        price_cents: p.price_cents,
        category: p.category,
        description_it: 'Prodotto aggiunto durante il setup guidato',
        description_fr: 'Produit configuré pendant l\'onboarding',
        is_available: true,
      });
    });

    // Create demo order
    createOrder({
      table_id: 'tbl-1',
      table_number: 'Tavolo 01',
      server_name: 'Proprietario (Setup Test)',
      items: [
        {
          product: {
            id: 'temp-1',
            name_it: firstProducts[0]?.name_it || 'Espresso',
            name_fr: firstProducts[0]?.name_fr || 'Espresso',
            price_cents: firstProducts[0]?.price_cents || 140,
            category: 'coffee',
            description_it: '',
            description_fr: '',
            is_available: true,
          },
          quantity: 2,
        },
      ],
      notes: 'Ordine di prova configurazione iniziale BarPilot',
    });

    setDemoOrderSent(true);
  };

  const handleFinishOnboarding = () => {
    setRole('owner');
    router.push(`/${locale}/dashboard`);
  };

  const steps = [
    { num: 1, title: isIt ? 'Il tuo locale' : 'Votre établissement', icon: Building2 },
    { num: 2, title: isIt ? 'I tuoi prodotti' : 'Vos produits', icon: Coffee },
    { num: 3, title: isIt ? 'I tuoi tavoli' : 'Vos tables', icon: Grid },
    { num: 4, title: isIt ? 'Ordine di prova' : 'Commande test', icon: UtensilsCrossed },
    { num: 5, title: isIt ? 'Attivazione prova' : 'Essai gratuit', icon: CreditCard },
  ];

  return (
    <div className="min-h-[85vh] max-w-3xl mx-auto py-6 px-4">
      
      {/* Header Bar */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex p-1 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-lg shadow-amber-500/20 mb-1">
          <Image src="/logo.png" alt="BarPilot" width={48} height={48} className="rounded-xl object-contain" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {isIt ? 'Configurazione Iniziale in 5 Minuti' : 'Configuration Initiale en 5 Minutes'}
        </h1>
        <p className="text-xs text-slate-400">
          {isIt 
            ? 'Prepara il tuo bar all\'uso operativo senza assistenza tecnica' 
            : 'Configurez votre établissement sans assistance technique'}
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {steps.map(step => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          const Icon = step.icon;

          return (
            <div key={step.num} className="flex flex-col items-center flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950'
                    : isCurrent
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${isCurrent ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative min-h-[380px] flex flex-col justify-between">
        
        {/* STEP 1: Bar Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{isIt ? '1. Informazioni sul tuo locale' : '1. Informations sur votre établissement'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIt ? 'Questi dati compariranno sui conti operativi e sul cruscotto' : 'Ces données figureront sur les additions et le tableau de bord'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {isIt ? 'Nome del Bar / Lounge:' : 'Nom du Bar / Établissement :'}
                </label>
                <input
                  type="text"
                  value={barDetails.name}
                  onChange={e => setBarDetails({ ...barDetails, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {isIt ? 'Città:' : 'Ville :'}
                </label>
                <input
                  type="text"
                  value={barDetails.city}
                  onChange={e => setBarDetails({ ...barDetails, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {isIt ? 'Indirizzo completo:' : 'Adresse complète :'}
                </label>
                <input
                  type="text"
                  value={barDetails.address}
                  onChange={e => setBarDetails({ ...barDetails, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {isIt ? 'Valuta:' : 'Devise :'}
                </label>
                <select
                  value={barDetails.currency}
                  onChange={e => setBarDetails({ ...barDetails, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="EUR">Euro (€) — Italia / Francia / Europa</option>
                  <option value="CHF">Franco Svizzero (CHF) — Svizzera</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Products */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <span>{isIt ? '2. Inserisci i tuoi primi prodotti' : '2. Vos premiers produits au menu'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIt ? 'Potrai aggiungerne altri in qualsiasi momento dal catalogo' : 'Vous pourrez en ajouter d\'autres à tout moment depuis le catalogue'}
              </p>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {firstProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-semibold text-white">{isIt ? p.name_it : p.name_fr}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-400">{formatCents(p.price_cents, isIt ? 'it-IT' : 'fr-FR')}</span>
                    <button onClick={() => handleRemoveProduct(idx)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder={isIt ? 'Nome bevanda (es. Negroni, Gin Tonic)...' : 'Nom boisson (ex. Negroni, Gin Tonic)...'}
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                placeholder="Prezzo (cent)"
                value={newProductPrice}
                onChange={e => setNewProductPrice(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white text-right focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleAddProduct}
                className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isIt ? 'Aggiungi' : 'Ajouter'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Tables Setup */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Grid className="w-5 h-5 text-amber-400" />
                <span>{isIt ? '3. Configurazione Sala e Tavoli' : '3. Configuration de la Salle & Tables'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIt ? 'Definisci la capienza iniziale per organizzare il servizio' : 'Définissez la capacité initiale pour organiser le service'}
              </p>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">{isIt ? 'Numero di Tavoli Interni:' : 'Nombre de tables intérieures :'}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTableCount(Math.max(2, tableCount - 2))}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-base text-amber-400 w-8 text-center">{tableCount}</span>
                    <button
                      onClick={() => setTableCount(tableCount + 2)}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">{isIt ? 'Disponi di Terrazza / Dehor Esterno?' : 'Disposez-vous d\'une terrasse ?'}</span>
                  <input
                    type="checkbox"
                    checked={hasOutdoor}
                    onChange={e => setHasOutdoor(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                ℹ️ {isIt 
                  ? 'Il "Bancone Diretto" è configurato automaticamente per gli ordini al banco.' 
                  : 'Le "Comptoir Direct" est automatiquement configuré pour les consommations au bar.'}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: First Order Simulation */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                <span>{isIt ? '4. Simula la tua prima comanda' : '4. Simuler votre première commande'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIt ? 'Verifica il ciclo completo: server invia → barman riceve sul KDS' : 'Validez le cycle complet : serveur envoie → barman reçoit sur le KDS'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
              {!demoOrderSent ? (
                <>
                  <p className="text-xs text-slate-300">
                    {isIt 
                      ? 'Clicca sul pulsante sottostante per simulare l\'invio di 2 consumazioni su Tavolo 01:' 
                      : 'Cliquez ci-dessous pour simuler l\'envoi de 2 consommations sur la Table 01 :'}
                  </p>
                  <button
                    onClick={handleRunDemoOrder}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition"
                  >
                    🚀 {isIt ? 'Invia Comanda di Prova al Bancone' : 'Envoyer Commande Test au Bar'}
                  </button>
                </>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-400">
                    {isIt ? 'Comanda Ricevuta sul Bancone KDS!' : 'Commande reçue sur le KDS Comptoir !'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isIt 
                      ? 'Il barista la visualizza ora in tempo reale con il timer attivo.' 
                      : 'Le barman la visualise désormais en direct avec le minuteur de préparation.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Activate 14-day Free Trial */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>{isIt ? '5. Attiva la tua prova gratuita di 14 giorni' : '5. Activez votre essai gratuit de 14 jours'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIt ? 'Nessun addebito immediato. Disdici con un clic in qualsiasi momento.' : 'Aucun prélèvement immédiat. Résiliation en 1 clic à tout moment.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">BarPilot PRO SaaS</span>
                <span className="text-lg font-black text-white">59 € <span className="text-xs font-normal text-slate-400">/ mese</span></span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isIt ? 'Comande e tavoli illimitati' : 'Commandes et tables illimitées'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isIt ? 'KDS bancone tempo reale per smartphone, tablet e PC' : 'KDS comptoir temps réel sur smartphone, tablette et PC'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isIt ? 'Controllo scorte con ricettario e scarico automatico' : 'Gestion des stocks avec fiches recettes automatiques'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isIt ? '14 giorni di prova gratuita al 100%' : '14 jours d\'essai gratuit à 100%'}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isIt ? 'Indietro' : 'Précédent'}</span>
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              <span>{isIt ? 'Continua' : 'Continuer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/20 hover:brightness-110"
            >
              <span>{isIt ? 'Inizia ad Usare BarPilot!' : 'Lancer BarPilot !'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
