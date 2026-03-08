// web-client/app/auth/callback/route.ts
// Supabase OAuth callback handler — exchanges code for session

import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get('code');
  const redirect = searchParams.get('redirect') ?? '/account';

  if (code) {
    const supabase = createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}