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

  // Day index order for Cal.com: 0=Sun, 1=Mon, ..., 6=Sat
  const dayMap = [
    { key: 'sunday',    name: 'Sunday' },
    { key: 'monday',    name: 'Monday' },
    { key: 'tuesday',   name: 'Tuesday' },
    { key: 'wednesday', name: 'Wednesday' },
    { key: 'thursday',  name: 'Thursday' },
    { key: 'friday',    name: 'Friday' },
    { key: 'saturday',  name: 'Saturday' },
  ];

  // ✅ Build availability as 7-element indexed array (Cal.com v2 format)
  const availability: any[] = dayMap.map(({ name }) => {
    const enabled = scheduleData.working_days?.includes(name) || false;
    if (!enabled) return [];

    const dayTime = scheduleData.day_times?.[name];
    const start = dayTime?.start || defaultStart;
    const end = dayTime?.end || defaultEnd;

    return [{ start, end }];   // ✅ { start: "HH:MM", end: "HH:MM" }
  });

  console.log('📅 Availability payload:', JSON.stringify(availability));

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

  // ── STEP 2: Get the schedule ID ──
  const meRes = await fetch('https://api.cal.com/v2/me', {
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}` },
  });
  const me = meRes.ok ? (await meRes.json()).data : null;
  const scheduleId: number | null = me?.defaultScheduleId ?? null;
  console.log(`📊 User default schedule ID: ${scheduleId}`);

  if (!scheduleId) {
    console.error('❌ No default schedule found.');
    return null;
  }

  // ── STEP 3: Update the schedule with the CORRECT availability format ──
  const schedulePayload = {
    name: `Schedule for ${client.slug}`,
    timeZone: eventTimeZone,
    isDefault: true,
    availability,               // ✅ 7-element indexed array
  };

  console.log(`🔄 Updating schedule ${scheduleId}...`);
  const updSchedRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(schedulePayload),
  });

  if (!updSchedRes.ok) {
    console.error('❌ Schedule update failed:', await updSchedRes.text());
    return null;
  }

  const updSchedData = await updSchedRes.json();
  console.log('🔎 Stored availability:', JSON.stringify(updSchedData.data?.availability));

  // ── STEP 4: Update buffer + timezone on event type ──
  await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${CALCOM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeZone: eventTimeZone,
      beforeEventBuffer: bufferTime,
      afterEventBuffer: bufferTime,
    }),
  });

  console.log(`✅ Cal.com updated: eventType=${eventTypeId}, schedule=${scheduleId}`);
  return { eventTypeId, eventSlug };
}s