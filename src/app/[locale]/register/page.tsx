'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import {
  Lock,
  Mail,
  Building,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function RegisterPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const router = useRouter();

  const { setRole } = useBarPilotStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    barName: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRole('owner');
    router.push(`/${locale}/onboarding`);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-1 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-xl shadow-amber-500/20 mb-1">
            <Image
              src="/logo.png"
              alt="BarPilot"
              width={64}
              height={64}
              className="rounded-xl object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isIt ? 'Crea il tuo Account BarPilot' : 'Créer votre compte BarPilot'}
          </h1>
          <p className="text-xs text-slate-400">
            {isIt
              ? '14 giorni di prova gratuita · Nessun dato di pagamento richiesto'
              : '14 jours d\'essai gratuit · Aucune carte bancaire requise'}
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                {isIt ? 'Nome e Cognome' : 'Nom et Prénom'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Gianluca Rossi"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                {isIt ? 'Nome del Bar o Locale' : 'Nom du Bar ou Établissement'}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Bar Central Milano"
                  value={formData.barName}
                  onChange={e => setFormData({ ...formData, barName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="gestione@barcentral.it"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                {isIt ? 'Password' : 'Mot de passe'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2 mt-2"
            >
              <span>{isIt ? 'Inizia la Prova Gratuita' : 'Commencer l\'Essai Gratuit'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 mt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              {isIt ? 'Hai già un account?' : 'Vous avez déjà un compte ?'}{' '}
              <Link href={`/${locale}/login`} className="text-amber-400 font-semibold hover:underline">
                {isIt ? 'Accedi qui' : 'Connectez-vous'}
              </Link>
            </p>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isIt ? 'Setup in 5 minuti' : 'Setup en 5 minutes'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isIt ? 'Disdici quando vuoi' : 'Sans engagement'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
