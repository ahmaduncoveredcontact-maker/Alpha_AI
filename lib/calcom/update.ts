// lib/calcom/update.ts

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

export async function ensureCalEventType(client: any, scheduleData: any) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.error('❌ Cal.com API key or username missing.');
    return null;
  }

  const baseSlug = client.slug;
  let slug = baseSlug;
  let attempts = 0;
  let createdOrUpdated = false;
  let finalSlug = slug;

  while (!createdOrUpdated && attempts < 5) {
    attempts++;
    if (attempts > 1) {
      slug = `${baseSlug}-${Date.now()}-${attempts}`;
    }

    const defaultStart = scheduleData.working_hours_start || '09:00';
    const defaultEnd = scheduleData.working_hours_end || '17:00';
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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

    const createRes = await fetch('https://api.cal.com/v2/event-types', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (createRes.ok) {
      const data = await createRes.json();
      finalSlug = data.data?.slug || slug;
      console.log(`✅ Cal.com event type created: ${finalSlug}`);
      createdOrUpdated = true;
      break;
    }

    const errText = await createRes.text();
    if (errText.includes('already has an event type with this slug')) {
      console.log(`⚠️ Slug "${slug}" already taken, trying a new one...`);
      continue;
    } else {
      console.error(`❌ Cal.com event creation failed: ${errText}`);
      return null;
    }
  }

  if (!createdOrUpdated) {
    console.error(`❌ Failed to create event type after ${attempts} attempts.`);
    return null;
  }

  // If the slug changed, update Supabase
  if (finalSlug !== client.cal_event_slug) {
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    await supabaseAdmin
      .from('clients')
      .update({ cal_event_slug: finalSlug })
      .eq('id', client.id);
    console.log(`📌 Updated cal_event_slug to: ${finalSlug}`);
  }

  return { slug: finalSlug };
}

// ✅ ALIAS for backward compatibility
export const updateCalEventType = ensureCalEventType;