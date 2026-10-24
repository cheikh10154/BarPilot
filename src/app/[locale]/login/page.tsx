'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import { UserRole } from '@/types/database';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ChefHat,
  UtensilsCrossed,
  Crown
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function LoginPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const router = useRouter();

  const { setRole } = useBarPilotStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDemoLogin = (role: UserRole) => {
    setRole(role);
    if (role === 'bartender') {
      router.push(`/${locale}/kitchen`);
    } else if (role === 'server') {
      router.push(`/${locale}/orders`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to owner login in demo
    handleDemoLogin('owner');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-1 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-xl shadow-amber-500/20 mb-2">
            <Image
              src="/logo.png"
              alt="BarPilot"
              width={64}
              height={64}
              className="rounded-xl object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            BarPilot
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isIt
              ? 'Piattaforma Intelligente per la Gestione Operativa del Bar'
              : 'Plateforme Intelligente de Gestion Opérationnelle du Bar'}
          </p>
        </div>

        {/* Instant Demo Access (1 Click) */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>{isIt ? 'Accesso Rapido Demo Senza Registrazione' : 'Accès Démo Immédiat Sans Inscription'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            {isIt
              ? 'Seleziona un ruolo per entrare subito e provare l\'esperienza completa:'
              : 'Sélectionnez un rôle pour tester immédiatement l\'application :'}
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => handleDemoLogin('owner')}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-between shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition"
            >
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4" />
                <div className="text-left">
                  <div>{isIt ? 'Accedi come Proprietario' : 'Accéder comme Propriétaire'}</div>
                  <div className="text-[10px] font-normal opacity-80">{isIt ? 'Dashboard, Incassi, Scorte & Margini' : 'Tableau de bord, Stocks & Marges'}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDemoLogin('server')}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center justify-between border border-slate-700 active:scale-98 transition"
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div>{isIt ? 'Accedi come Cameriere' : 'Accéder comme Serveur'}</div>
                  <div className="text-[10px] font-normal text-slate-400">{isIt ? 'Presa comande rapida da smartphone' : 'Prise de commande rapide sur mobile'}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleDemoLogin('bartender')}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center justify-between border border-slate-700 active:scale-98 transition"
            >
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div>{isIt ? 'Accedi come Barista (KDS)' : 'Accéder comme Barman (KDS)'}</div>
                  <div className="text-[10px] font-normal text-slate-400">{isIt ? 'Schermo comande bancone in tempo reale' : 'Écran KDS préparation en direct'}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Standard Email Login */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="bar@central.it"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">{isIt ? 'Password' : 'Mot de passe'}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition mt-2"
            >
              {isIt ? 'Accedi con Credenziali' : 'Connexion classique'}
            </button>
          </form>
        </div>

        {/* Pricing notice */}
        <div className="text-center text-xs text-slate-500">
          BarPilot SaaS · 59 €/mese/bar · 14 {isIt ? 'giorni di prova gratuita' : 'jours d\'essai gratuit'}
        </div>

      </div>
    </div>
  );
}
