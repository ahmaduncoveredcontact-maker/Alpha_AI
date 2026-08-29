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
  const [generatingQR, setGeneratingQR] = useState(false);

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

  const handleRegenerateQR = async () => {
    if (!confirm('Regenerate QR codes for this client?')) return;
    setGeneratingQR(true);
    const res = await fetch(`/api/admin/clients/${client.slug}/regenerate-qr`, {
      method: 'POST',
    });
    setGeneratingQR(false);
    if (res.ok) {
      const data = await res.json();
      alert('QR codes regenerated successfully!');
      // Update form with new QR URLs
      setForm({
        ...form,
        qr_main_url: data.qrUrls.main,
        qr_wallpaper_url: data.qrUrls.wallpaper,
        qr_sticker_url: data.qrUrls.sticker,
      });
      router.refresh();
    } else {
      const err = await res.json();
      alert(`QR regeneration failed: ${err.error}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Full Edit Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Voice Instructions</label>
            <textarea
              rows={4}
              value={form.voice_instructions}
              onChange={(e) => setForm({ ...form, voice_instructions: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black"
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
            <input
              value={form.delivery_address || ''}
              onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Toggles</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.outbound_calling_enabled}
                onChange={() => handleToggle('outbound_calling_enabled')}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label className="text-sm text-gray-600">Outbound Calling Enabled</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.consent_confirmed}
                onChange={() => handleToggle('consent_confirmed')}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label className="text-sm text-gray-600">Consent Checkbox Confirmed</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.manager_access_granted}
                onChange={() => handleToggle('manager_access_granted')}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label className="text-sm text-gray-600">Manager Access Granted</label>
            </div>
          </div>

          <hr className="border-gray-200" />
          <div>
            <h3 className="font-medium text-gray-900">Google Business Profile Integration</h3>
            <div className="mt-2 space-y-2">
              <div>
                <label className="block text-xs text-gray-500">GBP Account ID</label>
                <input
                  value={form.gbp_account_id || ''}
                  onChange={(e) => setForm({ ...form, gbp_account_id: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder="Auto-filled after sync"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">GBP Location ID</label>
                <input
                  value={form.gbp_location_id || ''}
                  onChange={(e) => setForm({ ...form, gbp_location_id: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  placeholder="Auto-filled after sync"
                />
              </div>
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

          <div className="flex flex-wrap gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleRegenerateWebhook}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700"
            >
              Regenerate Webhook
            </button>
            <button
              type="button"
              onClick={handleRegenerateQR}
              disabled={generatingQR}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {generatingQR ? 'Generating...' : 'Regenerate QR Codes'}
            </button>
          </div>
        </form>
      </div>

      {/* Right: Live Preview */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Client Dashboard Preview</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <QRDisplay client={form} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <WebhookUrlDisplay webhookUrl={form.webhook_url} />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-medium text-gray-700 mb-2">Quick Links</h4>
          <a
            href={`/live/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Open Client Dashboard ?
          </a>
        </div>
      </div>
    </div>
  );
}
