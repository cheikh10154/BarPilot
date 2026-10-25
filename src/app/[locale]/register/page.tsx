'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function RegisterPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const router = useRouter();

  const supabase = createClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false); // FASE 2: non preselezionato
  const [agreePrivacy, setAgreePrivacy] = useState(false); // FASE 2: non preselezionato

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successConfirmation, setSuccessConfirmation] = useState(false);

  // Social OAuth Handler
  const handleSocialRegister = async (provider: 'google' | 'facebook') => {
    setErrorMessage(null);
    setSocialLoading(provider);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/${locale}/onboarding`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(`[SocialRegister] ${provider} error:`, err);
      setErrorMessage(
        err.message || (isIt ? `Impossibile completare la registrazione con ${provider}.` : `Erreur d'inscription avec ${provider}.`)
      );
      setSocialLoading(null);
    }
  };

  // Submit Handler for Email & Password Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage(isIt ? 'Inserisci sia il nome che il cognome.' : 'Veuillez saisir votre nom et prénom.');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage(
        isIt
          ? 'Per procedere è necessario accettare i Termini di servizio e l\'Informativa sulla privacy.'
          : 'Veuillez accepter les Conditions de service et la Politique de confidentialité.'
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        isIt ? 'La password deve contenere almeno 8 caratteri.' : 'Le mot de passe doit contenir au moins 8 caractères.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(isIt ? 'Le password non coincidono.' : 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            preferred_locale: locale
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/onboarding`
        }
      });

      if (error) {
        // Fallback demo mode if Supabase keys aren't set
        if (error.message.includes('FetchError') || error.message.includes('Invalid API key') || error.message.includes('Failed to fetch')) {
          router.push(`/${locale}/onboarding`);
          return;
        }
        throw error;
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        setSuccessConfirmation(true);
      } else {
        router.push(`/${locale}/onboarding`);
      }
    } catch (err: any) {
      console.error('[RegisterError]:', err);
      let msg = err.message || (isIt ? 'Errore durante la registrazione.' : 'Erreur d\'inscription.');
      if (err.message?.includes('User already registered')) {
        msg = isIt ? 'Un account con questa email esiste già. Effettua il login.' : 'Un compte avec cet email existe déjà.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B1220] text-white selection:bg-[#FF8A24] selection:text-white">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href={`/${locale}`} className="inline-block hover:opacity-95 transition">
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
            {isIt ? 'Crea il tuo account BarPilot' : 'Créer votre compte BarPilot'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            {isIt
              ? 'Inizia la gestione intelligente del tuo bar in pochi secondi.'
              : 'Commencez à gérer votre bar intelligemment en quelques secondes.'}
          </p>
        </div>

        {/* Email Verification Banner */}
        {successConfirmation ? (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isIt ? 'Verifica il tuo indirizzo email' : 'Vérifiez votre adresse email'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isIt
                ? `Abbiamo inviato un link di conferma a ${email}. Apri l'email e clicca sul link per attivare il tuo profilo BarPilot.`
                : `Nous avons envoyé un lien de confirmation à ${email}. Cliquez sur le lien pour activer votre compte.`}
            </p>
            <div className="pt-2">
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs transition"
              >
                {isIt ? 'Torna al Login' : 'Retour à la connexion'}
              </Link>
            </div>
          </div>
        ) : (
          /* Main Registration Card */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            
            {/* Error Alert Box */}
            {errorMessage && (
              <div className="p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Social Registration */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                disabled={loading || socialLoading !== null}
                onClick={() => handleSocialRegister('google')}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-md active:scale-[0.99] disabled:opacity-60"
              >
                {socialLoading === 'google' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>{isIt ? 'Registrati con Google' : 'S\'inscrire avec Google'}</span>
              </button>

              <button
                type="button"
                disabled={loading || socialLoading !== null}
                onClick={() => handleSocialRegister('facebook')}
                className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-md active:scale-[0.99] disabled:opacity-60"
              >
                {socialLoading === 'facebook' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                <span>{isIt ? 'Registrati con Facebook' : 'S\'inscrire avec Facebook'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-3 bg-slate-900 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {isIt ? 'Oppure con email' : 'Ou par email'}
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Nome e Cognome */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    {isIt ? 'Nome' : 'Prénom'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Cheikh"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    {isIt ? 'Cognome' : 'Nom'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Gueye"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="titolare@bar.it"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {isIt ? 'Password (min. 8 caratteri)' : 'Mot de passe (min. 8 caractères)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {isIt ? 'Conferma password' : 'Confirmer le mot de passe'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] transition"
                  />
                </div>
              </div>

              {/* Terms & Privacy Checkboxes (Unchecked by default as requested in FASE 2) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-slate-950 border-slate-800 text-[#FF8A24] focus:ring-[#FF8A24]"
                  />
                  <label htmlFor="agreeTerms" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                    {isIt ? 'Accetto i ' : 'J\'accepte les '}
                    <span className="text-[#FF8A24] underline">
                      {isIt ? 'Termini di servizio di BarPilot' : 'Conditions de service'}
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    checked={agreePrivacy}
                    onChange={e => setAgreePrivacy(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-slate-950 border-slate-800 text-[#FF8A24] focus:ring-[#FF8A24]"
                  />
                  <label htmlFor="agreePrivacy" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                    {isIt ? 'Dichiaro di aver letto l\'' : 'J\'ai lu la '}
                    <span className="text-[#FF8A24] underline">
                      {isIt ? 'Informativa sulla privacy' : 'Politique de confidentialité'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || socialLoading !== null}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#FF8A24] to-amber-600 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A24]/20 transition active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{isIt ? 'Creazione account in corso...' : 'Création du compte...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isIt ? 'Crea account' : 'Créer un compte'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-xs text-slate-400">
              <span>{isIt ? 'Hai già un account? ' : 'Vous avez déjà un compte ? '}</span>
              <Link
                href={`/${locale}/login`}
                className="text-[#FF8A24] font-bold hover:underline"
              >
                {isIt ? 'Accedi' : 'Se connecter'}
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
