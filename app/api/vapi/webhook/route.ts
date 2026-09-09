import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { appendRow, createTab } from '@/lib/sheets';
import { email } from '@/lib/email/resend';
import { incrementMinutesUsed } from '@/lib/call-limits';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('❌ Invalid JSON payload:', rawBody);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log('📥 Webhook received:', JSON.stringify(body, null, 2));

    // ── OMNIDIMENSIONS PAYLOAD STRUCTURE ──
    // {
    //   "call_status": "completed",
    //   "call_report": {
    //     "summary": "...",
    //     "extracted_variables": { ... }
    //   }
    // }

    // 1. Extract data from OmniDimensions payload
    const callStatus = body.call_status || body.status || 'completed';
    const callReport = body.call_report || body.analysis || {};
    const extracted = callReport.extracted_variables || body.extracted_variables || {};

    // 2. Only process completed calls
    if (callStatus !== 'completed' && callStatus !== 'ended') {
      console.log(`⏭️ Ignoring call with status: ${callStatus}`);
      return NextResponse.json({ received: true, ignoredStatus: callStatus });
    }

    // 3. Find client by agent_id (assistant ID)
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

    console.log(`✅ Found client: ${client.business_name} (${client.slug})`);

    // 4. Extract fields (prioritize extracted variables)
    const customerName = extracted.customer_name || body.customer_name || 'Unknown';
    const customerPhone = extracted.customer_phone || body.phone_number || '';
    const bookedTime = extracted.appointment_time || extracted.bookedTime || '';
    const status = extracted.status || 'General Inquiry';
    const summary = callReport.summary || body.summary || 'Call completed successfully';
    const recordingUrl = body.recording_url || callReport.recording_url || '';
    const address = extracted.address || extracted.patient_address || '';

    // 5. Call duration for minutes tracking
    const callDurationSeconds = body.call_duration || body.duration || 60;
    const callDurationMinutes = Math.ceil(callDurationSeconds / 60);

    // 6. Build call data
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
      call_id: body.call_id || body.callId || '',
      address: address,
    };

    console.log(`📝 Final Call Data for ${client.slug}:`, callData);

    // 7. Check for duplicates
    if (callData.call_id) {
      const { data: existing } = await supabaseAdmin
        .from('call_logs')
        .select('id')
        .eq('call_id', callData.call_id)
        .maybeSingle();

      if (existing) {
        console.warn(`⚠️ Duplicate call detected (call_id: ${callData.call_id}) – skipping`);
        return NextResponse.json({ success: true, deduped: true });
      }
    }

    // 8. Save to Supabase
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

    // 9. Append to Google Sheets
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

    // 10. Update minutes used
    await incrementMinutesUsed(client.slug, callDurationMinutes);
    console.log(`📊 Updated minutes for ${client.slug}: +${callDurationMinutes} min`);

    // 11. Send email summary to owner
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
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}