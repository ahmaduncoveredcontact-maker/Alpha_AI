import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateSlug, generateAccessCode, generateWebhookSecret } from '@/lib/utils/helpers';
import { vapi } from '@/lib/vapi/client';
import { createCalEventForClient } from '@/lib/calcom/create-event';
import { createTab } from '@/lib/sheets';
import { email } from '@/lib/email/resend';
import bcrypt from 'bcryptjs';

async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const { data } = await supabaseAdmin.from('clients').select('slug').eq('slug', slug).single();
    if (!data) return slug;
    slug = `${baseSlug}-${counter++}`;
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

    // ── STEP 1: Create Cal.com event FIRST ──
    console.log(`📅 Creating Cal.com event for ${slug}...`);
    const calEvent = await createCalEventForClient({
      business_name: body.business_name,
      slug,
      phone: body.phone,
      timezone: body.timezone || 'America/New_York',
      buffer_time: body.buffer_time ?? 15,
    });

    if (!calEvent) {
      console.warn('⚠️ Cal.com event creation failed — continuing without it');
    }

    // ── STEP 2: Create OmniDimensions agent WITH the Cal.com tool ──
    console.log(`🤖 Creating OmniDimensions agent for ${slug}...`);
    let vapiAssistantId: string | undefined;
    try {
      const assistant = await vapi.createAssistant({
        name: body.business_name,
        instructions: body.voice_instructions,
        calEventId: calEvent?.eventTypeId,   // ✅ Pass numeric ID — tool auto-attached
      });
      vapiAssistantId = assistant.assistantId;
    } catch (error: any) {
      console.error('OmniDimensions agent creation error:', error);
      return NextResponse.json(
        { error: `Agent creation failed: ${error.message}` },
        { status: 500 }
      );
    }

    // ── STEP 3: Insert client into Supabase with all IDs ──
    const planStartDate = new Date();
    const nextResetDate = new Date(planStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        business_name: body.business_name,
        slug,
        phone: body.phone || null,
        email: body.email || null,
        hours: body.hours || null,
        services: body.services || null,
        price_ranges: body.price_ranges || null,
        service_area: body.service_area || null,
        website_contact_form_url: body.website_contact_form_url || null,
        review_business_name: body.review_business_name || null,
        google_review_link: body.google_review_link || null,
        delivery_address: body.delivery_address || null,
        access_code_hash: accessCodeHash,
        voice_instructions: body.voice_instructions,
        vapi_assistant_id: vapiAssistantId,
        webhook_secret: webhookSecret,
        webhook_url: webhookUrl,
        outbound_calling_enabled: body.outbound_calling_enabled || false,
        consent_confirmed: body.consent_confirmed || false,
        manager_access_granted: body.manager_access_granted || false,
        call_minute_limit: body.call_minute_limit || 500,
        call_priority: body.call_priority || 'standard',
        minutes_used: 0,
        plan_start_date: planStartDate.toISOString(),
        next_reset_date: nextResetDate.toISOString(),
        last_reset_date: planStartDate.toISOString(),
        working_hours_start: body.working_hours_start || '09:00',
        working_hours_end: body.working_hours_end || '17:00',
        working_days: body.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timezone: body.timezone || 'America/New_York',
        day_times: body.day_times || {},
        buffer_time: body.buffer_time ?? 15,
        cal_event_id: calEvent?.eventTypeId || null,
        cal_event_slug: calEvent?.slug || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `DB insert failed: ${error.message}` }, { status: 500 });
    }

    // ── STEP 4: Create sheet tab + welcome email ──
    try {
      await createTab(slug);
    } catch (e: any) {
      console.error(`⚠️ Sheet creation warning: ${e.message}`);
    }

    if (client.email) {
      try {
        await email.sendWelcome(client.email, client.business_name, accessCode);
      } catch (e: any) {
        console.error('Email sending error:', e);
      }
    }

    return NextResponse.json({ client, accessCode, webhookUrl }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error in client creation:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}