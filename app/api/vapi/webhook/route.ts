import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyVapiSignature } from '@/lib/vapi/webhook';
import { appendRow, createTab } from '@/lib/sheets';
import { email } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-vapi-signature') || '';

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('❌ Invalid JSON payload:', rawBody);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const message = body.message || body;

    // Only process end-of-call report
    if (message.type !== 'end-of-call-report') {
      return NextResponse.json({ received: true, ignoredType: message.type || 'non-report' });
    }

    const assistantId = message.assistantId || message.assistant?.id || message.call?.assistantId;
    if (!assistantId) {
      console.error('❌ Missing assistantId in end-of-call report');
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 });
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('vapi_assistant_id', assistantId)
      .single();

    if (clientError || !client) {
      console.error(`❌ Client not found for assistantId: ${assistantId}`);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const secretToUse = client.webhook_secret || process.env.VAPI_WEBHOOK_SECRET || '';
    if (secretToUse && signature) {
      const isValid = verifyVapiSignature(body, signature, secretToUse);
      if (!isValid) {
        console.warn('⚠️ Webhook signature mismatch – continuing processing');
      }
    }

    const callId = message.call?.id || message.callId || body.call?.id || null;
    if (callId) {
      const { data: existing } = await supabaseAdmin
        .from('call_logs')
        .select('id')
        .eq('call_id', callId)
        .maybeSingle();

      if (existing) {
        console.warn(`⚠️ Duplicate call detected (call_id: ${callId}) – skipping`);
        return NextResponse.json({ success: true, deduped: true });
      }
    }

    const call = message.call || {};
    const customer = message.customer || call.customer || {};
    const analysis = message.analysis || call.analysis || {};
    const structuredData = analysis.structuredData || message.structuredData || {};
    const startedAt = message.startedAt || call.startedAt || new Date().toISOString();

    const customerPhone =
      structuredData.customer_phone ||
      customer.number ||
      customer.phone ||
      call.phoneNumber ||
      '';

    const customerName =
      structuredData.customer_name ||
      customer.name ||
      'Unknown';

    const bookedTime =
      structuredData.appointment_time ||
      structuredData.bookedTime ||
      '';

    const status =
      structuredData.status ||
      analysis.status ||
      'General Inquiry';

    const summary =
      analysis.summary ||
      message.summary ||
      'Call completed successfully';

    const recordingUrl =
      message.recordingUrl ||
      message.stereoRecordingUrl ||
      call.recordingUrl ||
      '';

    // NEW: Extract address from structured data
    const address =
      structuredData.address ||
      structuredData.patient_address ||
      '';

    const callData = {
      client_slug: client.slug,
      timestamp: new Date(startedAt).toISOString(),
      call_type: 'inbound',
      customer_name: customerName,
      customer_phone: customerPhone,
      summary: summary,
      status: status,
      booked_time: bookedTime,
      recording_url: recordingUrl,
      call_id: callId || '',
      address: address, // NEW
    };

    console.log(`📝 Final Call Data for ${client.slug}:`, callData);

    // Save to Supabase
    try {
      const { error: insertError } = await supabaseAdmin
        .from('call_logs')
        .insert([callData]);

      if (insertError) {
        console.error('❌ Supabase insert error:', insertError);
      } else {
        console.log(`✅ Supabase call_logs saved for ${client.slug}`);
      }
    } catch (dbErr) {
      console.error('💥 Database exception:', dbErr);
    }

    // Append to Google Sheets (11 columns)
    try {
      await createTab(client.slug);
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
        callData.call_id,
        callData.address, // NEW
      ]);
      console.log(`✅ Google Sheet appended for ${client.slug}`);
    } catch (sheetErr) {
      console.error('⚠️ Google Sheets append failed:', sheetErr);
    }

    // Send Email Summary
    if (client.email) {
      try {
        await email.sendCallSummary(client.email, client.business_name, callData);
      } catch (emailErr) {
        console.warn('⚠️ Email send failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('💥 Fatal Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}