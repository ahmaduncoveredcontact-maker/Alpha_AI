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
      days: [day],
      startTime: dayTime.start || defaultStart,
      endTime: dayTime.end || defaultEnd,
      isEnabled: enabled,
    };
  });

  const eventTimeZone = scheduleData.timezone || client.timezone || 'America/New_York';
  const bufferTime = scheduleData.buffer_time ?? client.buffer_time ?? 15;

  let eventTypeId: number | null = client.cal_event_id || null;
  let eventSlug: string = client.cal_event_slug || client.slug;

  // ── STEP 1: Find the user's default schedule ID ──
  const meRes = await fetch('https://api.cal.com/v2/me', {
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}` },
  });

  let userScheduleId: number | null = null;

  if (meRes.ok) {
    const me = (await meRes.json()).data;
    userScheduleId = me?.defaultScheduleId ?? null;
    console.log(`📊 User default schedule ID: ${userScheduleId}`);
  }

  // ── STEP 2: Create event type if needed ──
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
      ...(userScheduleId ? { scheduleId: userScheduleId } : {}),
    });

    let res = await fetch('https://api.cal.com/v2/event-types', {
      method: 'POST',
      headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(client.slug)),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('already has an event type with this slug')) {
        res = await fetch('https://api.cal.com/v2/event-types', {
          method: 'POST',
          headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
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

  // ── STEP 3: Update the user's default schedule with the new availability ──
  if (!userScheduleId) {
    console.error('❌ No default schedule found for user.');
    return null;
  }

  const schedulePayload = {
    name: `Schedule for ${client.slug}`,
    timeZone: eventTimeZone,
    isDefault: true,
    availability,
  };

  console.log(`🔄 Updating user default schedule ${userScheduleId}...`);
  const updSchedRes = await fetch(`https://api.cal.com/v2/schedules/${userScheduleId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(schedulePayload),
  });

  if (!updSchedRes.ok) {
    console.error('❌ Schedule update failed:', await updSchedRes.text());
    return null;
  }
  console.log(`✅ Schedule ${userScheduleId} updated`);

  // ── STEP 4: Update buffer + timezone on the event type ──
  const updEventRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeZone: eventTimeZone,
      beforeEventBuffer: bufferTime,
      afterEventBuffer: bufferTime,
    }),
  });

  if (!updEventRes.ok) {
    console.error('❌ Event type update failed:', await updEventRes.text());
    return null;
  }

  console.log(`✅ Cal.com updated: eventType=${eventTypeId}, schedule=${userScheduleId}`);
  return { eventTypeId, eventSlug };
}