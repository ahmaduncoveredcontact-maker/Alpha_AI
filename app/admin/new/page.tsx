'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: '',
    voice_instructions: '',
    phone: '',
    email: '',
    calendar_link: '',
    google_review_link: '',
    delivery_address: '',
    access_code: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('onboardingResult', JSON.stringify(data));
        router.push(`/admin/${data.client.slug}/results`);
      } else {
        const err = await res.json();
        alert(`Failed to create client: ${err.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Onboard New Client</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Business Name *</label>
          <input
            required
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Voice Agent Instructions *</label>
          <textarea
            required
            rows={4}
            value={form.voice_instructions}
            onChange={(e) => setForm({ ...form, voice_instructions: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Calendar Link</label>
          <input
            value={form.calendar_link}
            onChange={(e) => setForm({ ...form, calendar_link: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Google Review Link</label>
          <input
            value={form.google_review_link}
            onChange={(e) => setForm({ ...form, google_review_link: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Delivery Address</label>
          <input
            value={form.delivery_address}
            onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Access Code (leave blank to auto-generate)</label>
          <input
            value={form.access_code}
            onChange={(e) => setForm({ ...form, access_code: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>
    </div>
  );
}
