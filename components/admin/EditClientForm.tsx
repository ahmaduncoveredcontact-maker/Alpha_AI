'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRDisplay from '@/components/client/QRDisplay';
import WebhookUrlDisplay from '@/components/client/WebhookUrlDisplay';

interface Client {
  id: string;
  slug: string;
  business_name: string;
  voice_instructions: string;
  phone: string;
  email: string;
  calendar_link: string;
  google_review_link: string;
  delivery_address: string;
  qr_title: string;
  qr_subtitle: string;
  qr_tagline: string;
  outbound_calling_enabled: boolean;
  consent_confirmed: boolean;
  manager_access_granted: boolean;
  gbp_account_id?: string;
  gbp_location_id?: string;
  qr_main_url?: string;
  qr_wallpaper_url?: string;
  qr_sticker_url?: string;
  webhook_url: string;
}

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [form, setForm] = useState(client);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resetPassword, setResetPassword] = useState({
    newCode: '',
    confirmCode: '',
    message: '',
    error: '',
  });

  const handleToggle = (key: keyof Client) => {
    setForm({ ...form, [key]: !form[key] });
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

  const handleSyncGBP = async () => {
    if (!confirm('This will discover your first Google Business Profile location and store its IDs. Continue?')) return;
    setSyncing(true);
    const res = await fetch('/api/admin/sync-gbp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: client.slug }),
    });
    setSyncing(false);
    if (res.ok) {
      const data = await res.json();
      alert(`Synced: Account ${data.accountName}, Location ${data.locationName}`);
      router.refresh();
    } else {
      const err = await res.json();
      alert(`Sync failed: ${err.error}`);
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

  // Reusable Google Gradient Pill for Headers
  const GooglePill = () => (
    <span 
      className="w-1.5 h-6 rounded-full" 
      style={{ background: 'linear-gradient(180deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)' }}
    />
  );

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

          {/* Links */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md hover:border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Calendar & Review Links
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Calendar Link</label>
                <input
                  value={form.calendar_link || ''}
                  onChange={(e) => setForm({ ...form, calendar_link: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#FBBC05] outline-none transition"
                />
              </div>
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

          {/* Toggles & Integrations */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition duration-300 hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GooglePill />
              Toggles & Integrations
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

            <hr className="my-5 border-gray-100" />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">GBP Account ID</label>
              <input
                value={form.gbp_account_id || ''}
                onChange={(e) => setForm({ ...form, gbp_account_id: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#34A853] outline-none"
                placeholder="Auto-filled after sync"
              />
              <label className="block text-sm font-medium text-gray-700 mt-2">GBP Location ID</label>
              <input
                value={form.gbp_location_id || ''}
                onChange={(e) => setForm({ ...form, gbp_location_id: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#34A853] outline-none"
                placeholder="Auto-filled after sync"
              />
              <button
                type="button"
                onClick={handleSyncGBP}
                disabled={syncing}
                style={{ backgroundColor: '#34A853' }}
                className="mt-3 text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition shadow-sm"
              >
                {syncing ? 'Syncing...' : 'Sync GBP Locations'}
              </button>
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
          
          {/* Responsive Scaled Wrapper with Google Tint Background */}
          <div 
            className="w-full rounded-2xl border flex justify-center overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(66,133,244,0.03) 0%, rgba(234,67,53,0.03) 33%, rgba(251,188,5,0.03) 66%, rgba(52,168,83,0.03) 100%)',
              borderColor: 'rgba(66,133,244,0.1)',
              height: '520px', // Fixed container height to crop the scaled element bounds
              paddingTop: '24px'
            }}
          >
            {/* CSS Transform scale to responsively fit the 400px card into the sidebar without horizontal scrolling */}
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