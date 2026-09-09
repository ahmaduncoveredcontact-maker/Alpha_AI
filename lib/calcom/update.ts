// lib/calcom/update.ts

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

// ── ENSURE EVENT TYPE EXISTS WITH SCHEDULE ──
export async function ensureCalEventType(client: any, scheduleData: any) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.error('❌ Cal.com API key or username missing.');
    return null;
  }

  const slug = client.cal_event_slug || client.slug;
  const defaultStart = scheduleData.working_hours_start || '09:00';
  const defaultEnd = scheduleData.working_hours_end || '17:00';
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Build availability
  const availability = daysOfWeek.map((day) => {
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    const dayTime = scheduleData.day_times?.[dayName] || { start: defaultStart, end: defaultEnd };
    const enabled = scheduleData.working_days?.includes(dayName) || false;
    return {
      day: day,
      startTime: dayTime.start || defaultStart,
      endTime: dayTime.end || defaultEnd,
      enabled: enabled,
    };
  });

  const eventPayload = {
    title: `${client.business_name} Booking`,
    slug: slug,
    length: 30,
    timeZone: scheduleData.timezone || client.timezone || 'America/New_York',
    beforeEventBuffer: scheduleData.buffer_time ?? client.buffer_time ?? 15,
    afterEventBuffer: scheduleData.buffer_time ?? client.buffer_time ?? 15,
    locations: [{ type: 'phone', phoneNumber: client.phone || '' }],
    bookingFields: [
      { name: 'name', type: 'text', required: true },
      { name: 'phone', type: 'phone', required: true },
      { name: 'notes', type: 'textarea' },
    ],
    schedule: {
      name: `Schedule for ${slug}`,
      timeZone: scheduleData.timezone || client.timezone || 'America/New_York',
      availability: availability,
    },
  };

  // 1. Try to create a new event type
  let createRes = await fetch('https://api.cal.com/v2/event-types', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (createRes.ok) {
    const data = await createRes.json();
    const createdSlug = data.data?.slug || slug;
    console.log(`✅ Cal.com event type created: ${createdSlug}`);
    return { slug: createdSlug, eventTypeId: data.data?.id };
  }

  // 2. If creation failed because slug already exists, try to update
  const errText = await createRes.text();
  if (errText.includes('already has an event type with this slug')) {
    console.log(`🔄 Event type "${slug}" already exists, updating...`);

    const getRes = await fetch(`https://api.cal.com/v2/event-types?slug=${slug}`, {
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getRes.ok) {
      console.error(`❌ Failed to fetch event type: ${await getRes.text()}`);
      return null;
    }

    const result = await getRes.json();
    const eventTypes = result.data?.eventTypes || [];
    const existing = eventTypes.find((e: any) => e.slug === slug);

    if (!existing) {
      console.error(`❌ Event type with slug "${slug}" not found.`);
      return null;
    }

    const eventTypeId = existing.id;

    const updatePayload = {
      timeZone: eventPayload.timeZone,
      beforeEventBuffer: eventPayload.beforeEventBuffer,
      afterEventBuffer: eventPayload.afterEventBuffer,
      schedule: eventPayload.schedule,
    };

    const updateRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateRes.ok) {
      console.error(`❌ Failed to update event type: ${await updateRes.text()}`);
      return null;
    }

    console.log(`✅ Cal.com event type updated: ${slug}`);
    return { slug, eventTypeId };
  }

  console.error(`❌ Cal.com event creation failed: ${errText}`);
  return null;
}

// ── ALIAS FOR BACKWARD COMPATIBILITY ──
export const updateCalEventType = ensureCalEventType;