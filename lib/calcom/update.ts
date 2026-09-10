// lib/calcom/update.ts

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

export async function ensureCalEventType(client: any, scheduleData: any) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.error('❌ Cal.com API key or username missing.');
    return null;
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');

  const defaultStart = scheduleData.working_hours_start || '09:00';
  const defaultEnd = scheduleData.working_hours_end || '17:00';
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const availability = daysOfWeek.map((day) => {
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    const dayTime = scheduleData.day_times?.[dayName] || { start: defaultStart, end: defaultEnd };
    const enabled = scheduleData.working_days?.includes(dayName) || false;
    return {
      days: [day],                              // ✅ Cal.com v2 uses "days" as array
      startTime: dayTime.start || defaultStart,
      endTime: dayTime.end || defaultEnd,
      isEnabled: enabled,                       // ✅ renamed from "enabled"
    };
  });

  const eventTimeZone = scheduleData.timezone || client.timezone || 'America/New_York';
  const bufferTime = scheduleData.buffer_time ?? client.buffer_time ?? 15;

  let eventTypeId: number | null = client.cal_event_id || null;
  let eventSlug: string = client.cal_event_slug || client.slug;

  // ── STEP 1: Create event type ONCE if no ID ──
  if (!eventTypeId) {
    console.log('🆕 No cal_event_id — creating event type...');

    const buildPayload = (slugToUse: string) => ({
      title: `${client.business_name} Booking`,
      slug: slugToUse,
      length: 30,
      timeZone: eventTimeZone,
      beforeEventBuffer: bufferTime,
      afterEventBuffer: bufferTime,
      locations: [{ type: 'phone', phoneNumber: client.phone || '' }],
      bookingFields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'phone', required: true },
        { name: 'notes', type: 'textarea' },
      ],
    });

    const createRes = await fetch('https://api.cal.com/v2/event-types', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(client.slug)),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      if (errText.includes('already has an event type with this slug')) {
        console.log('⚠️ Slug in use — using unique slug...');
        const retryRes = await fetch('https://api.cal.com/v2/event-types', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CALCOM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildPayload(`${client.slug}-${Date.now()}`)),
        });
        if (!retryRes.ok) {
          console.error('❌ Cal.com creation failed:', await retryRes.text());
          return null;
        }
        const retryData = await retryRes.json();
        eventTypeId = retryData.data.id;
        eventSlug = retryData.data.slug;
      } else {
        console.error('❌ Cal.com creation failed:', errText);
        return null;
      }
    } else {
      const createData = await createRes.json();
      eventTypeId = createData.data.id;
      eventSlug = createData.data.slug;
    }

    await supabaseAdmin
      .from('clients')
      .update({ cal_event_id: eventTypeId, cal_event_slug: eventSlug })
      .eq('id', client.id);

    console.log(`✅ Cal.com event created: ID=${eventTypeId}, slug=${eventSlug}`);
  }

  // ── STEP 2: Create or update schedule ──
  const schedulePayload = {
    name: `Schedule for ${client.slug}`,
    timeZone: eventTimeZone,
    isDefault: true,                            // ✅ REQUIRED by Cal.com v2
    availability,
  };

  const getRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}` },
  });
  if (!getRes.ok) {
    console.error('❌ Failed to fetch event type by ID:', await getRes.text());
    return null;
  }
  const existing = (await getRes.json()).data;
  let scheduleId = existing.scheduleId;

  if (!scheduleId) {
    console.log('🆕 Creating schedule...');
    const createScheduleRes = await fetch('https://api.cal.com/v2/schedules', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schedulePayload),
    });
    if (createScheduleRes.ok) {
      scheduleId = (await createScheduleRes.json()).data.id;
      console.log(`✅ Schedule created: ${scheduleId}`);
    } else {
      console.error('❌ Schedule creation failed:', await createScheduleRes.text());
    }
  } else {
    console.log(`🔄 Updating schedule ${scheduleId}...`);
    const updateScheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schedulePayload),
    });
    if (updateScheduleRes.ok) {
      console.log(`✅ Schedule updated: ${scheduleId}`);
    } else {
      console.error('❌ Schedule update failed:', await updateScheduleRes.text());
    }
  }

  // ── STEP 3: PATCH event type with buffer, timezone, scheduleId ──
  const updatePayload: any = {
    timeZone: eventTimeZone,
    beforeEventBuffer: bufferTime,
    afterEventBuffer: bufferTime,
  };
  if (scheduleId) updatePayload.scheduleId = scheduleId;

  const updateRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  if (!updateRes.ok) {
    console.error('❌ Event type update failed:', await updateRes.text());
    return null;
  }

  console.log(`✅ Cal.com event type updated: ID=${eventTypeId}`);
  return { eventTypeId, eventSlug };
}