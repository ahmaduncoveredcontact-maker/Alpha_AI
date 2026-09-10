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

  // ── STEP 1: Create event type if needed ──
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
        console.error('❌ Cal.com creation failed:', await res.text());
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

    console.log(`✅ Cal.com event created: ID=${eventTypeId}, slug=${eventSlug}`);
  }

  // ── STEP 2: Update the event type's OWN schedule (not a shared one) ──
  // We use the event type's `schedule` field. Create it if null.

  const getRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}` },
  });
  if (!getRes.ok) {
    console.error('❌ Failed to fetch event type:', await getRes.text());
    return null;
  }
  const existing = (await getRes.json()).data;
  const attachedScheduleId: number | null = existing.scheduleId ?? existing.schedule ?? null;
  console.log(`📊 Attached schedule ID: ${attachedScheduleId}`);

  const schedulePayload = {
    name: `Schedule for ${client.slug}`,
    timeZone: eventTimeZone,
    isDefault: true,
    availability,
  };

  let finalScheduleId: number;

  if (attachedScheduleId) {
    // UPDATE the existing schedule
    console.log(`🔄 Updating schedule ${attachedScheduleId}...`);
    const updRes = await fetch(`https://api.cal.com/v2/schedules/${attachedScheduleId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(schedulePayload),
    });
    if (!updRes.ok) {
      console.error('❌ Schedule update failed:', await updRes.text());
      return null;
    }
    finalScheduleId = attachedScheduleId;
    console.log(`✅ Schedule updated: ${finalScheduleId}`);
  } else {
    // CREATE a new schedule
    console.log('🆕 No schedule attached — creating one...');
    const crRes = await fetch('https://api.cal.com/v2/schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(schedulePayload),
    });
    if (!crRes.ok) {
      console.error('❌ Schedule creation failed:', await crRes.text());
      return null;
    }
    finalScheduleId = (await crRes.json()).data.id;
    console.log(`✅ Schedule created: ${finalScheduleId}`);
  }

  // ── STEP 3: Attach the schedule + buffer to the event type ──
  const updatePayload: any = {
    timeZone: eventTimeZone,
    beforeEventBuffer: bufferTime,
    afterEventBuffer: bufferTime,
    scheduleId: finalScheduleId,   // ✅ always attach
  };

  const updEventRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload),
  });

  if (!updEventRes.ok) {
    console.error('❌ Event type update failed:', await updEventRes.text());
    return null;
  }

  // ── STEP 4: Verify the schedule is now attached ──
  const verifyRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}` },
  });
  const verified = (await verifyRes.json()).data;
  console.log(`🔎 Verified attached schedule: ${verified.scheduleId ?? verified.schedule ?? 'null'}`);

  console.log(`✅ Cal.com event type updated: ID=${eventTypeId}`);
  return { eventTypeId, eventSlug };
}