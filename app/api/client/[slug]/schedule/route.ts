import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { updateCalEventType, createCalEventType } from '@/lib/calcom/update';

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

    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error('❌ Invalid JSON body:', err);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    console.log('📝 Schedule update request:', JSON.stringify(body, null, 2));

    const { 
      working_hours_start, 
      working_hours_end, 
      working_days, 
      timezone, 
      day_times,
      buffer_time 
    } = body;

    // Build update object
    const updateData: any = {};
    if (working_hours_start !== undefined) updateData.working_hours_start = working_hours_start;
    if (working_hours_end !== undefined) updateData.working_hours_end = working_hours_end;
    if (working_days !== undefined) updateData.working_days = working_days;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (day_times !== undefined) updateData.day_times = day_times;
    if (buffer_time !== undefined) updateData.buffer_time = buffer_time;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    console.log('📦 Updating Supabase with:', updateData);

    // Update Supabase
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

    // ── ENSURE CAL.COM EVENT TYPE EXISTS ──
    let calEventSlug = client.cal_event_slug;

    // If no cal_event_slug in DB, create one
    if (!calEventSlug) {
      console.log('🆕 No cal_event_slug in DB, creating...');
      const newEvent = await createCalEventType(client);
      if (newEvent) {
        calEventSlug = newEvent.slug;
        await supabaseAdmin
          .from('clients')
          .update({ cal_event_slug: calEventSlug })
          .eq('id', client.id);
        // Refresh client data
        const { data: refreshedClient } = await supabaseAdmin
          .from('clients')
          .select('*')
          .eq('id', client.id)
          .single();
        if (refreshedClient) {
          Object.assign(client, refreshedClient);
        }
      } else {
        console.error('❌ Failed to create Cal.com event type.');
      }
    }

    // If we have a slug, try to sync – if it fails because event type doesn't exist in Cal.com, create it
    if (calEventSlug) {
      let syncSuccess = false;
      try {
        const result = await updateCalEventType(calEventSlug, {
          working_hours_start: client.working_hours_start || '09:00',
          working_hours_end: client.working_hours_end || '17:00',
          working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timezone: client.timezone || 'America/New_York',
          day_times: client.day_times || {},
          buffer_time: client.buffer_time ?? 15,
        });
        if (result?.success) {
          syncSuccess = true;
          console.log(`✅ Cal.com synced successfully for ${client.slug}`);
        }
      } catch (calError) {
        console.warn('⚠️ Cal.com update failed:', calError);
      }

      // If sync failed, try creating the event type and then sync again
      if (!syncSuccess) {
        console.log('🔄 Sync failed, attempting to create event type and retry...');
        const newEvent = await createCalEventType(client);
        if (newEvent) {
          calEventSlug = newEvent.slug;
          await supabaseAdmin
            .from('clients')
            .update({ cal_event_slug: calEventSlug })
            .eq('id', client.id);
          // Retry sync
          try {
            const result = await updateCalEventType(calEventSlug, {
              working_hours_start: client.working_hours_start || '09:00',
              working_hours_end: client.working_hours_end || '17:00',
              working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              timezone: client.timezone || 'America/New_York',
              day_times: client.day_times || {},
              buffer_time: client.buffer_time ?? 15,
            });
            if (result?.success) {
              console.log(`✅ Cal.com synced successfully after creation for ${client.slug}`);
            }
          } catch (retryError) {
            console.error('❌ Retry sync failed:', retryError);
          }
        }
      }
    } else {
      console.warn('⚠️ No cal_event_slug to sync to Cal.com');
    }

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('💥 Schedule update error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    }, { status: 500 });
  }
}