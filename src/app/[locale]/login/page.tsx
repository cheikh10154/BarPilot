'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBarPilotStore } from '@/lib/store';
import { UserRole } from '@/types/database';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Crown,
  ChefHat,
  UtensilsCrossed
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function LoginPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClient();
  const { setRole } = useBarPilotStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get('error') === 'oauth_callback_failed'
      ? (isIt ? 'Autenticazione social non riuscita o annullata. Riprova.' : 'Échec de l\'authentification sociale. Réessayez.')
      : null
  );

  // Social OAuth Handler (Google & Facebook)
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setErrorMessage(null);
    setSocialLoading(provider);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/${locale}/dashboard`;

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

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(`[SocialAuth] ${provider} error:`, err);
      setErrorMessage(
        err.message || (isIt ? `Impossibile avviare l'accesso con ${provider}. Verifica le configurazioni.` : `Erreur de connexion avec ${provider}.`)
      );
      setSocialLoading(null);
    }
  };

  // Standard Email & Password Submit
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        // Fallback for mock demo environment if remote Supabase is unconfigured
        if (error.message.includes('FetchError') || error.message.includes('Invalid API key') || error.message.includes('Failed to fetch')) {
          console.warn('Supabase remote unconfigured, falling back to demo login');
          setRole('owner');
          router.push(`/${locale}/dashboard`);
          return;
        }
        throw error;
      }

      if (data?.user) {
        // Check organization membership
        const { data: memberships } = await supabase
          .from('memberships')
          .select('id, organization_id, role')
          .eq('profile_id', data.user.id)
          .eq('status', 'active');

        if (!memberships || memberships.length === 0) {
          router.push(`/${locale}/onboarding`);
        } else {
          router.push(`/${locale}/dashboard`);
        }
      }
    } catch (err: any) {
      console.error('[LoginError]:', err);
      let msg = err.message || (isIt ? 'Credenziali non valide o errore di connessione.' : 'Identifiants invalides.');
      if (err.message?.includes('Invalid login credentials')) {
        msg = isIt ? 'Email o password non corretti. Controlla e riprova.' : 'Email ou mot de passe incorrect.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Login (preserves existing mock capability)
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
            {isIt ? 'Benvenuto su BarPilot' : 'Bienvenue sur BarPilot'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            {isIt
              ? 'Accedi e gestisci il tuo bar in modo intelligente.'
              : 'Connectez-vous et gérez votre bar intelligemment.'}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Social OAuth Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google OAuth Button */}
            <button
              type="button"
              disabled={loading || socialLoading !== null}
              onClick={() => handleSocialLogin('google')}
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
              <span>{isIt ? 'Continua con Google' : 'Continuer avec Google'}</span>
            </button>

            {/* Facebook Login Button */}
            <button
              type="button"
              disabled={loading || socialLoading !== null}
              onClick={() => handleSocialLogin('facebook')}
              className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-md active:scale-[0.99] disabled:opacity-60"
            >
              {socialLoading === 'facebook' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span>{isIt ? 'Continua con Facebook' : 'Continuer avec Facebook'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 bg-slate-900 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {isIt ? 'Oppure continua con' : 'Ou continuer avec'}
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="bar@centrale.it"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] focus:ring-1 focus:ring-[#FF8A24] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {isIt ? 'Password' : 'Mot de passe'}
                </label>
                <Link
                  href={`/${locale}/reset-password`}
                  className="text-xs text-[#FF8A24] hover:underline"
                >
                  {isIt ? 'Password dimenticata?' : 'Mot de passe oublié ?'}
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8A24] focus:ring-1 focus:ring-[#FF8A24] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-[#FF8A24] focus:ring-[#FF8A24] focus:ring-offset-slate-900"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-400 cursor-pointer">
                {isIt ? 'Ricordami' : 'Se souvenir de moi'}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || socialLoading !== null}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF8A24] to-amber-600 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A24]/20 transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isIt ? 'Accesso in corso...' : 'Connexion...'}</span>
                </>
              ) : (
                <>
                  <span>{isIt ? 'Accedi' : 'Se connecter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            <span>{isIt ? 'Non hai un account? ' : 'Pas encore de compte ? '}</span>
            <Link
              href={`/${locale}/register`}
              className="text-[#FF8A24] font-bold hover:underline"
            >
              {isIt ? 'Registrati gratuitamente' : 'Inscrivez-vous gratuitement'}
            </Link>
          </div>
        </div>

        {/* Quick Demo Access Bar (preserves existing feature) */}
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isIt ? 'Accesso Rapido Demo' : 'Accès Démo Immédiat'}
            </span>
            <span className="text-[10px] text-slate-400">{isIt ? 'Test senza password' : 'Sans mot de passe'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin('owner')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-[11px] font-medium text-amber-300 flex items-center justify-center gap-1 transition"
            >
              <Crown className="w-3 h-3" />
              <span>{isIt ? 'Proprietario' : 'Propriétaire'}</span>
            </button>
            <button
              onClick={() => handleDemoLogin('server')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1 transition"
            >
              <UtensilsCrossed className="w-3 h-3 text-amber-400" />
              <span>{isIt ? 'Cameriere' : 'Serveur'}</span>
            </button>
            <button
              onClick={() => handleDemoLogin('bartender')}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1 transition"
            >
              <ChefHat className="w-3 h-3 text-emerald-400" />
              <span>{isIt ? 'Barista' : 'Barman'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
