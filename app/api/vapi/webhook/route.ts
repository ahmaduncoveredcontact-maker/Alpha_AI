import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyVapiSignature } from '@/lib/vapi/webhook';
import { appendRow, createTab } from '@/lib/sheets';
import { email } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-omnidim-signature') || req.headers.get('x-vapi-signature') || '';

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('❌ Invalid JSON payload:', rawBody);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // OmniDimensions sends the webhook with a structure like:
    // { phone_number, to_number, bot_name, call_status, call_report: { summary, sentiment, extracted_variables: { ... } } }
    // We'll map it to our expected format.

    const callStatus = body.call_status || body.status || 'completed';
    const callReport = body.call_report || body.analysis || {};
    const extracted = callReport.extracted_variables || body.extracted_variables || {};

    // Only process completed calls (ignore statuses like 'failed' or 'in-progress')
    if (callStatus !== 'completed' && callStatus !== 'ended') {
      return NextResponse.json({ received: true, ignoredStatus: callStatus });
    }

    // Find client by assistantId? OmniDimensions sends bot_name, but we need assistantId.
    // We can store the agent_id in clients table (field: vapi_assistant_id).
    // The webhook might include the agent_id. We'll look for it.
    const agentId = body.agent_id || body.agentId || body.bot_id;
    if (!agentId) {
      console.error('❌ Missing agent_id in webhook payload');
      return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('vapi_assistant_id', String(agentId))
      .single();

    if (clientError || !client) {
      console.error(`❌ Client not found for agent_id: ${agentId}`);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // (Optional) Signature verification – we keep it but it's a no-op now
    const secretToUse = client.webhook_secret || process.env.OMNIDIM_WEBHOOK_SECRET || '';
    if (secretToUse && signature) {
      const isValid = verifyVapiSignature(body, signature, secretToUse);
      if (!isValid) {
        console.warn('⚠️ Webhook signature mismatch – continuing processing');
      }
    }

    // Deduplicate using call_id if provided
    const callId = body.call_id || body.callId || null;
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

    // Extract fields from OmniDimensions webhook
    const customerPhone =
      extracted.customer_phone ||
      body.phone_number ||
      '';

    const customerName =
      extracted.customer_name ||
      body.customer_name ||
      'Unknown';

    const bookedTime =
      extracted.appointment_time ||
      extracted.bookedTime ||
      '';

    const status =
      extracted.status ||
      'General Inquiry';

    const summary =
      callReport.summary ||
      body.summary ||
      'Call completed successfully';

    const recordingUrl =
      body.recording_url ||
      callReport.recording_url ||
      '';

    const address =
      extracted.address ||
      extracted.patient_address ||
      '';

    const callData = {
      client_slug: client.slug,
      timestamp: new Date().toISOString(),
      call_type: 'inbound',
      customer_name: customerName,
      customer_phone: customerPhone,
      summary: summary,
      status: status,
      booked_time: bookedTime,
      recording_url: recordingUrl,
      call_id: callId || '',
      address: address,
    };

    console.log(`📝 Final Call Data for ${client.slug}:`, callData);

    // Save to Supabase call_logs table
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
        callData.address,
      ]);
      console.log(`✅ Google Sheet appended for ${client.slug}`);
    } catch (sheetErr) {
      console.error('⚠️ Google Sheets append failed:', sheetErr);
    }

    // Send Email Summary to owner
    if (client.email) {
      try {
        await email.sendCallSummary(client.email, client.business_name, callData);
      } catch (emailErr) {
        console.warn('⚠️ Email send failed:', emailErr);
      }
    }

    // --- New: Send SMS/Notification to Customer (if booked) ---
    if (status === 'Booked' && customerPhone) {
      try {
        // You can integrate with Twilio, Resend (email), or any SMS provider here.
        // Example: send SMS via Twilio
        // const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        // await twilioClient.messages.create({
        //   body: `Your appointment with ${client.business_name} has been booked for ${bookedTime || 'soon'}.`,
        //   to: customerPhone,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        // });

        // For now, we'll send an email to the customer if we have their email? We don't.
        // We'll log that we would send SMS.
        console.log(`📲 Would send SMS to ${customerPhone} about booking at ${bookedTime}`);
      } catch (notifErr) {
        console.warn('⚠️ Customer notification failed:', notifErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('💥 Fatal Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}