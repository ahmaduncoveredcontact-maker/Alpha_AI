import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { appendRow } from '@/lib/sheets';
import { vapi } from '@/lib/vapi/client';
import { rateLimit } from '@/lib/rate-limit/redis';
import { checkCallLimit, incrementMinutesUsed } from '@/lib/call-limits';

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

  // ✅ Check minute limit
  const limitCheck = await checkCallLimit(client.slug);
  if (!limitCheck.allowed) {
    await appendRow(client.slug, [
      client.slug,
      new Date().toISOString(),
      'outbound',
      name || 'Unknown',
      phone,
      `Limit exceeded: ${limitCheck.reason}`,
      'Rate Limited',
      '',
      '',
    ]);
    return NextResponse.json({ 
      error: limitCheck.reason || 'Call limit exceeded',
      used: limitCheck.used,
      limit: limitCheck.limit,
      remaining: 0
    }, { status: 429 });
  }

  // Rate limit check (5 calls per hour)
  const { allowed, remaining } = await rateLimit.checkAndIncrement(client.slug);
  if (!allowed) {
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

  // Trigger OmniDimensions outbound call
  try {
    await vapi.triggerCall(phone, client.vapi_assistant_id!);
  } catch (err: any) {
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

  // ✅ Increment minutes used (estimated 1 minute per call)
  await incrementMinutesUsed(client.slug, 1);

  // Log initial call attempt
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

  return NextResponse.json({ 
    success: true, 
    remaining,
    minutesRemaining: limitCheck.remaining - 1
  });
}