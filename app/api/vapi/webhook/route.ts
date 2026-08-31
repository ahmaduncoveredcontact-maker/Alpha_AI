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

    // Log the full payload for debugging (remove after fixing)
    console.log('📨 Vapi Webhook Payload:', JSON.stringify(body, null, 2));

    const message = body.message || body;
    const assistantId = message.assistantId || message.assistant?.id;

    if (!assistantId) {
      console.error('Webhook Error: Missing assistantId in payload', body);
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 });
    }

    // 1. Find client by vapi_assistant_id
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('vapi_assistant_id', assistantId)
      .single();

    if (error || !client) {
      console.error(`Webhook Error: Client not found for assistantId: ${assistantId}`);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Signature verification (skip if secret not set)
    const secretToUse = client.webhook_secret || process.env.VAPI_WEBHOOK_SECRET || '';
    if (secretToUse && signature) {
      const isValid = verifyVapiSignature(body, signature, secretToUse);
      if (!isValid) {
        console.warn('⚠️ Signature verification failed – rejecting webhook');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('⚠️ No webhook secret set – skipping signature verification');
    }

    // 3. Extract call data
    const callAnalysis = message.analysis || message.call?.analysis || {};
    const customerDetails = message.customer || message.call?.customer || {};

    const callData = {
      client_slug: client.slug,
      timestamp: new Date().toISOString(),
      call_type: 'inbound',
      customer_name: customerDetails.name || message.callerName || 'Unknown',
      customer_phone: customerDetails.number || customerDetails.phone || message.callerNumber || '',
      summary: callAnalysis.summary || message.summary || 'Call completed',
      status: callAnalysis.structuredData?.status || 'General Inquiry',
      booked_time: callAnalysis.structuredData?.bookedTime || '',
      recording_url: message.recordingUrl || message.stereoRecordingUrl || message.call?.recordingUrl || '',
    };

    console.log(`📝 Call data for ${client.slug}:`, callData);

    // 4. Append to Google Sheets (appendRow now ensures tab exists)
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
      console.log(`✅ Google Sheets row appended for ${client.slug}`);
    } catch (sheetErr) {
      console.error('❌ Google Sheets append failed:', sheetErr);
      // Don't return error – we still want to process the call
      // but log it clearly.
    }

    // 5. Save to Supabase call_logs (optional – for backup)
    try {
      const { error: insertError } = await supabaseAdmin
        .from('call_logs')
        .insert([callData]);
      if (insertError) {
        console.warn('Supabase insert warning:', insertError);
      }
    } catch (err) {
      console.warn('Supabase insert failed:', err);
    }

    // 6. Send email summary
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