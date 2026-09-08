import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { processReviewEmailsForClient } from '@/lib/gmail/reviews';

export async function GET(req: NextRequest) {
  // 🔒 Secure with CRON_SECRET
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all clients with valid refresh tokens (they've signed in with Google)
  const { data: clients, error } = await supabaseAdmin
    .from('clients')
    .select('slug, email')
    .not('gbp_refresh_token', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch clients:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const client of clients) {
    try {
      const result = await processReviewEmailsForClient(client.slug);
      results.push({ slug: client.slug, ...result });
    } catch (err: any) {
      results.push({ slug: client.slug, error: err.message });
    }
  }

  return NextResponse.json({ 
    clients: clients.length, 
    results,
    timestamp: new Date().toISOString()
  });
}