import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { ensureCalEventType } from '@/lib/calcom/update';

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionSlug = cookieStore.get('client_session')?.value;
    if (!sessionSlug || sessionSlug !== params.slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Build update object
    const updateData: any = {};
    if (body.working_hours_start !== undefined) updateData.working_hours_start = body.working_hours_start;
    if (body.working_hours_end !== undefined) updateData.working_hours_end = body.working_hours_end;
    if (body.working_days !== undefined) updateData.working_days = body.working_days;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.day_times !== undefined) updateData.day_times = body.day_times;
    if (body.buffer_time !== undefined) updateData.buffer_time = body.buffer_time;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // 1. Update Supabase
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('slug', params.slug)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    console.log('✅ Supabase updated for client:', client.slug);

    // 2. Sync to Cal.com – ensure event type exists with the new schedule
    const scheduleData = {
      working_hours_start: client.working_hours_start || '09:00',
      working_hours_end: client.working_hours_end || '17:00',
      working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timezone: client.timezone || 'America/New_York',
      day_times: client.day_times || {},
      buffer_time: client.buffer_time ?? 15,
    };

    const result = await ensureCalEventType(client, scheduleData);

    // If result is null, something went wrong; we already logged it
    // Return success anyway because Supabase is updated
    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('💥 Schedule update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}