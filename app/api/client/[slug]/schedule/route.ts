import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { updateCalEventType } from '@/lib/calcom/update';

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
    // ✅ DESTRUCTURE day_times as well
    const { working_hours_start, working_hours_end, working_days, timezone, day_times } = body;

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({
        working_hours_start: working_hours_start || '09:00',
        working_hours_end: working_hours_end || '17:00',
        working_days: working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timezone: timezone || 'America/New_York',
        day_times: day_times || {}, // ✅ Now using the passed day_times
      })
      .eq('slug', params.slug)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update Cal.com if event slug exists
    if (client.cal_event_slug) {
      try {
        await updateCalEventType(client.cal_event_slug, {
          working_hours_start: client.working_hours_start || '09:00',
          working_hours_end: client.working_hours_end || '17:00',
          working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timezone: client.timezone || 'America/New_York',
          day_times: client.day_times || {},
        });
      } catch (calError) {
        console.warn('⚠️ Cal.com update failed:', calError);
      }
    }

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('💥 Schedule update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}