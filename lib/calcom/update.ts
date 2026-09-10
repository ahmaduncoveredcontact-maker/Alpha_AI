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

  const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayDisplay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ✅ Helper: convert "14:00" → "1970-01-01T14:00:00.000Z"
  const toISO = (time: string) => {
    const [h, m] = (time || '00:00').split(':').map(Number);
    return `1970-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;
  };

  // ✅ Build 7-element array with ISO timestamps
  const availability: any[] = dayDisplay.map((displayName, idx) => {
    const enabled = scheduleData.working_days?.includes(displayName) || false;
    if (!enabled) return [];

    const dayTime = scheduleData.day_times?.[displayName];
    let start = dayTime?.start || defaultStart;
    let end = dayTime?.end || defaultEnd;

    // Safety: reject midnight misconfiguration from dashboard
    if (start === '00:00') start = defaultStart;

    return [{ start: toISO(start), end: toISO(end) }];
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

  // ── STEP 2: Get default schedule ──
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

  // ── STEP 3: Update schedule with ISO timestamps ──
  const schedulePayload = {
    name: `Schedule for ${client.slug}`,
    timeZone: eventTimeZone,
    isDefault: true,
    availability,
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
}