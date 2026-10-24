import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default async function middleware(request: NextRequest) {
  // First handle Supabase session
  const supabaseResponse = await updateSession(request);

  // If Supabase redirected (e.g., to login), return that
  if (supabaseResponse.headers.get('location')) {
    return supabaseResponse;
  }

  // Then handle i18n
  const intlResponse = intlMiddleware(request);

  // Merge Supabase cookies into intl response
  supabaseResponse.cookies.getAll().forEach(cookie => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(it|fr)/:path*'],
};
