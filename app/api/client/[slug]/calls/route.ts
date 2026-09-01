import { NextRequest, NextResponse } from 'next/server';
import { getRows, updateRow, deleteRow } from '@/lib/sheets';
import { email } from '@/lib/email/resend';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

// GET: fetch all calls for this client
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get('client_session')?.value;
  if (!sessionSlug || sessionSlug !== params.slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await getRows(params.slug);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: update a call log (all fields)
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get('client_session')?.value;
  if (!sessionSlug || sessionSlug !== params.slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      rowNumber,
      customer_name,
      customer_phone,
      summary,
      status,
      booked_time,
      address,
    } = body;

    // Validate required fields
    if (!rowNumber || !customer_name || !customer_phone || !summary || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_phone, summary, status' },
        { status: 400 }
      );
    }

    // Fetch existing row
    const rows = await getRows(params.slug);
    const row = rows.find((r: any) => r._row === rowNumber);
    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }

    // Build updated row (preserve immutable fields: timestamp, call_type, recording_url, call_id)
    const updatedRow = [
      row.client_slug,
      row.timestamp,
      row.call_type,
      customer_name,
      customer_phone,
      summary,
      status,
      booked_time || '',
      row.recording_url || '',
      row.call_id || '',
      address || '',
    ];

    await updateRow(params.slug, rowNumber, updatedRow);

    // Send email notification
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, business_name')
      .eq('slug', params.slug)
      .single();

    if (client?.email) {
      await email.sendCallUpdate(
        client.email,
        client.business_name,
        { ...row, customer_name, customer_phone, summary, status, booked_time, address },
        'updated'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

// DELETE: soft delete a call log
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get('client_session')?.value;
  if (!sessionSlug || sessionSlug !== params.slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rowNumber = parseInt(searchParams.get('row') || '');
  if (!rowNumber) {
    return NextResponse.json({ error: 'Missing row number' }, { status: 400 });
  }

  try {
    const rows = await getRows(params.slug);
    const row = rows.find((r: any) => r._row === rowNumber);
    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }

    await deleteRow(params.slug, rowNumber);

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, business_name')
      .eq('slug', params.slug)
      .single();

    if (client?.email) {
      await email.sendCallUpdate(
        client.email,
        client.business_name,
        row,
        'deleted'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}