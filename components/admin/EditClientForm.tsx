'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRDisplay from '@/components/client/QRDisplay';
import WebhookUrlDisplay from '@/components/client/WebhookUrlDisplay';
import WeekScheduleView from '@/components/client/WeekScheduleView';
import { TIMEZONES } from '@/lib/constants/timezones';

interface Client {
  id: string;
  slug: string;
  business_name: string;
  voice_instructions: string;
  phone: string;
  email: string;
  google_review_link: string;
  delivery_address: string;
  qr_title: string;
  qr_subtitle: string;
  qr_tagline: string;
  outbound_calling_enabled: boolean;
  consent_confirmed: boolean;
  manager_access_granted: boolean;
  qr_main_url?: string;
  qr_wallpaper_url?: string;
  qr_sticker_url?: string;
  webhook_url: string;
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: string[];
  timezone?: string;
  cal_event_slug?: string;
  day_times?: { [key: string]: { start: string; end: string } };
  // NEW: Call minute fields
  call_minute_limit?: number;
  call_priority?: string;
  minutes_used?: number;
  plan_start_date?: string;
  next_reset_date?: string;
  last_reset_date?: string;
}

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [form, setForm] = useState(client);
  const [loading, setLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState({
    newCode: '',
    confirmCode: '',
    message: '',
    error: '',
  });

  // Per-day time state
  const [dayTimes, setDayTimes] = useState<{ [key: string]: { start: string; end: string } }>(
    client.day_times || {}
  );

  const handleToggle = (key: keyof Client) => {
    setForm({ ...form, [key]: !form[key] });
  };

  const handleDayToggle = (day: string) => {
    const currentDays = form.working_days || [];
    setForm({
      ...form,
      working_days: currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day],
    });
  };

  const handleDayTimeChange = (day: string, start: string, end: string) => {
    const updatedDayTimes = {
      ...dayTimes,
      [day]: { start, end },
    };
    setDayTimes(updatedDayTimes);
    setForm({
      ...form,
      day_times: updatedDayTimes,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/admin/clients/${client.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert('Update failed');
    }
  };

  const handleRegenerateWebhook = async () => {
    if (!confirm('Regenerate webhook URL? Old one will stop working.')) return;
    const res = await fetch(`/api/admin/clients/${client.slug}/regenerate-webhook`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      alert(`New webhook URL: ${data.webhook_url}`);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`⚠️ Are you sure you want to delete "${client.business_name}"? This action cannot be undone.`)) return;
    if (!confirm(`Final confirmation: Delete "${client.business_name}" and all associated data?`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/clients/${client.slug}`, {
      method: 'DELETE',
    });
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
    } else {
      const err = await res.json();
      alert(`Delete failed: ${err.error}`);
    }
  };

  const handleResetPassword = async () => {
    setResetPassword({ ...resetPassword, message: '', error: '' });
    if (resetPassword.newCode.length < 4) {
      setResetPassword({ ...resetPassword, error: 'New code must be at least 4 characters.' });
      return;
    }
    if (resetPassword.newCode !== resetPassword.confirmCode) {
      setResetPassword({ ...resetPassword, error: 'Codes do not match.' });
      return;
    }

    const res = await fetch(`/api/admin/clients/${client.slug}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newAccessCode: resetPassword.newCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setResetPassword({
        newCode: '',
        confirmCode: '',
        message: data.message || 'Password reset successfully!',
        error: '',
      });
    } else {
      setResetPassword({ ...resetPassword, error: data.error || 'Reset failed.' });
    }
  };

  // ✅ Handle resetting minutes
  const handleResetMinutes = async () => {
    if (!confirm('Reset minutes used for this client? This will set minutes_used to 0.')) return;
    const res = await fetch(`/api/admin/clients/${client.slug}/reset-minutes`, {
      method: 'POST',
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert('Failed to reset minutes');
    }
  };

  const GooglePill = () => (
    <span
      className="w-1.5 h-6 rounded-full"
      style={{ background: 'linear-gradient(180deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)' }}
    />
  );

  const remainingMinutes = Math.max(0, (form.call_minute_limit || 500) - (form.minutes_used || 0));
  const daysUntilReset = form.next_reset_date
    ? Math.ceil((new Date(form.next_reset_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md hover:border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent outline-none transition"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <input
                  value={form.delivery_address || ''}
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Call Minute Limit - NEW */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md hover:border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Call Management
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Call Minute Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={form.call_minute_limit ?? 500}
                    onChange={(e) => setForm({ ...form, call_minute_limit: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none transition"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Set to <strong>0</strong> for unlimited minutes
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority Tier
                  </label>
                  <select
                    value={form.call_priority || 'standard'}
                    onChange={(e) => setForm({ ...form, call_priority: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none transition"
                  >
                    <option value="standard">⚪ Standard</option>
                    <option value="priority">🔸 Priority</option>
                    <option value="premium">🔹 Premium</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.call_priority === 'premium' ? '🔹 Highest priority – calls processed first' :
                     form.call_priority === 'priority' ? '🔸 High priority – processed before standard' :
                     '⚪ Standard priority – normal queue order'}
                  </p>
                </div>
              </div>

              {/* Minutes Usage Display */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Used</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {form.minutes_used || 0} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Limit</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {form.call_minute_limit === 0 ? '♾️' : (form.call_minute_limit || 500)} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                    <p className={`text-xl font-bold ${
                      remainingMinutes < 50 && remainingMinutes > 0
                        ? 'text-red-600 dark:text-red-400'
                        : remainingMinutes === 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {form.call_minute_limit === 0 ? '♾️' : remainingMinutes} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Next Reset</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {form.next_reset_date ? new Date(form.next_reset_date).toLocaleDateString() : 'N/A'}
                    </p>
                    {daysUntilReset > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{daysUntilReset} days</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={handleResetMinutes}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition"
                  >
                    Reset Minutes Used
                  </button>
                  <span className="text-xs text-gray-400 ml-3">
                    Plan start: {form.plan_start_date ? new Date(form.plan_start_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Instructions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md hover:border-red-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Voice Instructions
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructions for the AI assistant</label>
              <textarea
                rows={6}
                value={form.voice_instructions}
                onChange={(e) => setForm({ ...form, voice_instructions: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#EA4335] focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Calendar Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md hover:border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Weekly Schedule
            </h3>
            <div className="space-y-4">
              <WeekScheduleView
                working_days={form.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']}
                working_hours_start={form.working_hours_start || '09:00'}
                working_hours_end={form.working_hours_end || '17:00'}
                onDayToggle={handleDayToggle}
                onHoursChange={(start, end) => {
                  setForm({
                    ...form,
                    working_hours_start: start,
                    working_hours_end: end,
                  });
                }}
                onDayTimeChange={handleDayTimeChange}
                dayTimes={dayTimes}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={form.timezone || 'America/New_York'}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none transition"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.cal_event_slug && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Booking Link:</span>{' '}
                    <a
                      href={`https://cal.com/${process.env.NEXT_PUBLIC_CAL_USERNAME || 'alphaai'}/${form.cal_event_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      https://cal.com/alphaai/{form.cal_event_slug}
                    </a>
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Click to edit availability, holidays, or buffer time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Review Links */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md hover:border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Review Links
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Google Review Link</label>
                <input
                  value={form.google_review_link || ''}
                  onChange={(e) => setForm({ ...form, google_review_link: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#FBBC05] outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  <span style={{ color: '#34A853', fontWeight: 'bold' }}>✓</span> The QR code updates automatically when you change the review link.
                </p>
              </div>
            </div>
          </div>

          {/* QR Card Text */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md hover:border-green-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              QR Card Text Customization
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title (above stars)</label>
                <input
                  value={form.qr_title || 'Review us on Google'}
                  onChange={(e) => setForm({ ...form, qr_title: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#34A853] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle (below stars)</label>
                <input
                  value={form.qr_subtitle || 'Your feedback helps us improve and grow.'}
                  onChange={(e) => setForm({ ...form, qr_subtitle: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#34A853] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tagline (bottom)</label>
                <input
                  value={form.qr_tagline || 'Good days start with coffee 😊'}
                  onChange={(e) => setForm({ ...form, qr_tagline: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#34A853] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Toggles
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.outbound_calling_enabled}
                  onChange={() => handleToggle('outbound_calling_enabled')}
                  className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                />
                <label className="text-sm text-gray-700">Outbound Calling Enabled</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.consent_confirmed}
                  onChange={() => handleToggle('consent_confirmed')}
                  className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                />
                <label className="text-sm text-gray-700">Consent Checkbox Confirmed</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.manager_access_granted}
                  onChange={() => handleToggle('manager_access_granted')}
                  className="h-4 w-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                />
                <label className="text-sm text-gray-700">Manager Access Granted</label>
              </div>
            </div>
          </div>

          {/* Save Actions */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#4285F4' }}
              className="text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 shadow-md transition transform hover:-translate-y-0.5"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleRegenerateWebhook}
              style={{ backgroundColor: '#FBBC05', color: '#1f2937' }}
              className="px-6 py-3 rounded-lg font-medium hover:opacity-90 shadow-md transition transform hover:-translate-y-0.5"
            >
              Regenerate Webhook
            </button>
          </div>
        </form>

        {/* Password Reset Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-[#4285F4]">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Client Access Code Reset</h3>
          <p className="text-sm text-gray-500 mb-4">
            Change the client's access code. The client will use this new code to log in.
          </p>
          <div className="space-y-3 max-w-md">
            <div>
              <input
                type="text"
                value={resetPassword.newCode}
                onChange={(e) => setResetPassword({ ...resetPassword, newCode: e.target.value, message: '', error: '' })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none"
                placeholder="Enter new access code (min 4 chars)"
              />
            </div>
            <div>
              <input
                type="text"
                value={resetPassword.confirmCode}
                onChange={(e) => setResetPassword({ ...resetPassword, confirmCode: e.target.value, message: '', error: '' })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none"
                placeholder="Re-enter the new access code"
              />
            </div>
            {resetPassword.error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
                {resetPassword.error}
              </div>
            )}
            {resetPassword.message && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">
                {resetPassword.message}
              </div>
            )}
            <button
              type="button"
              onClick={handleResetPassword}
              style={{ backgroundColor: '#4285F4' }}
              className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 shadow-sm transition"
            >
              Reset Access Code
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-[#EA4335]">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">Deleting this client will permanently remove all data, call logs, and settings.</p>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{ backgroundColor: '#EA4335' }}
            className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 shadow-sm transition"
          >
            Delete Client
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2 text-lg">
            📱 QR Card Preview
          </h4>

          <div
            className="w-full rounded-2xl border flex justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(66,133,244,0.03) 0%, rgba(234,67,53,0.03) 33%, rgba(251,188,5,0.03) 66%, rgba(52,168,83,0.03) 100%)',
              borderColor: 'rgba(66,133,244,0.1)',
              height: '520px',
              paddingTop: '24px',
            }}
          >
            <div className="origin-top" style={{ transform: 'scale(0.72)', width: '400px' }}>
              <QRDisplay client={form} />
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Preview updates live as you edit fields. Downloads are always full resolution.
          </p>

          <div className="mt-6">
            <WebhookUrlDisplay webhookUrl={form.webhook_url} />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <a
              href={`/live/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4285F4' }}
              className="inline-block font-medium hover:opacity-80 transition"
            >
              Open Client Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}