'use client';

import QRDisplay from './QRDisplay';

interface Client {
  id: string;
  business_name: string;
  slug: string;
  google_review_link?: string;
  qr_title?: string;
  qr_subtitle?: string;
  qr_tagline?: string;
  qr_main_url?: string;
  qr_wallpaper_url?: string;
  qr_sticker_url?: string;
}

export default function QRCodePage({ client }: { client: Client }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Download and share your Google review QR code
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 flex justify-center">
        <QRDisplay client={client} />
      </div>

      {/* NFC Card Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          📦 <strong>NFC card</strong> will be delivered to your provided address: 
          <span className="ml-1 font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
            {client.delivery_address || 'Not provided'}
          </span>
        </p>
      </div>
    </div>
  );
}