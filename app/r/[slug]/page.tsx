import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

export default async function QRRedirectPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from('clients')
    .select('google_review_link')
    .eq('slug', params.slug)
    .single();

  if (error || !client || !client.google_review_link) {
    notFound();
  }

  redirect(client.google_review_link);
}
