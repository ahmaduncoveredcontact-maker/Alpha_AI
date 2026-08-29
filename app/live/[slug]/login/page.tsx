'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ClientLoginPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/client/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, code }),
    });
    if (res.ok) {
      router.push(`/live/${slug}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Invalid access code');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">Client Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter your access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded border p-2"
            required
          />
          {error && <p className="mt-2 text-red-600">{error}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
