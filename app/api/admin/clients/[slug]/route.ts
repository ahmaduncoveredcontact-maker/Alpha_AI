import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ensureCalEventType } from '@/lib/calcom/update';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('slug', params.slug)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    console.log('📥 Admin PUT received:', JSON.stringify(body, null, 2));

    // Update Supabase
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(body)
      .eq('slug', params.slug)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Supabase updated for client:', client.slug);
    console.log('📊 cal_event_id:', client.cal_event_id);
    console.log('📊 cal_event_slug:', client.cal_event_slug);

    // Check if schedule-related fields were updated
    const scheduleFields = [
      'working_hours_start', 'working_hours_end',
      'working_days', 'timezone', 'day_times', 'buffer_time'
    ];
    const hasScheduleUpdate = scheduleFields.some(field => body[field] !== undefined);

    console.log('🔍 Has schedule update:', hasScheduleUpdate);
    console.log('🔍 cal_event_id truthy:', !!client.cal_event_id);
    console.log('🔍 cal_event_slug truthy:', !!client.cal_event_slug);

    // Call sync if schedule was updated AND we have a Cal.com identifier
    if (hasScheduleUpdate && (client.cal_event_id || client.cal_event_slug)) {
      console.log('🚀 Calling ensureCalEventType...');
      try {
        const result = await ensureCalEventType(client, {
          working_hours_start: client.working_hours_start || '09:00',
          working_hours_end: client.working_hours_end || '17:00',
          working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timezone: client.timezone || 'America/New_York',
          day_times: client.day_times || {},
          buffer_time: client.buffer_time ?? 15,
        });
        console.log('✅ ensureCalEventType returned:', JSON.stringify(result));

        // If a new event was created (ID changed), save it
        if (result?.eventTypeId && result.eventTypeId !== client.cal_event_id) {
          await supabaseAdmin
            .from('clients')
            .update({ cal_event_id: result.eventTypeId, cal_event_slug: result.eventSlug })
            .eq('id', client.id);
          console.log(`📌 Updated cal_event_id to ${result.eventTypeId}`);
        }
      } catch (calError) {
        console.error('❌ Cal.com sync threw error:', calError);
      }
    } else {
      console.log('⏭️ Skipping Cal.com sync — condition not met');
    }

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('💥 Admin PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('slug', params.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}