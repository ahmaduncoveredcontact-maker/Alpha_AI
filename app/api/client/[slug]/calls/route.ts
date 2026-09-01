export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // ... auth check ...

  const body = await req.json();
  const { rowNumber, customer_name, customer_phone, summary, status, booked_time, address } = body;
  if (!rowNumber || !customer_name || !customer_phone || !summary || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const rows = await getRows(params.slug);
    const row = rows.find((r: any) => r._row === rowNumber);
    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }

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

    // ... send email ...
    // ... return success ...
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}