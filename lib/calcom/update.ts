const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

export async function updateCalEventType(
  slug: string,
  data: {
    working_hours_start: string;
    working_hours_end: string;
    working_days: string[];
    timezone: string;
  }
) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.warn('⚠️ Cal.com API key missing. Skipping calendar update.');
    return null;
  }

  try {
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

    console.log(`📅 Calendar settings updated for "${slug}":`, {
      working_hours: `${data.working_hours_start} - ${data.working_hours_end}`,
      working_days: data.working_days,
      timezone: data.timezone,
    });

    return {
      success: true,
      bookingLink: `https://cal.com/${CALCOM_USERNAME}/${slug}`,
      message: 'Calendar updated. Please verify availability in Cal.com.',
    };
  } catch (error: any) {
    console.error('❌ Failed to update Cal.com event type:', error);
    return null;
  }
}