'use client';

import { useState, useMemo, useEffect } from 'react';
import QRDisplay from './QRDisplay';
import { Phone, Calendar, Star, Clock, Download, X, Filter, Copy, Edit, Trash2 } from 'lucide-react';

interface CallLog {
  _row: number;
  client_slug: string;
  timestamp: string;
  call_type: string;
  customer_name: string;
  customer_phone: string;
  summary: string;
  status: string;
  booked_time?: string;
  recording_url?: string;
  call_id?: string;
  address?: string;
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

const statusColors: Record<string, string> = {
  'Booked': 'bg-[#34A853]/10 text-[#34A853]',
  'Emergency': 'bg-[#EA4335]/20 text-[#EA4335]',
  'General Inquiry': 'bg-[#4285F4]/10 text-[#4285F4]',
  'Rate Limited': 'bg-[#EA4335]/10 text-[#EA4335]',
  'New Patient': 'bg-[#FBBC05]/20 text-[#FBBC05]',
  'Follow-up': 'bg-[#8B5CF6]/20 text-[#8B5CF6]',
  'No Answer': 'bg-gray-200 text-gray-600',
  'Voicemail': 'bg-gray-200 text-gray-600',
  'default': 'bg-gray-100 text-gray-600',
};

export default function ClientDashboardClient({
  client,
  initialCalls,
  totalCalls,
  bookings,
}: {
  client: Client;
  initialCalls: CallLog[];
  totalCalls: number;
  bookings: number;
}) {
  const [calls, setCalls] = useState<CallLog[]>(initialCalls);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<CallLog | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    summary: '',
    status: '',
    booked_time: '',
    address: '',
  });

  // Refresh calls from API – with credentials
  const refreshCalls = async () => {
    const res = await fetch(`/api/client/${client.slug}/calls`, {
      credentials: 'include', // ✅ sends cookies
    });
    if (res.ok) {
      const data = await res.json();
      setCalls(data);
    }
  };

  // Sync with props if initialCalls changes
  useEffect(() => {
    setCalls(initialCalls);
  }, [initialCalls]);

  // Unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    calls.forEach((call) => {
      if (call.status) statusSet.add(call.status);
    });
    return Array.from(statusSet).sort();
  }, [calls]);

  // Deduplicate calls
  const dedupedCalls = useMemo(() => {
    const seen = new Set<string>();
    return calls.filter((call) => {
      let key = call.call_id;
      if (!key) {
        const date = new Date(call.timestamp);
        const rounded = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
        key = `${rounded.toISOString()}_${call.customer_phone}`;
      }
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [calls]);

  // Apply filters
  const filteredCalls = useMemo(() => {
    return dedupedCalls.filter((call) => {
      const matchType = typeFilter === 'all' || call.call_type === typeFilter;
      const matchStatus = statusFilter === 'all' || call.status === statusFilter;
      const callDate = new Date(call.timestamp).toISOString().split('T')[0];
      const matchFrom = !dateFrom || callDate >= dateFrom;
      const matchTo = !dateTo || callDate <= dateTo;
      return matchType && matchStatus && matchFrom && matchTo;
    });
  }, [dedupedCalls, typeFilter, statusFilter, dateFrom, dateTo]);

  // CSV Export
  const exportCSV = () => {
    if (filteredCalls.length === 0) {
      alert('No calls to export with current filters.');
      return;
    }
    const headers = ['Time', 'Type', 'Customer', 'Phone', 'Summary', 'Status', 'Booked Time', 'Recording URL', 'Address'];
    const rows = filteredCalls.map((call) => [
      new Date(call.timestamp).toLocaleString(),
      call.call_type,
      call.customer_name,
      call.customer_phone,
      call.summary,
      call.status,
      call.booked_time || '',
      call.recording_url || '',
      call.address || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'calls_export.csv';
    link.click();
  };

  // Edit handlers
  const handleEdit = (call: CallLog) => {
    setEditingCall(call);
    // Convert booked_time to datetime-local format if it's a valid ISO string
    let bookedTime = call.booked_time || '';
    if (bookedTime && !isNaN(Date.parse(bookedTime))) {
      const d = new Date(bookedTime);
      bookedTime = d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    }
    setEditForm({
      customer_name: call.customer_name,
      customer_phone: call.customer_phone,
      summary: call.summary,
      status: call.status,
      booked_time: bookedTime,
      address: call.address || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCall) return;
    const res = await fetch(`/api/client/${client.slug}/calls`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ sends cookies
      body: JSON.stringify({
        rowNumber: editingCall._row,
        ...editForm,
      }),
    });
    if (res.ok) {
      await refreshCalls();
      setEditModalOpen(false);
      setEditingCall(null);
    } else {
      alert('Failed to update call.');
    }
  };

  const handleDelete = async (rowNumber: number) => {
    if (!confirm('Are you sure you want to delete this call entry?')) return;
    const res = await fetch(`/api/client/${client.slug}/calls?row=${rowNumber}`, {
      method: 'DELETE',
      credentials: 'include', // ✅ sends cookies
    });
    if (res.ok) {
      await refreshCalls();
    } else {
      alert('Failed to delete call.');
    }
  };

  const GooglePill = () => (
    <span
      className="w-1.5 h-6 rounded-full inline-block"
      style={{ background: 'linear-gradient(180deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)' }}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
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
        <div className="bg-white border-l-4 rounded-xl p-4 mb-8 text-sm text-gray-700 shadow-sm flex items-center justify-between flex-wrap gap-2" style={{ borderLeftColor: '#4285F4' }}>
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

        {/* QR Code Trigger & Webhook URL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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

        {/* Call Log */}
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
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
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
                  <th className="px-6 py-4 text-left">Booked Time</th>
                  <th className="px-6 py-4 text-left">Recording</th>
                  <th className="px-6 py-4 text-left">Address</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                      No calls match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call, idx) => {
                    const statusColor = statusColors[call.status] || statusColors['default'];
                    return (
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
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${statusColor}`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {call.booked_time || '—'}
                        </td>
                        <td className="px-6 py-4">
                          {call.recording_url ? (
                            <a
                              href={call.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#4285F4] hover:underline text-xs font-medium"
                            >
                              Listen
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={call.address}>
                          {call.address || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(call)}
                              className="text-indigo-600 hover:text-indigo-800 transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(call._row)}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsQRModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative border border-white/20 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="absolute -top-3 -right-3 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 shadow-lg transition-colors z-10 border border-gray-200"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center justify-center">
              <QRDisplay client={client} />
            </div>
            <div className="mt-4 text-center text-xs text-gray-400">
              Scan or download your QR code
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-white/20 animate-scaleUp">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute -top-3 -right-3 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 shadow-lg transition-colors z-10 border border-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4">Edit Call Log</h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                <input
                  type="text"
                  value={editForm.customer_phone}
                  onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <input
                  type="text"
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                >
                  <option value="Booked">Booked</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Rate Limited">Rate Limited</option>
                  <option value="Emergency">Emergency</option>
                  <option value="New Patient">New Patient</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Voicemail">Voicemail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Booked Time</label>
                <input
                  type="datetime-local"
                  value={editForm.booked_time}
                  onChange={(e) => setEditForm({ ...editForm, booked_time: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full bg-[#4285F4] text-white py-2.5 rounded-lg hover:bg-[#3367D6] transition shadow-sm"
              >
                Save Changes
              </button>
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