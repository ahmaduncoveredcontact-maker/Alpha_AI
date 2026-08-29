import { supabaseAdmin } from '@/lib/supabase/admin';
import { gbp } from '@/lib/reviews/gbp';
import { queue } from '@/lib/qstash/client';

const QSTASH_REPLY_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/qstash/review-reply`;

export async function processNewReviews() {
  const { data: clients, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .not('gbp_account_id', 'is', null)
    .not('gbp_location_id', 'is', null)
    .eq('manager_access_granted', true);

  if (error) {
    console.error('Error fetching clients for review check:', error);
    return;
  }

  for (const client of clients) {
    try {
      const lastChecked = client.last_checked_at || new Date(0).toISOString();
      const reviews = await gbp.getNewReviews(client.gbp_account_id, client.gbp_location_id, lastChecked);

      for (const review of reviews) {
        await queue.enqueue(QSTASH_REPLY_URL, {
          accountId: client.gbp_account_id,
          locationId: client.gbp_location_id,
          reviewId: review.reviewId,
          reviewText: review.comment || '',
          businessName: client.business_name,
          clientSlug: client.slug,
        });
      }

      await supabaseAdmin
        .from('clients')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', client.id);

    } catch (err) {
      console.error(`Error processing reviews for client ${client.slug}:`, err);
    }
  }
}
