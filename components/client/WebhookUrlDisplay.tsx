'use client';

import { useState } from 'react';

export default function WebhookUrlDisplay({ webhookUrl }: { webhookUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4">
      <h3 className="font-semibold mb-2">Your Webhook URL</h3>
      <p className="text-sm text-gray-600 mb-2">
        Paste this URL into your website contact form to receive leads instantly.
      </p>
      <div className="flex items-center space-x-2">
        <code className="bg-white border p-2 rounded flex-1 text-sm break-all">
          {webhookUrl}
        </code>
        <button
          onClick={handleCopy}
          className="bg-black text-white px-4 py-2 rounded text-sm whitespace-nowrap"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
