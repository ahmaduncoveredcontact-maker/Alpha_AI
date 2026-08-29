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
  const bookings = weekCalls.filter((c: any) => c.status === 'Booked').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {client.business_name}</h1>
          <p className="text-gray-500">Your AI receptionist dashboard</p>
        </div>

        {/* NFC Notification Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8 text-center text-sm text-blue-700 shadow-sm">
          📦 <strong>NFC card</strong> will be delivered to your provided address: <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200">{client.delivery_address || 'Not provided'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white shadow-md rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500">Total Calls (this week)</div>
            <div className="text-3xl font-bold text-gray-800">{totalCalls}</div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500">Bookings</div>
            <div className="text-3xl font-bold text-gray-800">{bookings}</div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500">Review Replies</div>
            <div className="text-3xl font-bold text-gray-800">0</div>
          </div>
        </div>

        <div className="mb-8">
          <QRDisplay client={client} />
        </div>

        <div className="mb-8">
          <WebhookUrlDisplay webhookUrl={client.webhook_url} />
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Calls</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Time</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Customer</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Summary</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No calls yet.</td>
                  </tr>
                ) : (
                  calls.map((call: any, idx: number) => (
                    <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">{new Date(call.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3">{call.call_type}</td>
                      <td className="px-4 py-3">{call.customer_name} ({call.customer_phone})</td>
                      <td className="px-4 py-3">{call.summary}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          call.status === 'Booked' ? 'bg-green-100 text-green-700' :
                          call.status === 'Rate Limited' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}