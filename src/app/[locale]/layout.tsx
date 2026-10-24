import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppNavigation } from '@/components/layout/AppNavigation';
import { NetworkStatus } from '@/components/layout/NetworkStatus';

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <AppHeader locale={locale as 'it' | 'fr'} />
        <NetworkStatus locale={locale as 'it' | 'fr'} />
        <div className="flex flex-1 overflow-hidden">
          <AppNavigation locale={locale as 'it' | 'fr'} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-32 md:pb-8 bg-slate-900/50">
            {children}
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
