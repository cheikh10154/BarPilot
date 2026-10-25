import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(it|fr)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'it';

  // Check for demo bypass cookie
  const demoCookie = request.cookies.get('barpilot_role');
  if (demoCookie?.value) {
    return supabaseResponse;
  }

  // Public paths that don't require authentication
  const publicPaths = [
    `/${locale}/login`,
    `/${locale}/register`,
    `/${locale}/reset-password`,
    `/${locale}/demo`
  ];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If Supabase keys aren't configured yet, allow demo/browsing without 500 error
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasValidSupabase =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'your-supabase-url' &&
    supabaseUrl.startsWith('https://');

  if (!hasValidSupabase) {
    // In local demo mode without configured remote supabase
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublicPath && pathname !== '/' && !pathname.startsWith('/api') && !pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Middleware auth check error:', error);
  }

  return supabaseResponse;
}
