// lib/gbp/token.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function getValidAccessToken(slug: string): Promise<string | null> {
  try {
    // 1. Get client data from Supabase
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('gbp_access_token, gbp_refresh_token, gbp_token_expiry')
      .eq('slug', slug)
      .single();

    if (error || !client) {
      console.error(`❌ Client not found for slug: ${slug}`, error);
      return null;
    }

    // 2. Check if we have a refresh token
    if (!client.gbp_refresh_token) {
      console.warn(`⚠️ No refresh token for client: ${slug}`);
      return null;
    }

    // 3. Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiry = client.gbp_token_expiry ? new Date(client.gbp_token_expiry) : new Date(0);
    const isExpired = expiry <= new Date(now.getTime() + 5 * 60 * 1000);

    // 4. If token is still valid, return it
    if (client.gbp_access_token && !isExpired) {
      return client.gbp_access_token;
    }

    // 5. Token expired – refresh it using the refresh token
    console.log(`🔄 Refreshing token for client: ${slug}`);
    const newToken = await refreshAccessToken(client.gbp_refresh_token, slug);

    if (!newToken) {
      console.error(`❌ Failed to refresh token for client: ${slug}`);
      return null;
    }

    return newToken;
  } catch (error) {
    console.error(`💥 Error getting token for ${slug}:`, error);
    return null;
  }
}

async function refreshAccessToken(refreshToken: string, slug: string): Promise<string | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
      return null;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Token refresh failed (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const { access_token, expires_in } = data;

    if (!access_token) {
      console.error('❌ No access_token in refresh response');
      return null;
    }

    // Calculate new expiry
    const expiry = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    // Update Supabase with new token
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        gbp_access_token: access_token,
        gbp_token_expiry: expiry,
      })
      .eq('slug', slug);

    if (updateError) {
      console.error(`❌ Failed to update token in Supabase for ${slug}:`, updateError);
      // Still return the token even if DB update fails
    } else {
      console.log(`✅ Token refreshed and stored for client: ${slug}`);
    }

    return access_token;
  } catch (error) {
    console.error(`💥 Refresh token error for ${slug}:`, error);
    return null;
  }
}

// ── Helper to check if a token needs refreshing ─────────────────────────

export function isTokenExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return true;
  const expiry = new Date(expiryDate);
  const now = new Date();
  // Add 5 minute buffer
  return expiry <= new Date(now.getTime() + 5 * 60 * 1000);
}