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

  // Password reset handler
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
      // Optionally refresh to show updated data (but access_code_hash is hidden)
    } else {
      setResetPassword({ ...resetPassword, error: data.error || 'Reset failed.' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gray-800 rounded-full"></span>
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <input
                  value={form.delivery_address || ''}
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Voice Instructions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gray-800 rounded-full"></span>
              Voice Instructions
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructions for the AI assistant</label>
              <textarea
                rows={6}
                value={form.voice_instructions}
                onChange={(e) => setForm({ ...form, voice_instructions: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gray-800 rounded-full"></span>
              Calendar & Review Links
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Calendar Link</label>
                <input
                  value={form.calendar_link || ''}
                  onChange={(e) => setForm({ ...form, calendar_link: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Google Review Link</label>
                <input
                  value={form.google_review_link || ''}
                  onChange={(e) => setForm({ ...form, google_review_link: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                />
                <p className="text-xs text-amber-600 mt-1">
                  ✅ The QR code updates automatically when you change the review link – no regeneration needed.
                </p>
              </div>
            </div>
          </div>

          {/* QR Card Text */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gray-800 rounded-full"></span>
              QR Card Text Customization
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title (above stars)</label>
                <input
                  value={form.qr_title || 'Review us on Google'}
                  onChange={(e) => setForm({ ...form, qr_title: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle (below stars)</label>
                <input
                  value={form.qr_subtitle || 'Your feedback helps us improve and grow.'}
                  onChange={(e) => setForm({ ...form, qr_subtitle: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tagline (bottom)</label>
                <input
                  value={form.qr_tagline || 'Good days start with coffee 😊'}
                  onChange={(e) => setForm({ ...form, qr_tagline: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Toggles & Integrations */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gray-800 rounded-full"></span>
              Toggles & Integrations
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.outbound_calling_enabled}
                  onChange={() => handleToggle('outbound_calling_enabled')}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label className="text-sm text-gray-700">Outbound Calling Enabled</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.consent_confirmed}
                  onChange={() => handleToggle('consent_confirmed')}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label className="text-sm text-gray-700">Consent Checkbox Confirmed</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.manager_access_granted}
                  onChange={() => handleToggle('manager_access_granted')}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label className="text-sm text-gray-700">Manager Access Granted</label>
              </div>
            </div>

            <hr className="my-4" />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">GBP Account ID</label>
              <input
                value={form.gbp_account_id || ''}
                onChange={(e) => setForm({ ...form, gbp_account_id: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                placeholder="Auto-filled after sync"
              />
              <label className="block text-sm font-medium text-gray-700 mt-2">GBP Location ID</label>
              <input
                value={form.gbp_location_id || ''}
                onChange={(e) => setForm({ ...form, gbp_location_id: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                placeholder="Auto-filled after sync"
              />
              <button
                type="button"
                onClick={handleSyncGBP}
                disabled={syncing}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
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
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleRegenerateWebhook}
              className="bg-amber-600 text-white px-6 py-2.5 rounded-lg hover:bg-amber-700"
            >
              Regenerate Webhook
            </button>
          </div>
        </form>

        {/* Password Reset Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Client Access Code Reset
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Change the client's access code. The client will use this new code to log in.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Access Code</label>
              <input
                type="text"
                value={resetPassword.newCode}
                onChange={(e) => setResetPassword({ ...resetPassword, newCode: e.target.value, message: '', error: '' })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new access code (min 4 chars)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Code</label>
              <input
                type="text"
                value={resetPassword.confirmCode}
                onChange={(e) => setResetPassword({ ...resetPassword, confirmCode: e.target.value, message: '', error: '' })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Reset Access Code
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            <span className="w-1 h-6 bg-red-600 rounded-full"></span>
            Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-4">Deleting this client will permanently remove all data, call logs, and settings.</p>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm"
          >
            Delete Client
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h4 className="font-medium text-gray-700 mb-4 text-center">📱 QR Card Preview</h4>
          <div className="border rounded-lg p-4 bg-gray-50">
            <QRDisplay client={form} />
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Preview updates live as you edit fields.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <WebhookUrlDisplay webhookUrl={form.webhook_url} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h4 className="font-medium text-gray-700 mb-2">Quick Links</h4>
          <a
            href={`/live/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Open Client Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}