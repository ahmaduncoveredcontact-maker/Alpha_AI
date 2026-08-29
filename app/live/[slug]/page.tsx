import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import QRDisplay from '@/components/client/QRDisplay';
import WebhookUrlDisplay from '@/components/client/WebhookUrlDisplay';
import { getWeekRange } from '@/lib/utils/dateHelpers';
import { Phone, Calendar, Star, Clock } from 'lucide-react';

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

  // Last updated time
  const lastUpdated = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {client.business_name}</h1>
              <p className="text-gray-300 text-sm mt-1">Your AI receptionist dashboard</p>
            </div>
            <div className="mt-3 md:mt-0 text-sm text-gray-300 flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Updated {lastUpdated}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NFC Notification Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-700 shadow-sm flex items-center justify-between flex-wrap gap-2">
          <span>
            📦 <strong>NFC card</strong> will be delivered to your provided address:
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 ml-1">
              {client.delivery_address || 'Not provided'}
            </span>
          </span>
          <span className="text-xs text-blue-400">&#8226; Track delivery status</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-4 group">
            <div className="p-3 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
              <Phone className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Total Calls</div>
              <div className="text-3xl font-bold text-gray-800">{totalCalls}</div>
              <div className="text-xs text-gray-400">this week</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-4 group">
            <div className="p-3 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Bookings</div>
              <div className="text-3xl font-bold text-gray-800">{bookings}</div>
              <div className="text-xs text-gray-400">confirmed appointments</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-4 group">
            <div className="p-3 bg-amber-50 rounded-full group-hover:bg-amber-100 transition-colors">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Review Replies</div>
              <div className="text-3xl font-bold text-gray-800">0</div>
              <div className="text-xs text-gray-400">auto‑responded</div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <section className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">QR Code</h2>
            <span className="text-xs text-gray-400">Scan to leave a review</span>
          </div>
          <div className="flex justify-center">
            <QRDisplay client={client} />
          </div>
        </section>

        {/* Webhook URL Section */}
        <section className="mb-8">
          <WebhookUrlDisplay webhookUrl={client.webhook_url} />
        </section>

        {/* Call Log Section */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Recent Calls</h2>
            <span className="text-xs text-gray-400">{calls.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3 text-left">Time</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Summary</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No calls yet – your AI receptionist is waiting for the first one!</td>
                  </tr>
                ) : (
                  calls.map((call: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                        {new Date(call.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 capitalize">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          call.call_type === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {call.call_type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {call.customer_name}
                        <span className="text-gray-400 text-xs block">{call.customer_phone}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{call.summary}</td>
                      <td className="px-6 py-3">
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
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          &copy; {new Date().getFullYear()} Alpha AI – Your trusted AI receptionist.
        </footer>
      </main>
    </div>
  );
}