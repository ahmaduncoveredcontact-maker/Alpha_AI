import Image from 'next/image';

interface Client {
  business_name: string;
  qr_main_url?: string;
  qr_wallpaper_url?: string;
  qr_sticker_url?: string;
  google_review_link?: string;
  slug: string;
}

export default function QRDisplay({ client }: { client: Client }) {
  return (
    <div className="flex flex-col items-center">
      {/* QR Card – professional, centered */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-100 transition-all hover:shadow-3xl hover:scale-[1.02] duration-300">
        {/* Business name */}
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{client.business_name}</h3>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          {client.qr_main_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={client.qr_main_url}
              alt="QR Code to leave a review"
              className="w-48 h-48 object-contain border-2 border-gray-200 rounded-xl p-2 bg-white shadow-inner"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
              <span>No QR yet</span>
            </div>
          )}
        </div>

        {/* Google Branding */}
        <div className="text-center space-y-1">
          <div className="flex justify-center items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-xl font-medium text-gray-700">Google</span>
          </div>
          <div className="flex justify-center space-x-0.5 text-2xl text-yellow-500">
            <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
          </div>
          <p className="text-sm text-gray-600 font-medium mt-1">Review us on Google</p>
          <p className="text-xs text-gray-400">Your feedback helps us improve and grow.</p>
          <p className="text-xs text-gray-400 italic mt-1">Good days start with coffee ❤️</p>
        </div>
      </div>

      {/* Download Buttons – separate section */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {client.qr_main_url && (
          <a
            href={client.qr_main_url}
            download
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium shadow hover:bg-gray-800 transition-all hover:shadow-lg hover:scale-105"
          >
            Download Main
          </a>
        )}
        {client.qr_wallpaper_url && (
          <a
            href={client.qr_wallpaper_url}
            download
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium shadow hover:bg-gray-800 transition-all hover:shadow-lg hover:scale-105"
          >
            Download Wallpaper
          </a>
        )}
        {client.qr_sticker_url && (
          <a
            href={client.qr_sticker_url}
            download
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium shadow hover:bg-gray-800 transition-all hover:shadow-lg hover:scale-105"
          >
            Download Sticker
          </a>
        )}
      </div>

      {/* Optional: Direct review link */}
      {client.google_review_link && (
        <div className="mt-4 text-xs text-gray-400 truncate max-w-xs">
          <span className="font-medium">Review link:</span> {client.google_review_link}
        </div>
      )}
    </div>
  );
}