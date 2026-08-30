'use client';

import { useState, useMemo } from 'react';
import QRDisplay from './QRDisplay';
import { Phone, Calendar, Star, Clock, Download, X, Filter, Copy } from 'lucide-react';

interface CallLog {
  client_slug: string;
  timestamp: string;
  call_type: string;
  customer_name: string;
  customer_phone: string;
  summary: string;
  status: string;
  booked_time?: string;
  recording_url?: string;
}

interface Client {
  id: string;
  business_name: string;
  slug: string;
  delivery_address?: string;
  google_review_link?: string;
  webhook_url: string;
  qr_title?: string;
  qr_subtitle?: string;
  qr_tagline?: string;
}

export default function ClientDashboardClient({
  client,
  calls,
  totalCalls,
  bookings,
}: {
  client: Client;
  calls: CallLog[];
  totalCalls: number;
  bookings: number;
}) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filter calls
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const matchType = typeFilter === 'all' || call.call_type === typeFilter;
      const matchStatus = statusFilter === 'all' || call.status === statusFilter;
      const callDate = new Date(call.timestamp).toISOString().split('T')[0];
      const matchFrom = !dateFrom || callDate >= dateFrom;
      const matchTo = !dateTo || callDate <= dateTo;
      return matchType && matchStatus && matchFrom && matchTo;
    });
  }, [calls, typeFilter, statusFilter, dateFrom, dateTo]);

  // CSV Export
  const exportCSV = () => {
    if (filteredCalls.length === 0) {
      alert('No calls to export with current filters.');
      return;
    }
    const headers = ['Time', 'Type', 'Customer', 'Phone', 'Summary', 'Status'];
    const rows = filteredCalls.map((call) => [
      new Date(call.timestamp).toLocaleString(),
      call.call_type,
      call.customer_name,
      call.customer_phone,
      call.summary,
      call.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'calls_export.csv';
    link.click();
  };

  // Reusable Multi-Color Accent Pill
  const GooglePill = () => (
    <span 
      className="w-1.5 h-6 rounded-full" 
      style={{ background: 'linear-gradient(180deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)' }}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header with multi-color accent strip */}
      <header className="bg-white shadow-sm relative">
        <div 
          className="absolute top-0 left-0 w-full h-1" 
          style={{ background: 'linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC05 50%, #FBBC05 75%, #34A853 75%, #34A853 100%)' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome, {client.business_name}</h1>
              <p className="text-gray-500 text-sm mt-1">Your AI receptionist dashboard</p>
            </div>
            <div className="mt-3 md:mt-0 text-sm text-gray-400 flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              <Clock className="w-4 h-4 text-[#4285F4]" />
              <span>Updated {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NFC Banner */}
        <div className="bg-white border-l-4 rounded-xl p-4 mb-8 text-sm text-gray-700 shadow-sm flex items-center justify-between flex-wrap gap-2 transition hover:shadow-md" style={{ borderLeftColor: '#4285F4' }}>
          <span className="flex items-center gap-2">
            <span className="text-lg">📦</span> 
            <span><strong>NFC card</strong> will be delivered to your provided address:</span>
            <span className="font-mono bg-gray-50 text-[#4285F4] px-2 py-0.5 rounded border border-gray-200 ml-1">
              {client.delivery_address || 'Not provided'}
            </span>
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-5 group">
            <div className="p-4 rounded-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(66, 133, 244, 0.1)' }}>
              <Phone className="w-7 h-7" style={{ color: '#4285F4' }} />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Total Calls</div>
              <div className="text-3xl font-bold text-gray-900 leading-none">{totalCalls}</div>
              <div className="text-xs text-gray-400 mt-1">this week</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-5 group">
            <div className="p-4 rounded-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(52, 168, 83, 0.1)' }}>
              <Calendar className="w-7 h-7" style={{ color: '#34A853' }} />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Bookings</div>
              <div className="text-3xl font-bold text-gray-900 leading-none">{bookings}</div>
              <div className="text-xs text-gray-400 mt-1">confirmed</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-5 group">
            <div className="p-4 rounded-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(251, 188, 5, 0.15)' }}>
              <Star className="w-7 h-7" style={{ color: '#FBBC05' }} />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Review Replies</div>
              <div className="text-3xl font-bold text-gray-900 leading-none">0</div>
              <div className="text-xs text-gray-400 mt-1">auto‑responded</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* QR Code Trigger */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <GooglePill />
              Google Review Card
            </h3>
            <p className="text-sm text-gray-500 mb-6">Preview and download your custom NFC & QR code design.</p>
            <button
              onClick={() => setIsQRModalOpen(true)}
              style={{ backgroundColor: '#4285F4' }}
              className="inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-medium shadow-md hover:opacity-90 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <span className="text-xl">📱</span> View QR Card
            </button>
          </div>

          {/* Webhook URL */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col justify-center">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <GooglePill />
              Your Webhook URL
            </h3>
            <p className="text-sm text-gray-500 mb-4">Paste this URL into your website contact form to receive leads instantly.</p>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex-1 text-sm break-all font-mono text-gray-600 shadow-inner">
                {client.webhook_url}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(client.webhook_url);
                  alert('Copied to clipboard!');
                }}
                className="bg-gray-900 text-white p-3 rounded-xl hover:bg-gray-800 transition shadow-sm flex items-center gap-2"
                title="Copy Webhook"
              >
                <Copy className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Call Log with Filters */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <GooglePill />
              Recent Calls
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                <Filter className="w-4 h-4 text-gray-400 ml-2" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm bg-transparent border-none focus:ring-0 text-gray-600 cursor-pointer outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-600 focus:ring-2 focus:ring-[#4285F4] outline-none transition"
              >
                <option value="all">All Status</option>
                <option value="Booked">Booked</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="No Answer">No Answer</option>
                <option value="Rate Limited">Rate Limited</option>
              </select>

              <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-lg px-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm bg-transparent border-none py-2 text-gray-600 focus:ring-0 outline-none"
                />
                <span className="text-gray-300">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm bg-transparent border-none py-2 text-gray-600 focus:ring-0 outline-none"
                />
              </div>

              <button
                onClick={exportCSV}
                style={{ backgroundColor: '#34A853' }}
                className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Time</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Customer</th>
                  <th className="px-6 py-4 text-left">Summary</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                      No calls match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                        {new Date(call.timestamp).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          call.call_type === 'inbound' 
                            ? 'bg-[#4285F4]/10 text-[#4285F4]' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {call.call_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{call.customer_name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{call.customer_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={call.summary}>
                        {call.summary}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                          call.status === 'Booked' ? 'bg-[#34A853]/10 text-[#34A853]' :
                          call.status === 'Rate Limited' ? 'bg-[#EA4335]/10 text-[#EA4335]' :
                          call.status === 'General Inquiry' ? 'bg-[#4285F4]/10 text-[#4285F4]' :
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

        {/* Footer */}
        <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 pt-4 gap-2">
          <span>&copy; {new Date().getFullYear()} Alpha AI – Your trusted AI receptionist.</span>
          <span className="flex items-center space-x-1">
            <span>Powered by</span>
            <span className="font-semibold text-gray-500">Alpha AI</span>
            <span style={{ color: '#4285F4' }}>α</span>
          </span>
        </footer>
      </main>

      {/* QR Modal */}
      {isQRModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsQRModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative border border-white/20 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="absolute -top-3 -right-3 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-full p-2 shadow-md transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <QRDisplay client={client} />
            <div className="mt-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              Scan or download your QR code
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}