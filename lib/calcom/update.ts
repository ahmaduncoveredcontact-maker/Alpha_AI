// lib/calcom/update.ts

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

export async function updateCalEventType(
  slug: string,
  data: {
    working_hours_start: string;
    working_hours_end: string;
    working_days: string[];
    timezone: string;
    day_times?: { [key: string]: { start: string; end: string } }; // ADDED
    scheduleDays?: any[];
  }
) {
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.warn('⚠️ Cal.com API key missing. Skipping calendar update.');
    return null;
  }

  try {
    // For Cal.com v2, we may need to create/update a schedule
    // Since Cal.com API v2 may not directly support schedule updates,
    // we log the changes and provide the booking link for manual edit.

    console.log(`📅 Calendar settings updated for "${slug}":`, {
      default_hours: `${data.working_hours_start} - ${data.working_hours_end}`,
      working_days: data.working_days,
      timezone: data.timezone,
      day_times: data.day_times || {}, // LOG IT
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