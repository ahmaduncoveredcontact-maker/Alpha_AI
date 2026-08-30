import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { newAccessCode } = await req.json();
    if (!newAccessCode || newAccessCode.length < 4) {
      return NextResponse.json(
        { error: 'New access code must be at least 4 characters.' },
        { status: 400 }
      );
    }

    // Hash the new code
    const hashed = await bcrypt.hash(newAccessCode, 10);

    // Update the client's access_code_hash
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update({ access_code_hash: hashed })
      .eq('slug', params.slug)
      .select('id, business_name, slug')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Access code for "${data.business_name}" has been reset.`,
      newAccessCode,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}