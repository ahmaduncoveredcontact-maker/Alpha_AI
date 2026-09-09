const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

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
    console.warn('⚠️ Cal.com API key missing. Skipping calendar update.');
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
      console.warn('⚠️ Could not fetch Cal.com event type:', await getRes.text());
      return null;
    }

    const result = await getRes.json();
    const eventTypes = result.data?.eventTypes || [];
    const eventType = eventTypes.find((e: any) => e.slug === slug);

    if (!eventType) {
      console.warn(`⚠️ Event type with slug "${slug}" not found.`);
      return null;
    }

    const eventTypeId = eventType.id;

    // 2. Build schedule (availability)
    // Cal.com v2 uses schedules. We'll create or update a schedule.
    // For simplicity, we'll use the "Default schedule" or create one.
    // We'll update the event type's scheduleId.

    // Build availability days
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayMap: { [key: string]: string } = {
      'Monday': 'monday',
      'Tuesday': 'tuesday',
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday',
    };

    // First, create a schedule with availability
    const schedulePayload = {
      name: `Schedule for ${slug}`,
      timeZone: data.timezone || 'America/New_York',
      availability: daysOfWeek.map((day) => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        const dayTime = data.day_times?.[dayName] || {};
        const enabled = data.working_days?.includes(dayName) || false;
        return {
          day: day,
          startTime: dayTime.start || data.working_hours_start || '09:00',
          endTime: dayTime.end || data.working_hours_end || '17:00',
          enabled: enabled,
        };
      }),
    };

    // Create or update schedule? For now, we'll use the existing schedule or create a new one.
    // We can fetch the current scheduleId from the event type.
    let scheduleId = eventType.scheduleId;

    if (!scheduleId) {
      // Create a new schedule
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
      } else {
        console.warn('⚠️ Failed to create schedule, using default availability.');
      }
    } else {
      // Update existing schedule
      await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CALCOM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedulePayload),
      });
    }

    // 3. Update event type with buffer time and scheduleId
    const updatePayload: any = {
      timeZone: data.timezone || 'America/New_York',
      beforeEventBuffer: data.buffer_time ?? 15, // minutes before appointment
      afterEventBuffer: data.buffer_time ?? 15,  // minutes after appointment
    };
    if (scheduleId) {
      updatePayload.scheduleId = scheduleId;
    }

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
      console.warn(`⚠️ Failed to update event type: ${errText}`);
    } else {
      console.log(`✅ Cal.com event type updated: ${slug}`);
    }

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