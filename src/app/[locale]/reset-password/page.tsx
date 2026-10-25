'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function ResetPasswordPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/${locale}/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl
      });

      if (error) throw error;
      setIsSent(true);
    } catch (err: any) {
      console.error('[ResetPasswordError]:', err);
      setErrorMessage(
        err.message || (isIt ? 'Impossibile inviare l\'email di recupero. Riprova.' : 'Impossible d\'envoyer l\'email de réinitialisation.')
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
          <Link href={`/${locale}/login`} className="inline-block hover:opacity-95 transition">
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
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isIt ? 'Recupera la tua password' : 'Réinitialiser votre mot de passe'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            {isIt
              ? 'Inserisci la tua email e ti invieremo un link sicuro per reimpostare la password.'
              : 'Entrez votre email pour recevoir un lien sécurisé.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {isSent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {isIt ? 'Link inviato con successo!' : 'Lien envoyé avec succès !'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isIt
                  ? `Se l'indirizzo ${email} è associato a un account BarPilot, riceverai a breve un'email contenente il link per scegliere una nuova password.`
                  : `Si l'adresse ${email} existe dans notre système, vous recevrez un lien de réinitialisation.`}
              </p>
              <div className="pt-3">
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs transition"
                >
                  {isIt ? 'Torna alla pagina di Login' : 'Retour à la connexion'}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  {isIt ? 'Email registrata' : 'Email enregistrée'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="titolare@bar.it"
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
                    <span>{isIt ? 'Invio in corso...' : 'Envoi en cours...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isIt ? 'Invia link di recupero' : 'Envoyer le lien'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isIt ? 'Ricordi la password? Accedi' : 'Vous vous en souvenez ? Connexion'}</span>
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
