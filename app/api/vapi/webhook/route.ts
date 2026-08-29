import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyVapiSignature } from '@/lib/vapi/webhook';
import { appendRow } from '@/lib/sheets';
import { email } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const signature = req.headers.get('x-vapi-signature') || '';

  // 1. Find client by assistantId
  const assistantId = body.assistantId;
  if (!assistantId) {
    return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 });
  }

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('vapi_assistant_id', assistantId)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Verify signature using client's webhook_secret (or a separate secret)
  const isValid = verifyVapiSignature(body, signature, client.webhook_secret);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Extract call data
  const callData = {
    client_slug: client.slug,
    timestamp: new Date().toISOString(),
    call_type: 'inbound',
    customer_name: body.customerName || 'Unknown',
    customer_phone: body.customerPhone || '',
    summary: body.summary || '',
    status: body.status || 'General Inquiry',
    booked_time: body.bookedTime || '',
    recording_url: body.recordingUrl || '',
  };

  // 3. Append to Google Sheets
  await appendRow(client.slug, [
    callData.client_slug,
    callData.timestamp,
    callData.call_type,
    callData.customer_name,
    callData.customer_phone,
    callData.summary,
    callData.status,
    callData.booked_time,
    callData.recording_url,
  ]);

  // 4. Send email summary if client has email
  if (client.email) {
    await email.sendCallSummary(client.email, client.business_name, callData);
  }

  return NextResponse.json({ success: true });
}
