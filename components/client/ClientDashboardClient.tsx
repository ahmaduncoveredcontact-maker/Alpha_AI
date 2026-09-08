'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeContext';
import Sidebar from './Sidebar';
import DashboardOverview from './DashboardOverview';
import QRCodePage from './QRCodePage';
import AppointmentsPage from './AppointmentsPage';
import CallLogPage from './CallLogPage';
import SchedulePage from './SchedulePage';
import SettingsPage from './SettingsPage';
import { X } from 'lucide-react';

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
}

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
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [calls, setCalls] = useState<CallLog[]>(initialCalls);
  const [savingSchedule, setSavingSchedule] = useState(false);

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

  // Handle navigation with replace to fix back button behavior
  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    // Replace the current URL with the tab as a hash, so back goes to previous tab
    const url = `/live/${client.slug}?tab=${tab}`;
    router.replace(url, { scroll: false });
  };

  // On mount, check for tab in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && navItems.some(item => item.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  const refreshCalls = async () => {
    const res = await fetch(`/api/client/${client.slug}/calls`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCalls(data);
    }
  };

  const updateSchedule = async (data: any) => {
    setSavingSchedule(true);
    try {
      const res = await fetch(`/api/client/${client.slug}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await refreshCalls();
      }
    } catch (err) {
      console.error('Schedule update failed:', err);
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'qr-code', label: 'QR Code' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'calls', label: 'Call Log' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            client={client}
            totalCalls={totalCalls}
            bookings={bookings}
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
        return (
          <SettingsPage
            webhookUrl={client.webhook_url}
            businessName={client.business_name}
            slug={client.slug}
          />
        );
      default:
        return <DashboardOverview client={client} totalCalls={totalCalls} bookings={bookings} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 pt-[64px] lg:pt-0">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        theme={theme}
        toggleTheme={toggleTheme}
        businessName={client.business_name}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full mt-4 lg:mt-0">
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