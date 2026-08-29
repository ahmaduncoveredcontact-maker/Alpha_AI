import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import QRDisplay from '@/components/client/QRDisplay';
import WebhookUrlDisplay from '@/components/client/WebhookUrlDisplay';
import { getWeekRange } from '@/lib/utils/dateHelpers';

export default async function ClientDashboardPage({ params }: { params: { slug: string } }) {
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
  let calls = [];
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
  const bookings = weekCalls.filter((c: any) => c.status === 'Booked').length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Welcome, {client.business_name}</h1>
      <p className="text-gray-600 mb-8">Your AI receptionist dashboard</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow p-4 rounded">
          <div className="text-sm text-gray-500">Total Calls (this week)</div>
          <div className="text-2xl font-bold">{totalCalls}</div>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <div className="text-sm text-gray-500">Bookings</div>
          <div className="text-2xl font-bold">{bookings}</div>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <div className="text-sm text-gray-500">Review Replies</div>
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>

      <QRDisplay client={client} />

      <div className="mt-8">
        <WebhookUrlDisplay webhookUrl={client.webhook_url} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
        <div className="bg-white shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Summary</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No calls yet.
                  </td>
                </tr>
              ) : (
                calls.map((call: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{new Date(call.timestamp).toLocaleString()}</td>
                    <td className="p-2">{call.call_type}</td>
                    <td className="p-2">{call.customer_name} ({call.customer_phone})</td>
                    <td className="p-2">{call.summary}</td>
                    <td className="p-2">{call.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
