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
    QRCode.toDataURL(targetUrl, { width: 260, margin: 1, color: { dark: '#1f2937', light: '#ffffff' } })
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
        scale: 3, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        width: 400,
        height: 640, // Increased to match the new container height
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div
        ref={cardRef}
        style={{
          width: '400px',
          height: '640px', // Increased height to prevent text cut-off
          padding: '48px 32px', // Increased top and bottom padding for more breathing room
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top Section: Google Branding & Call to Action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Larger Google G */}
          <svg width="104" height="104" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '16px' }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>

          {/* Typography */}
          <div style={{ textAlign: 'center', lineHeight: '1.1' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: '#374151', marginBottom: '2px' }}>
              review us
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#1f2937', letterSpacing: '-0.02em' }}>
              on Google
            </div>
          </div>

          {/* Golden Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', fontSize: '38px', color: '#FBBC05', marginTop: '6px', letterSpacing: '2px' }}>
            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
          </div>
        </div>

        {/* Middle Section: Large QR Code */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '16px 0' }}>
          {loading ? (
            <div style={{ width: '260px', height: '260px', backgroundColor: '#f9fafb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '2px dashed #e5e7eb' }}>
              Generating QR…
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{ width: '260px', height: '260px', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ width: '260px', height: '260px', backgroundColor: '#f9fafb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '2px dashed #e5e7eb' }}>
              No QR
            </div>
          )}
        </div>

        {/* Bottom Section: Custom Centered Taglines */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280', margin: '0 0 6px 0' }}>
            {client.qr_subtitle || 'Your feedback helps us improve and grow.'}
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
            {client.qr_tagline || 'Good days start with coffee 😊'}
          </p>
        </div>
      </div>

      <button
        onClick={downloadCard}
        style={{
          marginTop: '32px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#ffffff',
          padding: '12px 32px',
          borderRadius: '12px',
          fontWeight: 500,
          boxShadow: '0 10px 25px -5px rgba(79,70,229,0.4)',
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '16px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 30px -5px rgba(79,70,229,0.5)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(79,70,229,0.4)'; }}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download Card
      </button>

      {client.google_review_link && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 500 }}>Review link:</span> {client.google_review_link}
        </div>
      )}
    </div>
  );
}