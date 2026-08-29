'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  slug: string;
  business_name: string;
  google_review_link: string;
  outbound_calling_enabled: boolean;
  consent_confirmed: boolean;
  manager_access_granted: boolean;
  gbp_account_id?: string;
  gbp_location_id?: string;
}

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [form, setForm] = useState(client);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Business Name</label>
        <input
          value={form.business_name}
          onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Google Review Link</label>
        <input
          value={form.google_review_link || ''}
          onChange={(e) => setForm({ ...form, google_review_link: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={form.outbound_calling_enabled}
          onChange={() => handleToggle('outbound_calling_enabled')}
        />
        <label>Outbound Calling Enabled</label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={form.consent_confirmed}
          onChange={() => handleToggle('consent_confirmed')}
        />
        <label>Consent Checkbox Confirmed</label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={form.manager_access_granted}
          onChange={() => handleToggle('manager_access_granted')}
        />
        <label>Manager Access Granted</label>
      </div>

      <hr className="my-4" />
      <h3 className="font-semibold">Google Business Profile Integration</h3>
      <div>
        <label className="block text-sm">GBP Account ID</label>
        <input
          value={form.gbp_account_id || ''}
          onChange={(e) => setForm({ ...form, gbp_account_id: e.target.value })}
          className="w-full border p-2 rounded text-sm"
          placeholder="Auto-filled after sync"
        />
      </div>
      <div>
        <label className="block text-sm">GBP Location ID</label>
        <input
          value={form.gbp_location_id || ''}
          onChange={(e) => setForm({ ...form, gbp_location_id: e.target.value })}
          className="w-full border p-2 rounded text-sm"
          placeholder="Auto-filled after sync"
        />
      </div>
      <button
        type="button"
        onClick={handleSyncGBP}
        disabled={syncing}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {syncing ? 'Syncing...' : 'Sync GBP Locations'}
      </button>

      <div className="flex space-x-4 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={handleRegenerateWebhook}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Regenerate Webhook
        </button>
      </div>
    </form>
  );
}
