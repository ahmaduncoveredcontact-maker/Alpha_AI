'use client';

import { useState, useMemo } from 'react';
import QRDisplay from './QRDisplay';
import { Phone, Calendar, Star, Clock, Download, X, Filter } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {client.business_name}</h1>
              <p className="text-indigo-200 text-sm mt-1">Your AI receptionist dashboard</p>
            </div>
            <div className="mt-3 md:mt-0 text-sm text-indigo-200 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Updated {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NFC Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-700 shadow-sm flex items-center justify-between flex-wrap gap-2">
          <span>
            📦 <strong>NFC card</strong> will be delivered to your provided address:
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 ml-1">
              {client.delivery_address || 'Not provided'}
            </span>
          </span>
          <span className="text-xs text-blue-400">Track delivery status</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-4 group">
            <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Total Calls</div>
              <div className="text-3xl font-bold text-gray-800">{totalCalls}</div>
              <div className="text-xs text-gray-400">this week</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-4 group">
            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Bookings</div>
              <div className="text-3xl font-bold text-gray-800">{bookings}</div>
              <div className="text-xs text-gray-400">confirmed</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 flex items-center space-x-4 group">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Review Replies</div>
              <div className="text-3xl font-bold text-gray-800">0</div>
              <div className="text-xs text-gray-400">auto‑responded</div>
            </div>
          </div>
        </div>

        {/* QR Code Button */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100 text-center">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <span className="text-2xl">📱</span> Get Your QR Code
          </button>
          <p className="text-xs text-gray-400 mt-2">Click to view and download your review QR</p>
        </div>

        {/* Webhook URL */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-2">Your Webhook URL</h3>
            <p className="text-sm text-gray-500 mb-2">Paste this URL into your website contact form to receive leads instantly.</p>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-50 border border-gray-200 p-2 rounded-lg flex-1 text-sm break-all font-mono">
                {client.webhook_url}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(client.webhook_url);
                  alert('Copied!');
                }}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-gray-800 transition"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Call Log with Filters */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Recent Calls</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="Booked">Booked</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="No Answer">No Answer</option>
                <option value="Rate Limited">Rate Limited</option>
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500"
                placeholder="From"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500"
                placeholder="To"
              />
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm px-4 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
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
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No calls match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call, idx) => (
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
        </div>

        {/* Footer */}
        <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 border-t border-gray-200 pt-4 gap-2">
          <span>&copy; {new Date().getFullYear()} Alpha AI – Your trusted AI receptionist.</span>
          <span className="flex items-center space-x-1">
            <span>Powered by</span>
            <span className="font-semibold text-gray-500">Alpha AI</span>
            <span className="text-gray-300">α</span>
          </span>
        </footer>
      </main>

     {/* QR Modal */}
{isQRModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    onClick={(e) => {
      // Close if the backdrop itself is clicked (not the modal card)
      if (e.target === e.currentTarget) setIsQRModalOpen(false);
    }}
  >
    <div
      className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative border border-white/20 animate-scaleUp"
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
      <button
        onClick={() => setIsQRModalOpen(false)}
        className="absolute -top-3 -right-3 bg-gray-800 text-white rounded-full p-1.5 shadow-lg hover:bg-gray-700 transition-colors z-10"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
      <QRDisplay client={client} />
      <div className="mt-4 text-center text-xs text-gray-400">
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
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}