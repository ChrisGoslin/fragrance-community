import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

function getSafeNext(searchParams: URLSearchParams) {
  const next = searchParams.get('next') ?? '/profile';
  return next.startsWith('/') ? next : '/profile';
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const redirectTo = request.nextUrl.clone();

  redirectTo.pathname = getSafeNext(request.nextUrl.searchParams);
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  if (tokenHash && type) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = '/login';
  redirectTo.searchParams.set('error', 'auth_confirm_failed');
  return NextResponse.redirect(redirectTo);
}
