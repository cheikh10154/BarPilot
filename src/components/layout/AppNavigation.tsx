'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid,
  ChefHat,
  Wine,
  Boxes,
  Truck,
  ShoppingCart,
  Users2,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  Building,
  MoreHorizontal,
  X,
  RotateCcw
} from 'lucide-react';

interface Props {
  locale: 'it' | 'fr';
}

export function AppNavigation({ locale }: Props) {
  const pathname = usePathname();
  const { currentRole, orders, resetToDemo } = useBarPilotStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const pendingOrdersCount = orders.filter(o => o.status === 'sent' || o.status === 'preparing').length;

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
      label_it: 'Dashboard',
      label_fr: 'Tableau de bord',
    },
    {
      href: `/${locale}/orders`,
      icon: UtensilsCrossed,
      label_it: 'Comande',
      label_fr: 'Commandes',
    },
    {
      href: `/${locale}/tables`,
      icon: Grid,
      label_it: 'Plan de salle',
      label_fr: 'Plan de salle',
    },
    {
      href: `/${locale}/kitchen`,
      icon: ChefHat,
      label_it: 'Préparation',
      label_fr: 'Préparation',
      count: pendingOrdersCount,
    },
    {
      href: `/${locale}/products`,
      icon: Wine,
      label_it: 'Prodotti',
      label_fr: 'Produits',
    },
    {
      href: `/${locale}/inventory`,
      icon: Boxes,
      label_it: 'Inventario',
      label_fr: 'Inventaire',
    },
    {
      href: `/${locale}/suppliers`,
      icon: Truck,
      label_it: 'Fornitori',
      label_fr: 'Fournisseurs',
    },
    {
      href: `/${locale}/suppliers`,
      icon: ShoppingCart,
      label_it: 'Acquisti',
      label_fr: 'Achats',
    },
    {
      href: `/${locale}/staff`,
      icon: Users2,
      label_it: 'Personale',
      label_fr: 'Personnel',
    },
    {
      href: `/${locale}/reports`,
      icon: BarChart3,
      label_it: 'Rapporti',
      label_fr: 'Rapports',
    },
    {
      href: `/${locale}/settings`,
      icon: Users,
      label_it: 'Clienti',
      label_fr: 'Clients',
      pro: true,
    },
    {
      href: `/${locale}/settings`,
      icon: Settings,
      label_it: 'Impostazioni',
      label_fr: 'Paramètres',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (matching photo left sidebar) */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0f172a] text-slate-300 border-r border-slate-800 shrink-0 min-h-screen select-none">
        
        {/* Brand Header */}
        <div className="p-4 pb-2">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Image src="/logo.png" alt="BarPilot" width={32} height={32} className="rounded-lg object-contain" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              BarPilot
            </span>
          </Link>

          {/* Bar selector pill */}
          <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 hover:border-slate-700 transition cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-sm">🍸</span>
              <span className="font-semibold text-white">Bar Centrale</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const label = locale === 'it' ? item.label_it : item.label_fr;

            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-[#ea580c] text-white font-bold shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.pro && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-500 text-white uppercase tracking-wider">
                      PRO
                    </span>
                  )}
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1 animate-pulse">
                      {item.count}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Profile Card at bottom (Marco Rossi / Proprietario) */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center border border-white/20">
                MR
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Marco Rossi</p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {locale === 'it' ? 'Proprietario' : 'Propriétaire'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

      </aside>

      {/* Mobile Bottom Dock (Matching center phone mockup) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 py-1.5 shadow-2xl">
        <Link
          href={`/${locale}/dashboard`}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            pathname.includes('/dashboard') ? 'text-orange-500 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </Link>

        {/* Central highlighted POS Order button */}
        <Link
          href={`/${locale}/orders`}
          className="relative -top-3 flex flex-col items-center group active:scale-95 transition"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#ea580c] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 font-bold border-2 border-[#0f172a]">
            <UtensilsCrossed className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-orange-400 mt-0.5">Comande</span>
        </Link>

        <Link
          href={`/${locale}/tables`}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            pathname.includes('/tables') ? 'text-orange-500 font-bold' : 'text-slate-400'
          }`}
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Tavoli</span>
        </Link>

        <Link
          href={`/${locale}/kitchen`}
          className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition ${
            pathname.includes('/kitchen') ? 'text-orange-500 font-bold' : 'text-slate-400'
          }`}
        >
          <ChefHat className="w-5 h-5 mb-0.5" />
          {pendingOrdersCount > 0 && (
            <span className="absolute 0 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-1">
              {pendingOrdersCount}
            </span>
          )}
          <span className="text-[10px]">KDS</span>
        </Link>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            mobileDrawerOpen ? 'text-orange-500 font-bold' : 'text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#0f172a] border-t border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-extrabold text-white text-base">Tutti i Moduli</span>
              <button onClick={() => setMobileDrawerOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2.5 text-xs font-medium"
                >
                  <item.icon className="w-4 h-4 text-orange-400" />
                  <span>{locale === 'it' ? item.label_it : item.label_fr}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
