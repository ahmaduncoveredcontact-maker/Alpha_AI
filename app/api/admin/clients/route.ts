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

    // 1. Create Vapi assistant
    let vapiAssistantId: string | undefined;
    try {
      const assistant = await vapi.createAssistant({
        name: body.business_name,
        instructions: body.voice_instructions,
        calendarLink: body.calendar_link,
      });
      vapiAssistantId = assistant.assistantId;
    } catch (error: any) {
      console.error('Vapi assistant creation error:', error);
      return NextResponse.json({ error: `Vapi assistant creation failed: ${error.message || 'Unknown error'}` }, { status: 500 });
    }

    // 2. Insert client record
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
        calendar_link: body.calendar_link || null,
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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `DB insert failed: ${error.message}` }, { status: 500 });
    }

    // 3. Create Google Sheet tab (if it fails, log but don't fail onboarding)
    try {
      await createTab(slug);
      console.log(`✅ Sheet tab created for ${slug}`);
    } catch (error: any) {
      console.error(`⚠️ Sheet creation warning for ${slug}:`, error.message);
    }

    // 4. Send welcome email
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