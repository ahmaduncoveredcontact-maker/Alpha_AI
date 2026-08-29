'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingResult {
  client: any;
  accessCode: string;
  webhookUrl: string;
  qrUrls: { main: string; wallpaper: string; sticker: string };
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('onboardingResult');
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
      sessionStorage.removeItem('onboardingResult');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return null;

  const { client, accessCode, webhookUrl, qrUrls } = data;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">?? Client Created Successfully!</h1>
      <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
        <p><strong>Business:</strong> {client.business_name}</p>
        <p><strong>Slug:</strong> {client.slug}</p>
        <p><strong>Access Code:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{accessCode}</code></p>
        <p><strong>Webhook URL:</strong> <code className="bg-gray-200 px-2 py-1 rounded text-sm break-all">{webhookUrl}</code></p>
        <p><strong>QR Code (main):</strong> <a href={qrUrls.main} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
        <p><strong>QR Wallpaper:</strong> <a href={qrUrls.wallpaper} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
        <p><strong>QR Sticker:</strong> <a href={qrUrls.sticker} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">? Manual Checklist</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Order and ship NFC card to: <strong>{client.delivery_address || 'Not provided'}</strong></li>
        <li>Connect real Twilio number in Vapi and tick "Outbound Calling Enabled"</li>
        <li>Verify website consent checkbox and tick "Consent Checkbox Confirmed"</li>
        <li>Add service account as Manager on GBP and tick "Manager Access Granted"</li>
        <li>Paste the webhook URL into the client's website contact form</li>
      </ul>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => navigator.clipboard.writeText(webhookUrl)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Copy Webhook URL
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(accessCode)}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Copy Access Code
        </button>
        <button
          onClick={() => router.push('/admin')}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
