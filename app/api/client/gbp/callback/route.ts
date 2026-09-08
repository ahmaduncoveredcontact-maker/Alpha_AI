// app/api/client/gbp/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live?error=gbp_auth_failed`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const slug = cookieStore.get('gbp_oauth_slug')?.value;
  if (!slug) {
    return NextResponse.json({ error: 'No slug found' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/client/gbp/callback`;

  if (!clientId || !clientSecret) {
    console.error('❌ Missing Google OAuth credentials');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live?error=missing_env`);
  }

  // Exchange code for tokens
  const tokenBody = new URLSearchParams();
  tokenBody.append('code', code);
  tokenBody.append('client_id', clientId);
  tokenBody.append('client_secret', clientSecret);
  tokenBody.append('redirect_uri', redirectUri);
  tokenBody.append('grant_type', 'authorization_code');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('❌ Token exchange failed:', errText);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live?error=gbp_token_failed`);
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  if (!access_token) {
    console.error('❌ No access_token in response');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live?error=no_access_token`);
  }

  // Save tokens to Supabase
  const expiry = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

  const { error: updateError } = await supabaseAdmin
    .from('clients')
    .update({
      gbp_access_token: access_token,
      gbp_refresh_token: refresh_token || null,
      gbp_token_expiry: expiry,
    })
    .eq('slug', slug);

  if (updateError) {
    console.error('❌ Failed to save tokens:', updateError);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live?error=gbp_save_failed`);
  }

  // Clear the cookie
  cookieStore.delete('gbp_oauth_slug');

  console.log(`✅ Google OAuth successful for client: ${slug}`);
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live/${slug}`);
}