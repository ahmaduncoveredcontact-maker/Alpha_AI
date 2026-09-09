import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  // Get client
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
  const CALCOM_USERNAME = process.env.CALCOM_USERNAME;

  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    return NextResponse.json({ error: 'Cal.com API key missing' }, { status: 500 });
  }

  // Create event type
  const calRes = await fetch('https://api.cal.com/v2/event-types', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `${client.business_name} Booking`,
      slug: slug,
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

  if (!calRes.ok) {
    const err = await calRes.text();
    return NextResponse.json({ error: `Cal.com API error: ${err}` }, { status: 500 });
  }

  const calData = await calRes.json();
  const calSlug = calData.data?.slug || slug;

  // Update client with cal_event_slug
  await supabaseAdmin
    .from('clients')
    .update({ cal_event_slug: calSlug })
    .eq('slug', slug);

  return NextResponse.json({
    success: true,
    cal_event_slug: calSlug,
    message: 'Cal.com event type created successfully',
  });
}