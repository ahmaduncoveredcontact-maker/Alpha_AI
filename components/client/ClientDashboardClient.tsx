'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from './ThemeContext';
import Sidebar from './Sidebar';
import DashboardOverview from './DashboardOverview';
import QRCodePage from './QRCodePage';
import AppointmentsPage from './AppointmentsPage';
import CallLogPage from './CallLogPage';
import SchedulePage from './SchedulePage';
import SettingsPage from './SettingsPage';
import { Menu, X } from 'lucide-react';

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
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: string[];
  timezone?: string;
  cal_event_slug?: string;
  day_times?: { [key: string]: { start: string; end: string } };
  gbp_access_token?: string;
  
  // Call minute fields
  call_minute_limit?: number;
  call_priority?: string;
  minutes_used?: number;
  plan_start_date?: string;
  next_reset_date?: string;
  last_reset_date?: string;
  // Appointment duration
  event_length?: number;
  // Buffer time
  buffer_time?: number;
}

export default function ClientDashboardClient({
  client: initialClient,
  initialCalls,
  totalCalls: initialTotalCalls,
  bookings: initialBookings,
}: {
  client: Client;
  initialCalls: CallLog[];
  totalCalls: number;
  bookings: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [calls, setCalls] = useState<CallLog[]>(initialCalls);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Client state so it can be updated after schedule changes
  const [client, setClient] = useState<Client>(initialClient);

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

  // Sync activeTab with URL query param (handles back/forward)
  useEffect(() => {
    const tab = searchParams.get('tab') || 'dashboard';
    setActiveTab(tab);
  }, [searchParams]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    const url = `/live/${client.slug}?tab=${tab}`;
    router.push(url, { scroll: false });
  };

  const refreshCalls = async () => {
    const res = await fetch(`/api/client/${client.slug}/calls`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCalls(data);
    }
  };

  // Update schedule – returns updated client data
  const updateSchedule = async (data: any) => {
    setSavingSchedule(true);
    try {
      const res = await fetch(`/api/client/${client.slug}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        let errorMsg = 'Failed to update schedule.';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = `Error ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      
      const result = await res.json();
      if (result.client) {
        console.log('✅ Schedule updated, new client data:', result.client);
        setClient(result.client);
      }
      await refreshCalls();
    } catch (err: any) {
      console.error('Schedule update error:', err);
      alert(`Failed to update schedule: ${err.message}`);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleEdit = (call: CallLog) => {
    setEditingCall(call);
    setEditForm({
      customer_name: call.customer_name,
      customer_phone: call.customer_phone,
      summary: call.summary,
      status: call.status,
      booked_time: call.booked_time || '',
      address: call.address || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCall) return;
    const res = await fetch(`/api/client/${client.slug}/calls`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
      credentials: 'include',
    });
    if (res.ok) {
      await refreshCalls();
    } else {
      alert('Failed to delete call.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            client={client}
            totalCalls={initialTotalCalls}
            bookings={initialBookings}
            onNavigate={handleNavigate}
          />
        );
      case 'qr-code':
        return <QRCodePage client={client} />;
      case 'appointments':
        return <AppointmentsPage calls={calls} />;
      case 'calls':
        return (
          <CallLogPage
            calls={calls}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      case 'schedule':
        return (
          <SchedulePage
            client={client}
            onUpdate={updateSchedule}
            saving={savingSchedule}
          />
        );
      case 'settings':
        return <SettingsPage client={client} />;
      default:
        return (
          <DashboardOverview
            client={client}
            totalCalls={initialTotalCalls}
            bookings={initialBookings}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              α
            </span>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Alpha AI</span>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        theme={theme}
        toggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full mt-16 lg:mt-16 min-h-screen lg:ml-64">
        {renderContent()}
      </main>

      {/* Edit Modal */}
      {editModalOpen && editingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full p-2 shadow-lg transition-colors z-10 border border-gray-200 dark:border-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Call Log</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                <input
                  type="text"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4285F4] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Phone</label>
                <input
                  type="text"
                  value={editForm.customer_phone}
                  onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4285F4] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
                <input
                  type="text"
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4285F4] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4285F4] outline-none"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Booked Time</label>
                <input
                  type="text"
                  value={editForm.booked_time}
                  onChange={(e) => setEditForm({ ...editForm, booked_time: e.target.value })}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4285F4] outline-none"
                  placeholder="e.g. today at 6 PM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4285F4] outline-none"
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
    </div>
  );
}