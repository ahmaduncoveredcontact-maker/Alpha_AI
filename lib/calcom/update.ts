// lib/calcom/update.ts

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;
const CALCOM_API_VERSION = '2024-06-11'; // ✅ REQUIRED

export async function ensureCalEventType(client: any, scheduleData: any) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.error('❌ Cal.com API key or username missing.');
    return null;
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');

  const defaultStart = scheduleData.working_hours_start || '09:00';
  const defaultEnd = scheduleData.working_hours_end || '17:00';

  // ✅ Build availability with string day names
  const availability = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .filter((dayName) => scheduleData.working_days?.includes(dayName))
    .map((dayName) => {
      const dayTime = scheduleData.day_times?.[dayName];
      return {
        days: [dayName],                              // ✅ ["Monday"] string array
        startTime: dayTime?.start || defaultStart,    // ✅ "HH:MM"
        endTime: dayTime?.end || defaultEnd,          // ✅ "HH:MM"
      };
    });

  console.log('📅 Availability:', JSON.stringify(availability));

  const eventTimeZone = scheduleData.timezone || client.timezone || 'America/New_York';
  const bufferTime = scheduleData.buffer_time ?? client.buffer_time ?? 15;

  let eventTypeId: number | null = client.cal_event_id || null;
  let eventSlug: string = client.cal_event_slug || client.slug;

  // ── STEP 1: Create event type if needed ──
  if (!eventTypeId) {
    console.log('🆕 Creating event type...');
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

    let res = await fetch('https://api.cal.com/v2/event-types', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': CALCOM_API_VERSION,
      },
      body: JSON.stringify(buildPayload(client.slug)),
    });
    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('already has an event type with this slug')) {
        res = await fetch('https://api.cal.com/v2/event-types', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CALCOM_API_KEY}`,
            'Content-Type': 'application/json',
            'cal-api-version': CALCOM_API_VERSION,
          },
          body: JSON.stringify(buildPayload(`${client.slug}-${Date.now()}`)),
        });
      }
      if (!res.ok) {
        console.error('❌ Creation failed:', await res.text());
        return null;
      }
    }
    const data = await res.json();
    eventTypeId = data.data.id;
    eventSlug = data.data.slug;
    await supabaseAdmin
      .from('clients')
      .update({ cal_event_id: eventTypeId, cal_event_slug: eventSlug })
      .eq('id', client.id);
    console.log(`✅ Event created: ID=${eventTypeId}`);
  }

  // ── STEP 2: Get the user's current default schedule ID ──
  const meRes = await fetch('https://api.cal.com/v2/me', {
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      'cal-api-version': CALCOM_API_VERSION,
    },
  });
  const me = meRes.ok ? (await meRes.json()).data : null;
  const oldScheduleId: number | null = me?.defaultScheduleId ?? null;
  console.log(`📊 Current default schedule ID: ${oldScheduleId}`);

  // ── STEP 3: Delete the old schedule (frees the isDefault slot) ──
  if (oldScheduleId) {
    console.log(`🗑️ Deleting old schedule ${oldScheduleId}...`);
    const delRes = await fetch(`https://api.cal.com/v2/schedules/${oldScheduleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        'cal-api-version': CALCOM_API_VERSION,
      },
    });
    console.log(delRes.ok ? '✅ Old schedule deleted' : '⚠️ Delete failed (continuing)');
  }

  // ── STEP 4: Create the new schedule with correct availability ──
  console.log('🆕 Creating new schedule...');
  const createRes = await fetch('https://api.cal.com/v2/schedules', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
      'cal-api-version': CALCOM_API_VERSION,
    },
    body: JSON.stringify({
      name: `Schedule for ${client.slug}`,
      timeZone: eventTimeZone,
      isDefault: true,
      availability,
    }),
  });

  if (!createRes.ok) {
    console.error('❌ Schedule creation failed:', await createRes.text());
    return null;
  }
  const newScheduleData = await createRes.json();
  const newScheduleId: number = newScheduleData.data.id;
  console.log(`✅ New schedule created: ${newScheduleId}`);
  console.log(`🔎 Stored availability:`, JSON.stringify(newScheduleData.data.availability));

  // ── STEP 5: Attach new schedule + buffer to event type ──
  const patchEventRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
      'cal-api-version': CALCOM_API_VERSION,
    },
    body: JSON.stringify({
      scheduleId: newScheduleId,
      timeZone: eventTimeZone,
      beforeEventBuffer: bufferTime,
      afterEventBuffer: bufferTime,
    }),
  });

  if (!patchEventRes.ok) {
    console.error('⚠️ Event type attach failed:', await patchEventRes.text());
  } else {
    console.log(`✅ Event type ${eventTypeId} attached to schedule ${newScheduleId}`);
  }

  console.log(`🎉 Cal.com sync complete for ${client.slug}`);
  return { eventTypeId, eventSlug };
}