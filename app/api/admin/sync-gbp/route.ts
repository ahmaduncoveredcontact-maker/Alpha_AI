import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  // 1. Simulate a 1.5-second network delay to mimic Google's API
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 2. Generate fake Google IDs for testing
  const fakeAccountId = 'mock_account_987654321';
  const fakeLocationId = 'mock_location_123456789';

  // 3. Save the fake IDs to Supabase
  const { error } = await supabaseAdmin
    .from('clients')
    .update({
      gbp_account_id: fakeAccountId,
      gbp_location_id: fakeLocationId,
    })
    .eq('slug', slug);

  if (error) {
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }

  // 4. Return success response to the frontend
  return NextResponse.json({
    accountId: fakeAccountId,
    locationId: fakeLocationId,
    accountName: 'Alpha AI Test Business',
    locationName: 'Developer Mock Location',
  });
}