'use client';

import {
  Phone,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  QrCode,
  Clock,
} from 'lucide-react';

interface Client {
  id: string;
  business_name: string;
  slug: string;
  delivery_address?: string;
  google_review_link?: string;
  webhook_url: string;
  gbp_access_token?: string;
}

export default function DashboardOverview({
  client,
  totalCalls,
  bookings,
  onNavigate,
}: {
  client: Client;
  totalCalls: number;
  bookings: number;
  onNavigate: (tab: string) => void;
}) {
  const isGbpConnected = !!client.gbp_access_token;

  const quickActions = [
    {
      id: 'qr-code',
      label: 'Collect Google Reviews',
      description: 'A working system to collect reviews',
      icon: QrCode,
      color: 'border-blue-300 dark:border-blue-700 hover:border-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      description: 'View upcoming bookings',
      icon: Calendar,
      color: 'border-green-300 dark:border-green-700 hover:border-green-400',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'calls',
      label: 'Call Log',
      description: 'See recent calls',
      icon: Phone,
      color: 'border-purple-300 dark:border-purple-700 hover:border-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      description: 'Manage availability',
      icon: Clock,
      color: 'border-orange-300 dark:border-orange-700 hover:border-orange-400',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCalls}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">this week</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookings}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">confirmed</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review Replies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">auto-responded</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* GBP Connection Card */}
      <div
        className={`rounded-xl p-5 border ${
          isGbpConnected
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {isGbpConnected ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <h3
                className={`font-semibold ${
                  isGbpConnected
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-amber-800 dark:text-amber-300'
                }`}
              >
                {isGbpConnected
                  ? '✅ Auto-Responder Active'
                  : '⚡ Enable Auto Google Review Responder'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isGbpConnected
                  ? '5-star reviews will be automatically replied to boost your Google ranking.'
                  : 'Sign in with your Google Business Profile to automatically reply to 5-star reviews.'}
              </p>
            </div>
          </div>
          {!isGbpConnected && (
            <a
              href={`/api/client/gbp/auth?slug=${client.slug}`}
              className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 flex-shrink-0 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </a>
          )}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-2 ${action.color} text-left hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col gap-3`}
            >
              <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-900 w-fit`}>
                <Icon className={`w-6 h-6 ${action.iconColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {action.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}