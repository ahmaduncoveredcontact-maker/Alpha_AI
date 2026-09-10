// lib/calcom/create-event.ts

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;

export async function createCalEventForClient(client: {
  business_name: string;
  slug: string;
  phone?: string;
  timezone?: string;
  buffer_time?: number;
}): Promise<{ eventTypeId: number; slug: string } | null> {
  if (!CALCOM_API_KEY) {
    console.error('❌ CALCOM_API_KEY missing.');
    return null;
  }

  const slug = client.slug;
  const bufferTime = client.buffer_time ?? 15;
  const timezone = client.timezone || 'America/New_York';

  const body = {
    title: `${client.business_name} Booking`,
    slug,
    length: 30,
    timeZone: timezone,
    beforeEventBuffer: bufferTime,
    afterEventBuffer: bufferTime,
    locations: [{ type: 'phone', phoneNumber: client.phone || '' }],
    bookingFields: [
      { name: 'name', type: 'text', required: true },
      { name: 'phone', type: 'phone', required: true },
      { name: 'notes', type: 'textarea' },
    ],
  };

  let res = await fetch('https://api.cal.com/v2/event-types', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  // If slug is taken, retry with a unique suffix
  if (!res.ok) {
    const err = await res.text();
    if (err.includes('already has an event type with this slug')) {
      console.log(`⚠️ Slug "${slug}" taken — using unique slug...`);
      body.slug = `${slug}-${Date.now()}`;
      res = await fetch('https://api.cal.com/v2/event-types', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CALCOM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) {
      console.error('❌ Cal.com event creation failed:', await res.text());
      return null;
    }
  }

  const data = await res.json();
  console.log(`✅ Cal.com event created: ID=${data.data.id}, slug=${data.data.slug}`);
  return { eventTypeId: data.data.id, slug: data.data.slug };
}