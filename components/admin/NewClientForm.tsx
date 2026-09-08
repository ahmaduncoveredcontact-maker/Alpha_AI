'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClientForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: '',
    voice_instructions: '',
    phone: '',
    email: '',
    // REMOVED: calendar_link
    google_review_link: '',
    delivery_address: '',
    access_code: '',
    // NEW: Calendar settings
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timezone: 'America/New_York',
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

  // Handle multi-select for working days
  const handleDayToggle = (day: string) => {
    setForm(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
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

        {/* NEW: Calendar Settings */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-3">Calendar Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Working Hours Start</label>
              <input
                type="time"
                value={form.working_hours_start}
                onChange={(e) => setForm({ ...form, working_hours_start: e.target.value })}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium">Working Hours End</label>
              <input
                type="time"
                value={form.working_hours_end}
                onChange={(e) => setForm({ ...form, working_hours_end: e.target.value })}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium">Working Days</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.working_days.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-medium">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Phoenix">Arizona (MST)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Paris (CET/CEST)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Asia/Singapore">Singapore (SGT)</option>
              <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
            </select>
          </div>
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