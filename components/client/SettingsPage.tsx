'use client';

import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage({
  webhookUrl,
  businessName,
  slug,
}: {
  webhookUrl: string;
  businessName: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account and integration settings
        </p>
      </div>

      {/* Webhook URL */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Webhook URL</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Paste this URL into your website contact form to receive leads instantly.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 rounded-xl text-sm break-all font-mono text-gray-600 dark:text-gray-300">
            {webhookUrl}
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
          <p><span className="text-gray-500 dark:text-gray-400">Business:</span> <span className="text-gray-900 dark:text-white font-medium">{businessName}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400">Slug:</span> <span className="text-gray-900 dark:text-white font-mono">{slug}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400">Dashboard:</span>{' '}
            <a
              href={`/live/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {`/live/${slug}`} <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}