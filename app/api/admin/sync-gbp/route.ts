import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { gbp } from '@/lib/reviews/gbp';

export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const accounts = await gbp.listAccounts();
  if (!accounts.length) {
    return NextResponse.json({ error: 'No GBP accounts found for this service account' }, { status: 404 });
  }

  const account = accounts[0];
  const accountId = account.name?.split('/').pop() || account.accountId || '';
  if (!accountId) {
    return NextResponse.json({ error: 'Could not extract account ID' }, { status: 500 });
  }

  const locations = await gbp.listLocations(accountId);
  if (!locations.length) {
    return NextResponse.json({ error: 'No locations found for this account' }, { status: 404 });
  }

  const location = locations[0];
  const locationId = location.name?.split('/').pop() || location.locationId || '';
  if (!locationId) {
    return NextResponse.json({ error: 'Could not extract location ID' }, { status: 500 });
  }

  await supabaseAdmin
    .from('clients')
    .update({
      gbp_account_id: accountId,
      gbp_location_id: locationId,
    })
    .eq('id', client.id);

  return NextResponse.json({
    accountId,
    locationId,
    accountName: account.accountName || account.name || '',
    locationName: location.title || location.name || '',
  });
}