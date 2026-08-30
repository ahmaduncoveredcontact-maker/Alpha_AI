import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyVapiSignature } from '@/lib/vapi/webhook';
import { appendRow } from '@/lib/sheets';
import { email } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-vapi-signature') || '';

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Vapi structures payloads inside a 'message' object for end-of-call reports
    const message = body.message || body;
    const assistantId = message.assistantId || message.assistant?.id;

    if (!assistantId) {
      console.error('Webhook Error: Missing assistantId in payload', body);
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 });
    }

    // 1. Find client by vapi_assistant_id in Supabase
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('vapi_assistant_id', assistantId)
      .single();

    if (error || !client) {
      console.error(`Webhook Error: Client not found for assistantId: ${assistantId}`);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

   // Verify signature securely using client's webhook_secret (or fallback to environment secret)
    const secretToUse = client.webhook_secret || process.env.VAPI_WEBHOOK_SECRET || '';
    if (secretToUse) {
      const isValid = verifyVapiSignature(body, signature, secretToUse);
      if (!isValid) {
        console.warn('Webhook Warning: Signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // 2. Extract call data safely from Vapi's nested schema
    const callAnalysis = message.analysis || message.call?.analysis || {};
    const customerDetails = message.customer || message.call?.customer || {};

    const callData = {
      client_slug: client.slug,
      timestamp: new Date().toISOString(),
      call_type: 'inbound',
      customer_name: customerDetails.name || 'Unknown',
      customer_phone: customerDetails.number || customerDetails.phone || '',
      summary: callAnalysis.summary || message.summary || 'Completed call session',
      status: callAnalysis.structuredData?.status || 'Booked',
      booked_time: callAnalysis.structuredData?.bookedTime || '',
      recording_url: message.recordingUrl || message.stereoRecordingUrl || message.call?.recordingUrl || '',
    };

    // 3. Save directly to Supabase call_logs table so the dashboard updates
    const { error: insertError } = await supabaseAdmin
      .from('call_logs')
      .insert([callData]);

    if (insertError) {
      console.error('Supabase Insert Error:', insertError);
    }

    // 4. Append to Google Sheets (Safely handled if not configured)
    try {
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
    } catch (sheetErr) {
      console.warn('Google Sheets append skipped/failed:', sheetErr);
    }

    // 5. Send email summary if client has email
    if (client.email) {
      try {
        await email.sendCallSummary(client.email, client.business_name, callData);
      } catch (emailErr) {
        console.warn('Email send failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Fatal Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}