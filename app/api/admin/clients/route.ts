import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateSlug, generateAccessCode, generateWebhookSecret } from '@/lib/utils/helpers';
import { vapi } from '@/lib/vapi/client';
import { generateQRImages } from '@/lib/qr/generate';
import { uploadQRImages } from '@/lib/supabase/storage';
import { createTab } from '@/lib/sheets';
import { email } from '@/lib/email/resend';
import bcrypt from 'bcryptjs';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('clients').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Required fields
  if (!body.business_name || !body.voice_instructions) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const slug = generateSlug(body.business_name);
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
    return NextResponse.json({ error: `Vapi assistant creation failed: ${error.message}` }, { status: 500 });
  }

  // 2. Insert client record (without QR URLs yet)
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

  // 3. Generate QR codes
  const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${slug}`;
  const qrBuffers = await generateQRImages(redirectUrl);
  const qrUrls = await uploadQRImages(slug, qrBuffers);

  // Update client with QR URLs
  await supabaseAdmin
    .from('clients')
    .update({
      qr_main_url: qrUrls.main,
      qr_wallpaper_url: qrUrls.wallpaper,
      qr_sticker_url: qrUrls.sticker,
    })
    .eq('id', client.id);

  // 4. Create Google Sheet tab
  await createTab(slug);

  // 5. Send welcome email
  if (client.email) {
    await email.sendWelcome(client.email, client.business_name, accessCode);
  }

  // Return full client data and access code (plain)
  return NextResponse.json({
    client,
    accessCode,
    webhookUrl,
    qrUrls,
  }, { status: 201 });
}
