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
    <div className="bg-white shadow rounded p-6 max-w-md mx-auto">
      <div className="text-center mb-4 text-sm text-gray-500">
        NFC card will be delivered to your provided address
      </div>
      <h2 className="text-xl font-bold text-center mb-6">{client.business_name}</h2>

      <div className="flex justify-center mb-8">
        {client.qr_main_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={client.qr_main_url}
            alt="QR Code"
            className="w-48 h-48 object-contain"
          />
        ) : (
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
            QR not generated
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <div className="text-2xl font-medium text-gray-700">Google</div>
        <div className="text-2xl text-yellow-500">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p className="text-sm text-gray-600 mt-2">
          Had a great experience? <br />
          Scan the QR Code and leave us a review
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {client.qr_main_url && (
          <a
            href={client.qr_main_url}
            download
            className="bg-black text-white px-3 py-1 rounded text-sm"
          >
            Download Main
          </a>
        )}
        {client.qr_wallpaper_url && (
          <a
            href={client.qr_wallpaper_url}
            download
            className="bg-black text-white px-3 py-1 rounded text-sm"
          >
            Download Wallpaper
          </a>
        )}
        {client.qr_sticker_url && (
          <a
            href={client.qr_sticker_url}
            download
            className="bg-black text-white px-3 py-1 rounded text-sm"
          >
            Download Sticker
          </a>
        )}
      </div>

      {client.google_review_link && (
        <div className="mt-4 text-xs text-gray-400 truncate">
          Review link: {client.google_review_link}
        </div>
      )}
    </div>
  );
}
