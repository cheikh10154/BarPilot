'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useBarPilotStore } from '@/lib/store';
import {
  LayoutDashboard,
  ClipboardList,
  LayoutGrid,
  ChefHat,
  Wine,
  Boxes,
  Truck,
  ShoppingCart,
  Users2,
  BarChart3,
  Contact,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  X,
} from 'lucide-react';

interface Props {
  locale: 'it' | 'fr';
}

const COLLAPSE_KEY = 'barpilot-sidebar-collapsed';

export function AppNavigation({ locale }: Props) {
  const pathname = usePathname();
  const { orders } = useBarPilotStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore the collapsed preference
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1');
      return !prev;
    });
  };

  const isIt = locale === 'it';
  const pendingOrdersCount = orders.filter(o => o.status === 'sent' || o.status === 'preparing').length;

  const navItems = [
    { href: `/${locale}/dashboard`, icon: LayoutDashboard, label_it: 'Dashboard', label_fr: 'Tableau de bord' },
    { href: `/${locale}/orders`, icon: ClipboardList, label_it: 'Comande', label_fr: 'Commandes', chevron: true },
    { href: `/${locale}/tables`, icon: LayoutGrid, label_it: 'Plan de salle', label_fr: 'Plan de salle', chevron: true },
    { href: `/${locale}/kitchen`, icon: ChefHat, label_it: 'Preparazione', label_fr: 'Préparation', count: pendingOrdersCount, chevron: true },
    { href: `/${locale}/products`, icon: Wine, label_it: 'Prodotti', label_fr: 'Produits', chevron: true },
    { href: `/${locale}/inventory`, icon: Boxes, label_it: 'Inventario', label_fr: 'Inventaire', chevron: true },
    { href: `/${locale}/suppliers`, icon: Truck, label_it: 'Fornitori', label_fr: 'Fournisseurs', chevron: true },
    { href: `/${locale}/suppliers#acquisti`, icon: ShoppingCart, label_it: 'Acquisti', label_fr: 'Achats', chevron: true },
    { href: `/${locale}/staff`, icon: Users2, label_it: 'Personale', label_fr: 'Personnel', chevron: true },
    { href: `/${locale}/reports`, icon: BarChart3, label_it: 'Rapporti', label_fr: 'Rapports', chevron: true },
    { href: `/${locale}/settings#clienti`, icon: Contact, label_it: 'Clienti', label_fr: 'Clients', pro: true },
    { href: `/${locale}/settings`, icon: Settings, label_it: 'Impostazioni', label_fr: 'Paramètres' },
  ];

  // Only the first matching entry is highlighted (some entries share a page)
  const activeIdx = navItems.findIndex(item => pathname.startsWith(item.href.split('#')[0]));

  return (
    <>
      {/* ================= Desktop sidebar ================= */}
      <aside
        className={`hidden lg:flex flex-col h-screen shrink-0 bg-[#0f172a] text-slate-300 select-none transition-[width] duration-300 ease-out ${
          collapsed ? 'w-[76px]' : 'w-[248px]'
        }`}
      >
        {/* Brand */}
        <div className={`pt-5 pb-3 ${collapsed ? 'px-3' : 'px-5'}`}>
          <Link href={`/${locale}/dashboard`} className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 p-[2px] shadow-lg shadow-orange-500/30 shrink-0">
              <Image src="/logo.png" alt="BarPilot" width={36} height={36} className="w-full h-full rounded-[10px] object-contain bg-[#0f172a]" />
            </div>
            {!collapsed && (
              <span className="font-extrabold text-[19px] tracking-tight text-white">
                Bar<span className="text-orange-500">Pilot</span>
              </span>
            )}
          </Link>

          {/* Venue selector */}
          {!collapsed ? (
            <button className="mt-5 w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-xs transition">
              <span className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-[11px]">🍸</span>
                <span className="font-semibold text-white">Bar Centrale</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ) : (
            <div className="mt-5 mx-auto w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-sm" title="Bar Centrale">
              🍸
            </div>
          )}
        </div>

        {/* Links */}
        <nav className={`flex-1 overflow-y-auto py-2 space-y-0.5 ${collapsed ? 'px-3' : 'px-3.5'}`}>
          {navItems.map((item, idx) => {
            const isActive = idx === activeIdx;
            const Icon = item.icon;
            const label = isIt ? item.label_it : item.label_fr;

            return (
              <Link
                key={idx}
                href={item.href}
                title={collapsed ? label : undefined}
                className={`group relative flex items-center rounded-xl text-[13px] transition-all duration-150 ${
                  collapsed ? 'justify-center h-11' : 'justify-between px-3 h-10'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05] font-medium'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-200'}`} />
                  {!collapsed && <span>{label}</span>}
                </span>

                {!collapsed && (
                  <span className="flex items-center gap-1.5">
                    {item.pro && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-orange-500/90 text-white tracking-wider">PRO</span>
                    )}
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1">
                        {item.count}
                      </span>
                    )}
                    {item.chevron && (
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-slate-600 group-hover:text-slate-400'}`} />
                    )}
                  </span>
                )}

                {collapsed && typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0f172a]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className={`${collapsed ? 'px-3' : 'px-3.5'} pb-2`}>
          <button
            onClick={toggleCollapsed}
            className={`w-full flex items-center gap-2 h-9 rounded-xl text-xs font-medium text-slate-500 hover:text-white hover:bg-white/[0.05] transition ${
              collapsed ? 'justify-center' : 'px-3'
            }`}
            title={collapsed ? (isIt ? 'Espandi menu' : 'Déplier le menu') : undefined}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            {!collapsed && <span>{isIt ? 'Riduci menu' : 'Réduire le menu'}</span>}
          </button>
        </div>

        {/* Profile */}
        <div className={`border-t border-white/[0.06] ${collapsed ? 'p-3' : 'p-3.5'}`}>
          <div
            className={`flex items-center rounded-xl hover:bg-white/[0.05] transition cursor-pointer ${
              collapsed ? 'justify-center p-1' : 'justify-between p-2'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="relative">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/10">
                  MR
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0f172a]" />
              </span>
              {!collapsed && (
                <span>
                  <span className="block text-[13px] font-semibold text-white leading-tight">Marco Rossi</span>
                  <span className="block text-[11px] text-slate-500 leading-tight">{isIt ? 'Proprietario' : 'Propriétaire'}</span>
                </span>
              )}
            </span>
            {!collapsed && <ChevronRight className="w-4 h-4 text-slate-600" />}
          </div>
        </div>
      </aside>

      {/* ================= Mobile bottom dock ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-t border-white/[0.06] flex items-center justify-around px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-2xl">
        <DockLink href={`/${locale}/dashboard`} active={pathname.includes('/dashboard')} icon={LayoutDashboard} label="Home" />
        <DockLink href={`/${locale}/tables`} active={pathname.includes('/tables')} icon={LayoutGrid} label={isIt ? 'Tavoli' : 'Tables'} />

        {/* Raised POS button */}
        <Link href={`/${locale}/orders`} className="relative -top-4 flex flex-col items-center active:scale-95 transition">
          <span className="w-14 h-14 rounded-2xl bp-btn-primary border-4 border-[#0f172a]">
            <ClipboardList className="w-6 h-6" />
          </span>
          <span className="text-[10px] font-bold text-orange-400 mt-0.5">{isIt ? 'Comanda' : 'Commande'}</span>
        </Link>

        <DockLink
          href={`/${locale}/kitchen`}
          active={pathname.includes('/kitchen')}
          icon={ChefHat}
          label="KDS"
          badge={pendingOrdersCount}
        />

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${mobileDrawerOpen ? 'text-orange-500' : 'text-slate-400'}`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>

      {/* ================= Mobile drawer ================= */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="bg-[#0f172a] border-t border-white/[0.08] rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-10 space-y-4 shadow-2xl bp-fade-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-base">{isIt ? 'Tutti i moduli' : 'Tous les modules'}</span>
              <button onClick={() => setMobileDrawerOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 text-[11px] font-semibold text-center transition ${
                      isActive
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                        : 'bg-white/[0.04] border border-white/[0.06] text-slate-300'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-400'}`} />
                    <span className="leading-tight">{isIt ? item.label_it : item.label_fr}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DockLink({
  href,
  active,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition ${active ? 'text-orange-500' : 'text-slate-400'}`}
    >
      <Icon className="w-5 h-5 mb-0.5" />
      {!!badge && badge > 0 && (
        <span className="absolute top-0 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-1">
          {badge}
        </span>
      )}
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </Link>
  );
}
