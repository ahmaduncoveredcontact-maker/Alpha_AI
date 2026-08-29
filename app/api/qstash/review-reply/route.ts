import { NextRequest, NextResponse } from 'next/server';
import { gbp } from '@/lib/reviews/gbp';
import { generateReply } from '@/lib/reviews/openrouter';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accountId, locationId, reviewId, reviewText, businessName, clientSlug } = body;

  if (!accountId || !locationId || !reviewId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const reply = await generateReply(reviewText, businessName);
    await gbp.postReply(accountId, locationId, reviewId, reply);
    console.log(`Replied to review ${reviewId} for client ${clientSlug}`);
    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error('Qstash job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
