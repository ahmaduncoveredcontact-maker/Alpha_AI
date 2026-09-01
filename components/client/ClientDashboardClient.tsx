'use client';

import { useState, useMemo, useEffect } from 'react';
import QRDisplay from './QRDisplay';
import { Phone, Calendar, Star, Clock, Download, X, Filter, Copy, Edit, Trash2 } from 'lucide-react';

interface CallLog {
  _row: number; // NEW: row number for edit/delete
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
  const [editSummary, setEditSummary] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Refresh calls from API
  const refreshCalls = async () => {
    const res = await fetch(`/api/client/${client.slug}/calls`);
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

  // CSV Export (unchanged)
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
    setEditSummary(call.summary);
    setEditStatus(call.status);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCall) return;
    const res = await fetch(`/api/client/${client.slug}/calls`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rowNumber: editingCall._row,
        summary: editSummary,
        status: editStatus,
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
      {/* Header and other content unchanged... (keep as is) */}
      {/* I'll only show the changed parts for brevity, but you can copy the full file from the previous version and insert the Edit/Delete logic */}

      {/* Inside the table: add Actions column */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <GooglePill />
            Recent Calls
          </h2>
          {/* filters & export... keep as is */}
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
                <th className="px-6 py-4 text-left">Actions</th> {/* NEW */}
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
                      {/* ... existing columns ... */}
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
                      {/* NEW Actions column */}
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
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

      {/* Footer, QR modal, etc. unchanged */}
      {/* ... rest of the component ... */}
    </div>
  );
}