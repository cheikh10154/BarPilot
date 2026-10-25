import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/it/dashboard';
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // FASE 8: Onboarding check
        // Check if user has active organization memberships
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: memberships } = await supabase
            .from('memberships')
            .select('id, organization_id, role')
            .eq('profile_id', user.id)
            .eq('status', 'active');

          if (!memberships || memberships.length === 0) {
            // User does not belong to any bar -> redirect to onboarding to create or join
            return NextResponse.redirect(`${origin}/it/onboarding`);
          }
        }

        const forwardedHost = request.headers.get('x-forwarded-host');
        if (forwardedHost && process.env.NODE_ENV !== 'development') {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error('[AuthCallback] Code exchange error:', error);
      }
    } catch (err) {
      console.error('[AuthCallback] Unexpected error:', err);
    }
  }

  // If code exchange fails or no code is provided, redirect to login with error parameter
  return NextResponse.redirect(`${origin}/it/login?error=oauth_callback_failed`);
}
