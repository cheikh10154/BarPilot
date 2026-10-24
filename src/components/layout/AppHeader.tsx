'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import { UserRole } from '@/types/database';
import { 
  Bell, 
  Search,
  Calendar,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  UserCheck,
  X
} from 'lucide-react';

interface Props {
  locale: 'it' | 'fr';
}

export function AppHeader({ locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentRole, setRole, orders } = useBarPilotStore();
  const [mobileRoleModal, setMobileRoleModal] = useState(false);

  const pendingCount = orders.filter(o => o.status === 'sent' || o.status === 'preparing').length;

  const handleRoleChange = (role: UserRole) => {
    setRole(role);
    setMobileRoleModal(false);
    if (role === 'bartender') {
      router.push(`/${locale}/kitchen`);
    } else if (role === 'server') {
      router.push(`/${locale}/orders`);
    } else if (role === 'owner') {
      router.push(`/${locale}/dashboard`);
    }
  };

  const handleLocaleChange = (newLocale: 'it' | 'fr') => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  const roleLabels: Record<UserRole, { it: string; fr: string; icon: string }> = {
    owner: { it: 'Proprietario', fr: 'Propriétaire', icon: '👑' },
    manager: { it: 'Manager', fr: 'Manager', icon: '💼' },
    server: { it: 'Cameriere', fr: 'Serveur', icon: '📋' },
    bartender: { it: 'Barista (KDS)', fr: 'Barman (KDS)', icon: '🍸' },
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white text-slate-800 shadow-xs">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          
          {/* Mobile brand (hidden on desktop where sidebar has logo) */}
          <div className="lg:hidden flex items-center gap-2">
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 flex items-center justify-center shadow-md">
                <Image src="/logo.png" alt="BarPilot" width={32} height={32} className="rounded-lg object-contain" />
              </div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">BarPilot</span>
            </Link>
          </div>

          {/* Desktop Left Search input */}
          <div className="hidden lg:flex items-center relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={locale === 'it' ? 'Cerca comanda, tavolo, bevanda...' : 'Rechercher commande, table, boisson...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          {/* Right Controls matching the image top bar */}
          <div className="flex items-center gap-3">
            
            {/* Date pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Martedì 20 Ottobre 2025</span>
            </div>

            {/* Period dropdown ("Oggi") */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition">
              <span>{locale === 'it' ? 'Oggi' : 'Aujourd\'hui'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </div>

            {/* Simulated role switcher button */}
            <button
              onClick={() => setMobileRoleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold transition shadow-xs"
              title="Cambia ruolo"
            >
              <span>{roleLabels[currentRole].icon}</span>
              <span className="hidden sm:inline">{roleLabels[currentRole][locale]}</span>
            </button>

            {/* Notifications Bell with badge */}
            <Link
              href={`/${locale}/kitchen`}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
              title="Notifiche comande"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute 1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </Link>

            {/* Language switch IT / FR */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs font-extrabold">
              <button
                onClick={() => handleLocaleChange('it')}
                className={`px-2 py-1 rounded-lg transition ${
                  locale === 'it' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                IT
              </button>
              <button
                onClick={() => handleLocaleChange('fr')}
                className={`px-2 py-1 rounded-lg transition ${
                  locale === 'fr' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                FR
              </button>
            </div>

            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-xs">
              MR
            </div>
          </div>
        </div>
      </header>

      {/* Role Switcher Modal */}
      {mobileRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base">
                {locale === 'it' ? 'Cambia Ruolo di Lavoro' : 'Changer de Rôle'}
              </h3>
              <button onClick={() => setMobileRoleModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {(['owner', 'server', 'bartender', 'manager'] as UserRole[]).map((role) => {
                const isSelected = currentRole === role;
                const data = roleLabels[role];
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition border ${
                      isSelected
                        ? 'bg-orange-500 text-white font-bold border-orange-500 shadow-md shadow-orange-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{data.icon}</span>
                      <span className="text-xs font-semibold">{data[locale]}</span>
                    </div>
                    {isSelected && <span className="text-xs font-bold">✓</span>}
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
