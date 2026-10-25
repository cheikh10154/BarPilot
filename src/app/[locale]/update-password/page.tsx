'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function UpdatePasswordPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const router = useRouter();

  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage(
        isIt ? 'La nuova password deve contenere almeno 8 caratteri.' : 'Le mot de passe doit faire au moins 8 caractères.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        isIt ? 'Le due password non coincidono.' : 'Les mots de passe ne correspondent pas.'
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setIsSuccess(true);
    } catch (err: any) {
      console.error('[UpdatePasswordError]:', err);
      setErrorMessage(
        err.message || (isIt ? 'Impossibile aggiornare la password. Il link potrebbe essere scaduto.' : 'Impossible de mettre à jour le mot de passe.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B1220] text-white selection:bg-[#FF8A24] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-1.5 rounded-2xl bg-gradient-to-tr from-[#FF8A24] via-amber-500 to-yellow-400 shadow-xl shadow-[#FF8A24]/20 mb-1">
            <Image
              src="/logo.png"
              alt="BarPilot"
              width={56}
              height={56}
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isIt ? 'Imposta nuova password' : 'Nouveau mot de passe'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            {isIt
              ? 'Scegli una password sicura per il tuo account BarPilot.'
              : 'Choisissez un mot de passe sécurisé pour votre compte.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {isSuccess ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {isIt ? 'Password aggiornata con successo!' : 'Mot de passe mis à jour !'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isIt
                  ? 'La tua password è stata modificata. Ora puoi accedere direttamente alla tua dashboard BarPilot.'
                  : 'Votre mot de passe a été modifié avec succès.'}
              </p>
              <div className="pt-3">
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A24] to-amber-600 text-slate-950 font-bold text-xs transition"
                >
                  {isIt ? 'Accedi al Gestionale' : 'Accéder au tableau de bord'}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  {isIt ? 'Nuova password (min. 8 caratteri)' : 'Nouveau mot de passe'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  {isIt ? 'Conferma nuova password' : 'Confirmer le mot de passe'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF8A24] to-amber-600 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A24]/20 transition active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{isIt ? 'Salvataggio in corso...' : 'Enregistrement...'}</span>
                  </>
                ) : (
                  <span>{isIt ? 'Salva nuova password' : 'Enregistrer'}</span>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
