import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateWebhookSecret } from '@/lib/utils/helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const newSecret = generateWebhookSecret();
  const newUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/lead/${newSecret}`;
  const { data, error } = await supabaseAdmin
    .from('clients')
    .update({ webhook_secret: newSecret, webhook_url: newUrl })
    .eq('slug', params.slug)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ webhook_url: newUrl });
}
