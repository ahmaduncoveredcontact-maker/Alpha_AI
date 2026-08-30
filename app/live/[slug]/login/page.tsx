'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ClientLoginPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
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
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
    // No setLoading(false) on success because we redirect
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-gray-800 to-gray-600 text-white text-3xl font-bold px-6 py-2 rounded-2xl shadow-lg tracking-tight">
            α Alpha AI
          </div>
          <p className="text-gray-500 mt-2 text-sm">Client portal – secure access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="mt-3 text-sm text-gray-600">Signing in...</p>
              </div>
            </div>
          )}
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Sign in to your dashboard</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Access Code</label>
              <input
                type="password"
                placeholder="Enter your access code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-700 focus:border-transparent transition-shadow"
                required
                autoFocus
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-1">Provided during onboarding</p>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-xl">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            <span className="opacity-60">Protected by Alpha AI v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}