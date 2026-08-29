import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { appendRow } from '@/lib/sheets';
import { vapi } from '@/lib/vapi/client';
import { rateLimit } from '@/lib/rate-limit/redis';

export async function POST(
  req: NextRequest,
  { params }: { params: { secret: string } }
) {
  const secret = params.secret;
  if (!secret) {
    return NextResponse.json({ error: 'Missing secret' }, { status: 400 });
  }

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('webhook_secret', secret)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 404 });
  }

  // Check if outbound calling is enabled and consent confirmed
  if (!client.outbound_calling_enabled || !client.consent_confirmed) {
    return NextResponse.json({ error: 'Outbound calling not enabled or consent not confirmed' }, { status: 403 });
  }

  // Parse lead data from the webhook body
  const body = await req.json();
  const { name, phone, service, message } = body;

  if (!phone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  // Rate limit check
  const { allowed, remaining } = await rateLimit.checkAndIncrement(client.slug);
  if (!allowed) {
    // Log rate limited
    await appendRow(client.slug, [
      client.slug,
      new Date().toISOString(),
      'outbound',
      name || 'Unknown',
      phone,
      `Rate limited (max 5/hr)`,
      'Rate Limited',
      '',
      '',
    ]);
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Trigger Vapi outbound call
  try {
    await vapi.triggerCall(phone, client.vapi_assistant_id!);
  } catch (err: any) {
    // Log failure
    await appendRow(client.slug, [
      client.slug,
      new Date().toISOString(),
      'outbound',
      name || 'Unknown',
      phone,
      `Call failed: ${err.message}`,
      'No Answer',
      '',
      '',
    ]);
    return NextResponse.json({ error: 'Call trigger failed' }, { status: 500 });
  }

  // Log initial call attempt (status will be updated by Vapi webhook later)
  await appendRow(client.slug, [
    client.slug,
    new Date().toISOString(),
    'outbound',
    name || 'Unknown',
    phone,
    `Lead: ${service || 'General'}`,
    'No Answer',
    '',
    '',
  ]);

  return NextResponse.json({ success: true, remaining });
}
