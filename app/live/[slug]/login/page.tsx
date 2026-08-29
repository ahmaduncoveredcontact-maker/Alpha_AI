'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

export default function ClientLoginPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Auto-login if ?auto=1 and admin session exists
  useEffect(() => {
    const auto = searchParams.get('auto');
    if (auto === '1' && !autoLoginAttempted) {
      setAutoLoginAttempted(true);
      setLoading(true);
      fetch('/api/client/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
        .then(res => {
          if (res.ok) {
            router.push(`/live/${slug}`);
          } else {
            // Auto-login failed, show normal login form
            setLoading(false);
            setError('Auto-login failed. Please enter your access code.');
          }
        })
        .catch(() => {
          setLoading(false);
          setError('Network error. Please try manual login.');
        });
    }
  }, [searchParams, slug, router, autoLoginAttempted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/client/auth', {
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
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-gray-800 to-gray-600 text-white text-3xl font-bold px-6 py-2 rounded-2xl shadow-lg tracking-tight">
            α Alpha AI
          </div>
          <p className="text-gray-500 mt-2 text-sm">Client portal – secure access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Sign in</h1>
          {loading && !error ? (
            <div className="text-center py-4 text-gray-500">Authenticating...</div>
          ) : (
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
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-xl">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}
          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            <span className="opacity-60">Alpha AI v2.0 – secure client access</span>
          </div>
        </div>
      </div>
    </div>
  );
}