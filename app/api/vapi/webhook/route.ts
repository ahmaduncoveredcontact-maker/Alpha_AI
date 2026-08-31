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

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('❌ Invalid JSON:', rawBody);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log('📨 Vapi Webhook Payload:', JSON.stringify(body, null, 2));

    const message = body.message || body;
    const assistantId = message.assistantId || message.assistant?.id;

    if (!assistantId) {
      console.error('❌ Missing assistantId in payload');
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 });
    }

    // Find client
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('vapi_assistant_id', assistantId)
      .single();

    if (error || !client) {
      console.error(`❌ Client not found for assistantId: ${assistantId}`);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Signature verification (optional)
    const secretToUse = client.webhook_secret || process.env.VAPI_WEBHOOK_SECRET || '';
    if (secretToUse && signature) {
      const isValid = verifyVapiSignature(body, signature, secretToUse);
      if (!isValid) {
        console.warn('⚠️ Signature verification failed – rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('⚠️ No webhook secret set – skipping signature verification');
    }

    // 1. Extract unique call ID
    const callId = message.call?.id || message.callId || null;
    if (!callId) {
      console.warn('⚠️ No call ID found – cannot dedupe reliably');
    }

    // 2. Dedupe: Check if this call_id already exists in Supabase
    if (callId) {
      const existing = await supabaseAdmin
        .from('call_logs')
        .select('id')
        .eq('call_id', callId)
        .maybeSingle();

      if (existing.data) {
        console.warn(`⚠️ Duplicate call detected (call_id: ${callId}) – skipping`);
        return NextResponse.json({ success: true, deduped: true });
      }
    }

    // 3. Extract call data
    const callAnalysis = message.analysis || message.call?.analysis || {};
    const customerDetails = message.customer || message.call?.customer || {};
    const startedAt = message.startedAt || message.call?.startedAt || new Date().toISOString();

    const callData = {
      client_slug: client.slug,
      timestamp: new Date(startedAt).toISOString(),
      call_type: 'inbound',
      customer_name: customerDetails.name || message.callerName || 'Unknown',
      customer_phone: customerDetails.number || customerDetails.phone || message.callerNumber || '',
      summary: callAnalysis.summary || message.summary || 'Call completed',
      status: callAnalysis.structuredData?.status || 'General Inquiry',
      booked_time: callAnalysis.structuredData?.bookedTime || '',
      recording_url: message.recordingUrl || message.stereoRecordingUrl || message.call?.recordingUrl || '',
      call_id: callId || '',
    };

    console.log(`📝 Call data for ${client.slug}:`, callData);

    // 4. Ensure Google Sheet tab exists
    try {
      await createTab(client.slug);
    } catch (tabErr) {
      console.warn('⚠️ Could not create/verify sheet tab:', tabErr);
    }

    // 5. Append to Google Sheets (with call_id as 10th column)
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
        callData.call_id,
      ]);
      console.log(`✅ Google Sheets row appended for ${client.slug}`);
    } catch (sheetErr) {
      console.error('❌ Google Sheets append failed:', sheetErr);
    }

    // 6. Save to Supabase call_logs (including call_id)
    try {
      const { error: insertError } = await supabaseAdmin
        .from('call_logs')
        .insert([callData]);
      if (insertError) {
        console.warn('Supabase insert warning:', insertError);
      } else {
        console.log(`✅ Supabase call_logs insert successful for ${client.slug}`);
      }
    } catch (err) {
      console.warn('Supabase insert failed:', err);
    }

    // 7. Send email (optional)
    if (client.email) {
      try {
        await email.sendCallSummary(client.email, client.business_name, callData);
      } catch (emailErr) {
        console.warn('Email send failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('💥 Fatal Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}