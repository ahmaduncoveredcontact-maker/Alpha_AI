// lib/calcom/update.ts

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

// ── CREATE CAL.COM EVENT TYPE WITH UNIQUE SLUG ──
export async function createCalEventType(client: any) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.error('❌ Cal.com API key or username missing.');
    return null;
  }

  // Base slug from client.slug
  const baseSlug = client.slug;
  let finalSlug = baseSlug;
  let attempt = 1;
  let created = false;

  while (!created && attempt <= 5) {
    try {
      const calRes = await fetch('https://api.cal.com/v2/event-types', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CALCOM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${client.business_name} Booking`,
          slug: finalSlug,
          length: 30,
          timeZone: client.timezone || 'America/New_York',
          beforeEventBuffer: client.buffer_time ?? 15,
          afterEventBuffer: client.buffer_time ?? 15,
          locations: [{ type: 'phone', phoneNumber: client.phone || '' }],
          bookingFields: [
            { name: 'name', type: 'text', required: true },
            { name: 'phone', type: 'phone', required: true },
            { name: 'notes', type: 'textarea' },
          ],
        }),
      });

      if (calRes.ok) {
        const data = await calRes.json();
        created = true;
        const slug = data.data?.slug || finalSlug;
        console.log(`✅ Cal.com event type created: ${slug}`);
        return { slug, eventTypeId: data.data?.id };
      } else {
        const errText = await calRes.text();
        // If error is "already exists", try with a suffix
        if (errText.includes('already has an event type with this slug')) {
          console.log(`⚠️ Slug "${finalSlug}" already taken, trying new slug...`);
          finalSlug = `${baseSlug}-${Date.now()}-${attempt}`;
          attempt++;
        } else {
          console.error(`❌ Cal.com event creation failed: ${errText}`);
          return null;
        }
      }
    } catch (error) {
      console.error('❌ createCalEventType error:', error);
      return null;
    }
  }

  if (!created) {
    console.error(`❌ Failed to create event type after ${attempt} attempts.`);
    return null;
  }
}

// ── UPDATE CAL.COM EVENT TYPE ──
export async function updateCalEventType(
  slug: string,
  data: {
    working_hours_start: string;
    working_hours_end: string;
    working_days: string[];
    timezone: string;
    day_times?: { [key: string]: { start: string; end: string } };
    buffer_time?: number;
  }
) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.error('❌ Cal.com API key or username missing. Skipping calendar update.');
    return null;
  }

  try {
    // 1. Get existing event type
    const getRes = await fetch(`https://api.cal.com/v2/event-types?slug=${slug}`, {
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getRes.ok) {
      const errText = await getRes.text();
      console.error(`❌ Failed to fetch event type: ${errText}`);
      return null;
    }

    const result = await getRes.json();
    const eventTypes = result.data?.eventTypes || [];
    const eventType = eventTypes.find((e: any) => e.slug === slug);

    if (!eventType) {
      console.error(`❌ Event type with slug "${slug}" not found.`);
      return null;
    }

    const eventTypeId = eventType.id;
    console.log(`✅ Found event type: ${eventTypeId}`);

    // 2. Build availability schedule
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const defaultStart = data.working_hours_start || '09:00';
    const defaultEnd = data.working_hours_end || '17:00';

    const availability = daysOfWeek.map((day) => {
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      const dayTime = data.day_times?.[dayName] || { start: defaultStart, end: defaultEnd };
      const enabled = data.working_days?.includes(dayName) || false;
      return {
        day: day,
        startTime: dayTime.start || defaultStart,
        endTime: dayTime.end || defaultEnd,
        enabled: enabled,
      };
    });

    const schedulePayload = {
      name: `Schedule for ${slug}`,
      timeZone: data.timezone || 'America/New_York',
      availability: availability,
    };

    // 3. Create or update schedule
    let scheduleId = eventType.scheduleId;

    if (!scheduleId) {
      console.log('🆕 Creating new schedule...');
      const createScheduleRes = await fetch('https://api.cal.com/v2/schedules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CALCOM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedulePayload),
      });
      if (createScheduleRes.ok) {
        const scheduleData = await createScheduleRes.json();
        scheduleId = scheduleData.data.id;
        console.log(`✅ Schedule created: ${scheduleId}`);
      } else {
        const errText = await createScheduleRes.text();
        console.error(`❌ Failed to create schedule: ${errText}`);
      }
    } else {
      console.log(`🔄 Updating existing schedule: ${scheduleId}`);
      const updateScheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CALCOM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedulePayload),
      });
      if (!updateScheduleRes.ok) {
        const errText = await updateScheduleRes.text();
        console.error(`❌ Failed to update schedule: ${errText}`);
      } else {
        console.log('✅ Schedule updated');
      }
    }

    // 4. Update event type with buffer time and schedule
    const updatePayload: any = {
      timeZone: data.timezone || 'America/New_York',
      beforeEventBuffer: data.buffer_time ?? 15,
      afterEventBuffer: data.buffer_time ?? 15,
    };
    if (scheduleId) {
      updatePayload.scheduleId = scheduleId;
    }

    console.log(`📤 Updating event type with:`, updatePayload);

    const updateRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error(`❌ Failed to update event type: ${errText}`);
      return null;
    }

    console.log(`✅ Cal.com event type updated: ${slug}`);
    return {
      success: true,
      bookingLink: `https://cal.com/${CALCOM_USERNAME}/${slug}`,
      message: 'Calendar updated successfully.',
    };

  } catch (error: any) {
    console.error('❌ Failed to update Cal.com event type:', error);
    return null;
  }
}