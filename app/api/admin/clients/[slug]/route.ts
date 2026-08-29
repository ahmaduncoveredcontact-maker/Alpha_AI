import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('slug', params.slug)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await req.json();
  // Allow all fields from the form (including qr_title, qr_subtitle, qr_tagline)
  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(body)
    .eq('slug', params.slug)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('slug', params.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}