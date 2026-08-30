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
    QRCode.toDataURL(targetUrl, { width: 224, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
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
        height: 580,
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

  const title = client.qr_title && client.qr_title !== 'Review u on Google' 
    ? client.qr_title 
    : 'Review us on Google';

  return (
    <div className="flex flex-col items-center">
      <div
        ref={cardRef}
        style={{
          width: '400px',
          height: '580px',
          padding: '32px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Premium Business Name with decoration */}
        <div style={{ marginBottom: '8px', textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ color: '#6b7280', fontSize: '18px' }}>✦</span>
            <h3 style={{
              fontSize: '26px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #4a1942 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(0,0,0,0.08)',
              letterSpacing: '-0.5px',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {client.business_name}
            </h3>
            <span style={{ color: '#6b7280', fontSize: '18px' }}>✦</span>
          </div>
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, #6b7280, #9ca3af)',
            margin: '4px auto 0',
            borderRadius: '1px',
          }} />
        </div>

        {/* QR Code – centered */}
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          {loading ? (
            <div style={{ width: '224px', height: '224px', backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '2px dashed #d1d5db' }}>
              Generating QR…
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{ width: '224px', height: '224px', objectFit: 'contain', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '8px', backgroundColor: '#ffffff' }}
            />
          ) : (
            <div style={{ width: '224px', height: '224px', backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '2px dashed #d1d5db' }}>
              No QR
            </div>
          )}
        </div>

        {/* Google branding – centered */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div style={{ marginBottom: '2px' }}>
            <span style={{ fontSize: '20px', fontWeight: 500, color: '#4b5563' }}>Google</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', fontSize: '24px', color: '#eab308', marginBottom: '4px' }}>
            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#4b5563', marginBottom: '6px', wordSpacing: '0.08em', letterSpacing: '0.02em' }}>
            {title}
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', wordSpacing: '0.06em', letterSpacing: '0.015em' }}>
            {client.qr_subtitle || 'Your feedback helps us improve and grow.'}
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '2px', wordSpacing: '0.06em', letterSpacing: '0.015em' }}>
            {client.qr_tagline || 'Good days start with coffee 😊'}
          </p>
        </div>
      </div>

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
    </div>'use client';

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
    QRCode.toDataURL(targetUrl, { width: 224, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
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
        height: 580,
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

  const title = client.qr_title && client.qr_title !== 'Review u on Google' 
    ? client.qr_title 
    : 'Review us on Google';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* The card – purely inline styles for exact centering */}
      <div
        ref={cardRef}
        style={{
          width: '400px',
          height: '580px',
          padding: '32px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto', // ensure horizontal centering in any container
        }}
      >
        {/* Business name */}
        <div style={{ marginBottom: '8px', textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ color: '#6b7280', fontSize: '18px' }}>✦</span>
            <h3 style={{
              fontSize: '26px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #4a1942 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(0,0,0,0.08)',
              letterSpacing: '-0.5px',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {client.business_name}
            </h3>
            <span style={{ color: '#6b7280', fontSize: '18px' }}>✦</span>
          </div>
          <div style={{
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, #6b7280, #9ca3af)',
            margin: '4px auto 0',
            borderRadius: '1px',
          }} />
        </div>

        {/* QR Code */}
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          {loading ? (
            <div style={{ width: '224px', height: '224px', backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '2px dashed #d1d5db' }}>
              Generating QR…
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              style={{ width: '224px', height: '224px', objectFit: 'contain', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '8px', backgroundColor: '#ffffff' }}
            />
          ) : (
            <div style={{ width: '224px', height: '224px', backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '2px dashed #d1d5db' }}>
              No QR
            </div>
          )}
        </div>

        {/* Google branding */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div style={{ marginBottom: '2px' }}>
            <span style={{ fontSize: '20px', fontWeight: 500, color: '#4b5563' }}>Google</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', fontSize: '24px', color: '#eab308', marginBottom: '4px' }}>
            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#4b5563', marginBottom: '6px', wordSpacing: '0.08em', letterSpacing: '0.02em' }}>
            {title}
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', wordSpacing: '0.06em', letterSpacing: '0.015em' }}>
            {client.qr_subtitle || 'Your feedback helps us improve and grow.'}
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '2px', wordSpacing: '0.06em', letterSpacing: '0.015em' }}>
            {client.qr_tagline || 'Good days start with coffee 😊'}
          </p>
        </div>
      </div>

      <button
        onClick={downloadCard}
        style={{
          marginTop: '24px',
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
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af', textAlign: 'center', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 500 }}>Review link:</span> {client.google_review_link}
        </div>
      )}
    </div>
  );
}
  );
}