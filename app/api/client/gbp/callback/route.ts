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

  // Get slug from cookie
  const cookieStore = await cookies();
  const slug = cookieStore.get('gbp_oauth_slug')?.value;
  if (!slug) {
    return NextResponse.json({ error: 'No slug found' }, { status: 400 });
  }

  // Exchange code for tokens
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/client/gbp/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Token exchange failed:', errText);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live?error=gbp_token_failed`);
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  // Save tokens to Supabase
  const expiry = new Date(Date.now() + expires_in * 1000).toISOString();

  const { error: updateError } = await supabaseAdmin
    .from('clients')
    .update({
      gbp_access_token: access_token,
      gbp_refresh_token: refresh_token || null,
      gbp_token_expiry: expiry,
    })
    .eq('slug', slug);

  if (updateError) {
    console.error('Failed to save tokens:', updateError);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live?error=gbp_save_failed`);
  }

  // Clear the cookie
  cookieStore.delete('gbp_oauth_slug');

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/live/${slug}`);
}