import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers'; // ✅ ADD THIS
import { redirect, notFound } from 'next/navigation';
import { getWeekRange } from '@/lib/utils/dateHelpers';
import { ThemeProvider } from '@/components/client/ThemeContext';
import ClientDashboardClient from '@/components/client/ClientDashboardClient';

export default async function ClientDashboardPage({ params }: { params: { slug: string } }) {
  // ✅ Check client session cookie
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get('client_session')?.value;
  if (!sessionSlug || sessionSlug !== params.slug) {
    redirect(`/live/${params.slug}/login`);
  }

  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !client) {
    notFound();
  }

  const { getRows } = await import('@/lib/sheets');
  let calls: any[] = [];
  try {
    calls = await getRows(client.slug);
  } catch (err) {
    console.error('Failed to fetch calls:', err);
  }

  const { start, end } = getWeekRange();
  const weekCalls = calls.filter((c: any) => {
    const date = new Date(c.timestamp);
    return date >= start && date <= end;
  });
  const totalCalls = weekCalls.length;
  const bookings = weekCalls.filter((c: any) => c.booked_time && c.booked_time !== '').length;

  return (
    <ThemeProvider>
      <ClientDashboardClient
        client={client}
        initialCalls={calls}
        totalCalls={totalCalls}
        bookings={bookings}
      />
    </ThemeProvider>
  );
}