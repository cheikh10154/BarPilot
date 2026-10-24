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
      {/* Full-height dark sidebar on the left, header + content on the right (as in the mockup) */}
      <div className="flex h-screen overflow-hidden bg-[#f4f6fa] text-slate-900 antialiased">
        <AppNavigation locale={locale as 'it' | 'fr'} />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader locale={locale as 'it' | 'fr'} />
          <NetworkStatus locale={locale as 'it' | 'fr'} />
          <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
