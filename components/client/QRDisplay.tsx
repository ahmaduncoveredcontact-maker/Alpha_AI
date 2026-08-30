'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

interface Client {
  business_name: string;
  google_review_link?: string;
  slug: string;
  qr_title?: string;
  qr_subtitle?: string;
  qr_tagline?: string;
}

export default function QRDisplay({ client }: { client: Client }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const targetUrl = client.google_review_link || `${process.env.NEXT_PUBLIC_BASE_URL}/r/${client.slug}`;

  useEffect(() => {
    setLoading(true);
    QRCode.toDataURL(targetUrl, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
        setLoading(false);
      })
      .catch(() => {
        setQrDataUrl(null);
        setLoading(false);
      });
  }, [targetUrl]);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        width: 400,
        height: 520,
      });
      const link = document.createElement('a');
      link.download = `qr_card_${client.slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Failed to download card. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* The card – exactly as shown on dashboard */}
      <div
        ref={cardRef}
        className="bg-white rounded-2xl p-8 max-w-sm w-full"
        style={{
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.2)',
          width: '400px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Business name */}
        <div className="text-center" style={{ marginBottom: '8px' }}>
          <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{client.business_name}</h3>
        </div>

        {/* QR Code */}
        <div className="flex justify-center" style={{ marginBottom: '16px' }}>
          {loading ? (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
              Generating QR…
            </div>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR Code to leave a review"
              className="w-48 h-48 object-contain border-2 border-gray-200 rounded-xl p-2 bg-white"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
              No QR available
            </div>
          )}
        </div>

        {/* Google branding – larger logo & text, perfectly aligned */}
        <div className="text-center space-y-1" style={{ marginBottom: '4px' }}>
          <div className="flex justify-center items-center space-x-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-2xl font-medium text-gray-700">Google</span>
          </div>
          <div className="flex justify-center space-x-0.5 text-2xl text-yellow-500">
            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
          </div>
          <p className="text-sm text-gray-600 font-medium mt-1">{client.qr_title || 'Review us on Google'}</p>
          <p className="text-xs text-gray-400">{client.qr_subtitle || 'Your feedback helps us improve and grow.'}</p>
          <p className="text-xs text-gray-400 italic mt-1">{client.qr_tagline || 'Good days start with coffee 😊'}</p>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadCard}
        className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download Card
      </button>

      {client.google_review_link && (
        <div className="mt-2 text-xs text-gray-400 truncate max-w-xs">
          <span className="font-medium">Review link:</span> {client.google_review_link}
        </div>
      )}
    </div>
  );
}