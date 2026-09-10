import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { ensureCalEventType } from '@/lib/calcom/update';

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const cookieStore = await cookies();
    const sessionSlug = cookieStore.get('client_session')?.value;
    if (!sessionSlug || sessionSlug !== params.slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const updateData: any = {};
    ['working_hours_start', 'working_hours_end', 'working_days', 'timezone', 'day_times', 'buffer_time']
      .forEach((k) => { if (body[k] !== undefined) updateData[k] = body[k]; });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('slug', params.slug)
      .select()
      .single();

    if (error) return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });

    // Sync to Cal.com using the stored numeric event ID
    const result = await ensureCalEventType(client, {
      working_hours_start: client.working_hours_start || '09:00',
      working_hours_end: client.working_hours_end || '17:00',
      working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timezone: client.timezone || 'America/New_York',
      day_times: client.day_times || {},
      buffer_time: client.buffer_time ?? 15,
    });

    if (result?.eventTypeId && result.eventTypeId !== client.cal_event_id) {
      // Save the ID if it changed (e.g., new event was created)
      await supabaseAdmin
        .from('clients')
        .update({ cal_event_id: result.eventTypeId, cal_event_slug: result.eventSlug })
        .eq('id', client.id);
    }

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error('💥 Schedule update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}