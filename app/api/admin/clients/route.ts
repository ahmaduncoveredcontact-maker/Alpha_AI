import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateSlug, generateAccessCode, generateWebhookSecret } from '@/lib/utils/helpers';
import { vapi } from '@/lib/vapi/client';
import { createTab } from '@/lib/sheets';
import { email } from '@/lib/email/resend';
import bcrypt from 'bcryptjs';

// Helper to generate a unique slug
async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let exists = true;
  while (exists) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('slug')
      .eq('slug', slug)
      .single();
    if (error || !data) {
      exists = false;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
}

// NEW: Create Cal.com event type
async function createCalEventType(client: any) {
  const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
  const CALCOM_USERNAME = process.env.CALCOM_USERNAME;
  
  if (!CALCOM_API_KEY || !CALCOM_USERNAME) {
    console.warn('⚠️ Cal.com API key or username missing. Skipping event type creation.');
    return null;
  }

  const eventSlug = client.slug;

  // Build schedule from working hours/days
  const workingDays = client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0 };

  // Cal.com API v2 to create event type
  const response = await fetch('https://api.cal.com/v2/event-types', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `${client.business_name} Booking`,
      slug: eventSlug,
      length: 30,
      timeZone: client.timezone || 'America/New_York',
      locations: [
        { type: 'phone', phoneNumber: client.phone || '' }
      ],
      // Availability can be set via scheduleId; we'll leave it open and allow manual edit.
      // For now, we set the default schedule (available all week, 9-5) – client can edit later.
      bookingFields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'phone', required: true },
        { name: 'notes', type: 'textarea' },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Cal.com event type creation failed:', error);
    return null;
  }

  const data = await response.json();
  return data;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('clients').select('*').order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.business_name || !body.voice_instructions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseSlug = generateSlug(body.business_name);
    const slug = await getUniqueSlug(baseSlug);
    const accessCode = body.access_code || generateAccessCode();
    const accessCodeHash = await bcrypt.hash(accessCode, 10);
    const webhookSecret = generateWebhookSecret();
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/lead/${webhookSecret}`;

    // 1. Prepare client data with new fields
    const clientData = {
      business_name: body.business_name,
      slug,
      phone: body.phone || null,
      email: body.email || null,
      hours: body.hours || null,
      services: body.services || null,
      price_ranges: body.price_ranges || null,
      service_area: body.service_area || null,
      // REMOVED: calendar_link
      website_contact_form_url: body.website_contact_form_url || null,
      review_business_name: body.review_business_name || null,
      google_review_link: body.google_review_link || null,
      delivery_address: body.delivery_address || null,
      access_code_hash: accessCodeHash,
      voice_instructions: body.voice_instructions,
      vapi_assistant_id: null, // Will update after Vapi creation
      webhook_secret: webhookSecret,
      webhook_url: webhookUrl,
      outbound_calling_enabled: body.outbound_calling_enabled || false,
      consent_confirmed: body.consent_confirmed || false,
      manager_access_granted: body.manager_access_granted || false,
      // NEW: Calendar settings
      working_hours_start: body.working_hours_start || '09:00',
      working_hours_end: body.working_hours_end || '17:00',
      working_days: body.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timezone: body.timezone || 'America/New_York',
      cal_event_slug: null, // Will be set after Cal.com creation
    };

    // 2. Create Vapi assistant (OmniDimensions)
    let vapiAssistantId: string | undefined;
    try {
      const assistant = await vapi.createAssistant({
        name: body.business_name,
        instructions: body.voice_instructions,
        // We'll pass calEventSlug later, but we don't have it yet. We'll update after.
        // For now, create the agent without the booking tool, then we'll update it? 
        // Actually we can create the agent with the tool after we have the event slug.
        // But we need the agent ID to update it. Let's create agent first, then update.
        // We'll change the flow: create agent AFTER getting cal_event_slug.
      });
      vapiAssistantId = assistant.assistantId;
    } catch (error: any) {
      console.error('OmniDimensions agent creation error:', error);
      return NextResponse.json({ error: `Agent creation failed: ${error.message || 'Unknown error'}` }, { status: 500 });
    }

    // 3. Create Cal.com event type (if API key exists)
    let calEventSlug = null;
    try {
      const calEvent = await createCalEventType({
        ...clientData,
        // Pass the needed fields
        business_name: body.business_name,
        slug: slug,
        phone: body.phone,
        timezone: body.timezone,
        working_days: body.working_days,
      });
      if (calEvent && calEvent.data && calEvent.data.slug) {
        calEventSlug = calEvent.data.slug;
      }
    } catch (error) {
      console.warn('⚠️ Cal.com event type creation failed, but continuing:', error);
    }

    // 4. Update client record with all data
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        ...clientData,
        vapi_assistant_id: vapiAssistantId,
        cal_event_slug: calEventSlug || slug, // Use slug if Cal.com creation failed
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `DB insert failed: ${error.message}` }, { status: 500 });
    }

    // 5. Create Google Sheet tab
    try {
      await createTab(slug);
    } catch (error: any) {
      console.error(`⚠️ Sheet creation warning for ${slug}:`, error.message);
    }

    // 6. Send welcome email
    if (client.email) {
      try {
        await email.sendWelcome(client.email, client.business_name, accessCode);
      } catch (error: any) {
        console.error('Email sending error:', error);
      }
    }

    return NextResponse.json({
      client,
      accessCode,
      webhookUrl,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in client creation:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message || 'Unknown'}` }, { status: 500 });
  }
}