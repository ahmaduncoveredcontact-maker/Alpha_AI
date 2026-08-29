import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { slug, code } = await req.json();
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from('clients')
    .select('access_code_hash, slug')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const isValid = await bcrypt.compare(code, client.access_code_hash);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  // Set cookie with path '/' and proper attributes
  response.cookies.set('client_session', slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
  });

  return response;
}