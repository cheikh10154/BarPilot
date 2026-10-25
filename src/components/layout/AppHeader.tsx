'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import { UserRole } from '@/types/database';
import { Bell, Search, CalendarDays, ChevronDown, X, Check } from 'lucide-react';

interface Props {
  locale: 'it' | 'fr';
}

export function AppHeader({ locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentRole, setRole, orders } = useBarPilotStore();
  const [roleModal, setRoleModal] = useState(false);
  const [today, setToday] = useState('');

  const isIt = locale === 'it';
  const pendingCount = orders.filter(o => o.status === 'sent' || o.status === 'preparing').length;

  // Computed client-side to avoid hydration mismatches
  useEffect(() => {
    const d = new Date().toLocaleDateString(isIt ? 'it-IT' : 'fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setToday(d.charAt(0).toUpperCase() + d.slice(1));
  }, [isIt]);

  const handleRoleChange = (role: UserRole) => {
    setRole(role);
    setRoleModal(false);
    if (role === 'bartender') router.push(`/${locale}/kitchen`);
    else if (role === 'server') router.push(`/${locale}/orders`);
    else router.push(`/${locale}/dashboard`);
  };

  const handleLocaleChange = (newLocale: 'it' | 'fr') => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  const roleLabels: Record<UserRole, { it: string; fr: string; icon: string; desc_it: string; desc_fr: string }> = {
    owner: { it: 'Proprietario', fr: 'Propriétaire', icon: '👑', desc_it: 'Accesso completo', desc_fr: 'Accès complet' },
    manager: { it: 'Manager', fr: 'Manager', icon: '💼', desc_it: 'Sala, scorte, rapporti', desc_fr: 'Salle, stocks, rapports' },
    server: { it: 'Cameriere', fr: 'Serveur', icon: '📋', desc_it: 'Presa comande e tavoli', desc_fr: 'Commandes et tables' },
    bartender: { it: 'Barista (KDS)', fr: 'Barman (KDS)', icon: '🍸', desc_it: 'Schermo preparazione', desc_fr: 'Écran de préparation' },
    cashier: { it: 'Cassiere', fr: 'Caissier', icon: '💳', desc_it: 'Cassa e pagamenti', desc_fr: 'Caisse et règlements' },
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#f4f6fa]/85 backdrop-blur-md border-b border-slate-200/70">
        <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          {/* Mobile brand */}
          <Link href={`/${locale}/dashboard`} className="lg:hidden flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 p-[2px] shadow-md shadow-orange-500/30">
              <Image src="/logo.png" alt="BarPilot" width={32} height={32} className="w-full h-full rounded-[9px] object-contain bg-[#0f172a]" />
            </span>
            <span className="font-extrabold text-base text-slate-900 tracking-tight">
              Bar<span className="text-orange-500">Pilot</span>
            </span>
          </Link>

          {/* Search */}
          <div className="hidden lg:flex items-center relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder={isIt ? 'Cerca comanda, tavolo, prodotto…' : 'Rechercher commande, table, produit…'}
              className="w-full h-10 pl-10 pr-14 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition"
            />
            <kbd className="absolute right-3 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5">
              Ctrl K
            </kbd>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-[13px] font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span suppressHydrationWarning>{today || '—'}</span>
            </div>

            <button className="hidden sm:flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition">
              <span>{isIt ? 'Oggi' : "Aujourd'hui"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setRoleModal(true)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-orange-700 text-[13px] font-semibold transition"
              title={isIt ? 'Cambia ruolo' : 'Changer de rôle'}
            >
              <span>{roleLabels[currentRole].icon}</span>
              <span className="hidden xl:inline">{roleLabels[currentRole][locale]}</span>
            </button>

            <Link
              href={`/${locale}/kitchen`}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition"
              title={isIt ? 'Notifiche' : 'Notifications'}
            >
              <Bell className="w-[18px] h-[18px]" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1 ring-2 ring-[#f4f6fa]">
                  {pendingCount}
                </span>
              )}
            </Link>

            <div className="flex items-center h-10 bg-white rounded-xl p-1 border border-slate-200 text-[11px] font-bold shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              {(['it', 'fr'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => handleLocaleChange(l)}
                  className={`h-full px-2.5 rounded-lg uppercase transition ${
                    locale === l ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Role switcher */}
      {roleModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRoleModal(false)}
        >
          <div
            className="bp-card w-full max-w-sm p-5 space-y-4 shadow-2xl bp-fade-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">{isIt ? 'Cambia ruolo' : 'Changer de rôle'}</h3>
                <p className="text-xs text-slate-500">{isIt ? "Simula l'interfaccia per ogni membro del team" : "Simulez l'interface de chaque membre"}</p>
              </div>
              <button onClick={() => setRoleModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {(['owner', 'manager', 'server', 'bartender'] as UserRole[]).map(role => {
                const isSelected = currentRole === role;
                const data = roleLabels[role];
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition border ${
                      isSelected
                        ? 'bg-orange-50 border-orange-300 ring-4 ring-orange-500/10'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">{data.icon}</span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{data[locale]}</span>
                        <span className="block text-[11px] text-slate-500">{isIt ? data.desc_it : data.desc_fr}</span>
                      </span>
                    </span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
