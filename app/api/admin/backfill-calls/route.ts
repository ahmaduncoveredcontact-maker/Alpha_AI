import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { appendRow, createTab } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    // 🔒 Protect with CRON_SECRET (same as other admin endpoints)
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { slug, calls } = body;

    if (!slug || !calls || !Array.isArray(calls)) {
      return NextResponse.json({ error: 'Missing slug or calls array' }, { status: 400 });
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('slug', slug)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await createTab(slug);

    let inserted = 0;

    for (const call of calls) {
      const callData = {
        client_slug: slug,
        timestamp: call.timestamp || new Date().toISOString(),
        call_type: call.call_type || 'outbound',
        customer_name: call.customer_name || 'Unknown',
        customer_phone: call.customer_phone || '',
        summary: call.summary || 'Call completed',
        status: call.status || 'Completed',
        booked_time: call.booked_time || '',
        recording_url: call.recording_url || '',
        call_id: call.call_id || `backfill_${Date.now()}_${inserted}`,
        address: call.address || '',
      };

      const { error: insertError } = await supabaseAdmin
        .from('call_logs')
        .insert([callData]);

      if (insertError) {
        console.error('❌ Supabase insert error:', insertError);
      } else {
        await appendRow(slug, [
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
        inserted++;
        console.log(`✅ Backfilled call ${inserted} for ${slug}`);
      }
    }

    return NextResponse.json({ success: true, inserted, slug });

  } catch (error: any) {
    console.error('💥 Backfill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}