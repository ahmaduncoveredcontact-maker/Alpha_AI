import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateCalEventType } from '@/lib/calcom/update';

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

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(body)
      .eq('slug', params.slug)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If schedule fields were updated, update Cal.com
    const scheduleFields = ['working_hours_start', 'working_hours_end', 'working_days', 'timezone'];
    const hasScheduleUpdate = scheduleFields.some(field => body[field] !== undefined);

    if (hasScheduleUpdate && client.cal_event_slug) {
      try {
        await updateCalEventType(client.cal_event_slug, {
          working_hours_start: client.working_hours_start || '09:00',
          working_hours_end: client.working_hours_end || '17:00',
          working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timezone: client.timezone || 'America/New_York',
        });
      } catch (calError) {
        console.warn('⚠️ Cal.com update failed but Supabase was updated:', calError);
      }
    }

    return NextResponse.json(client);
  } catch (error: any) {
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