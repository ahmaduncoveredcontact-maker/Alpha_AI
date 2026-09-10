'use client';

import { Copy, Check, ExternalLink, Phone, Clock, Calendar, Zap } from 'lucide-react';
import { useState } from 'react';

interface ClientForSettings {
  webhook_url: string;
  business_name: string;
  slug: string;
  call_minute_limit?: number;
  minutes_used?: number;
  next_reset_date?: string;
  call_priority?: string;
}

export default function SettingsPage({ client }: { client: ClientForSettings }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(client.webhook_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const remainingMinutes = Math.max(0, (client.call_minute_limit || 500) - (client.minutes_used || 0));
  const daysUntilReset = client.next_reset_date
    ? Math.ceil((new Date(client.next_reset_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account and integration settings
        </p>
      </div>

      {/* Call Minutes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Call Minutes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Used</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{client.minutes_used || 0} min</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Limit</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {client.call_minute_limit === 0 ? '♾️ Unlimited' : `${client.call_minute_limit || 500} min`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
            <p
              className={`text-xl font-bold ${
                remainingMinutes < 50 && remainingMinutes > 0
                  ? 'text-red-600 dark:text-red-400'
                  : remainingMinutes === 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {client.call_minute_limit === 0 ? '♾️' : remainingMinutes} min
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                client.call_priority === 'premium'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : client.call_priority === 'priority'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {client.call_priority || 'Standard'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Next Reset</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {client.next_reset_date ? new Date(client.next_reset_date).toLocaleDateString() : 'N/A'}
            </p>
            {daysUntilReset > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{daysUntilReset} days remaining</p>
            )}
          </div>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Webhook URL</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Paste this URL into your website contact form to receive leads instantly.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 rounded-xl text-sm break-all font-mono text-gray-600 dark:text-gray-300">
            {client.webhook_url}
          </code>
          <button
            onClick={handleCopy}
            className="bg-gray-900 dark:bg-gray-700 text-white p-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition shadow-sm flex items-center gap-2"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Information</h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500 dark:text-gray-400">Business:</span>{' '}
            <span className="text-gray-900 dark:text-white font-medium">{client.business_name}</span>
          </p>
          <p>
            <span className="text-gray-500 dark:text-gray-400">Slug:</span>{' '}
            <span className="text-gray-900 dark:text-white font-mono">{client.slug}</span>
          </p>
          <p>
            <span className="text-gray-500 dark:text-gray-400">Dashboard:</span>{' '}
            <a
              href={`/live/${client.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {`/live/${client.slug}`} <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}