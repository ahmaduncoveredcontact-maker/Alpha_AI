'use client';

import { useState, useMemo } from 'react';
import { Search, Download, Edit, Trash2, ExternalLink, X } from 'lucide-react';

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
  address?: string;
  call_id?: string; // ✅ ADDED
}

export default function CallLogPage({
  calls,
  onEdit,
  onDelete,
}: {
  calls: CallLog[];
  onEdit: (call: CallLog) => void;
  onDelete: (row: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const matchSearch = call.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                          call.customer_phone.includes(search) ||
                          call.summary.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || call.call_type === typeFilter;
      const matchStatus = statusFilter === 'all' || call.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [calls, search, typeFilter, statusFilter]);

  const statusColors: Record<string, string> = {
    'Booked': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'Emergency': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    'General Inquiry': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'Rate Limited': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    'No Answer': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    'Completed': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'default': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };

  const handleRowClick = (call: CallLog) => {
    setSelectedCall(call);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, call: CallLog) => {
    e.stopPropagation();
    onEdit(call);
  };

  const handleDeleteClick = (e: React.MouseEvent, rowNumber: number) => {
    e.stopPropagation();
    onDelete(rowNumber);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Call Log</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click any row to view full details
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#4285F4] outline-none"
            />
          </div>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#4285F4] outline-none"
        >
          <option value="all">All Types</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#4285F4] outline-none"
        >
          <option value="all">All Status</option>
          <option value="Booked">Booked</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="No Answer">No Answer</option>
          <option value="Rate Limited">Rate Limited</option>
          <option value="Emergency">Emergency</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Summary</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    No calls match your filters.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => {
                  const color = statusColors[call.status] || statusColors['default'];
                  return (
                    <tr
                      key={call._row}
                      onClick={() => handleRowClick(call)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {new Date(call.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                          call.call_type === 'inbound'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}>
                          {call.call_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{call.customer_name}</div>
                        <div className="text-gray-400 text-xs">{call.customer_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {call.summary || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {call.recording_url && (
                            <a
                              href={call.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              title="Listen to recording"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={(e) => handleEditClick(e, call)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, call._row)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 transition"
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

      {/* Detail Modal */}
      {isDetailModalOpen && selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full p-2 shadow-lg transition-colors z-10 border border-gray-200 dark:border-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📞</span>
              Call Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Customer Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCall.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCall.customer_phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Call Type</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                    selectedCall.call_type === 'inbound'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {selectedCall.call_type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    statusColors[selectedCall.status] || statusColors['default']
                  }`}>
                    {selectedCall.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Call ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{selectedCall.call_id || '—'}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Date & Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(selectedCall.timestamp).toLocaleString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Booked Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCall.booked_time || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCall.address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Recording</p>
                  {selectedCall.recording_url ? (
                    <a
                      href={selectedCall.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Listen to Recording
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Section - Full Width */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">Summary</p>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg mt-1">
                {selectedCall.summary || '—'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Close
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
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}