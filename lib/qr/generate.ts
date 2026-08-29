import QRCode from 'qrcode';

export async function generateQRImages(url: string) {
  const opts = {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 500,
    color: { dark: '#000000', light: '#ffffff' },
  };

  // Main 500px
  const mainBuffer = await QRCode.toBuffer(url, { ...opts, width: 500 });
  // Wallpaper 1200px
  const wallpaperBuffer = await QRCode.toBuffer(url, { ...opts, width: 1200 });
  // Sticker 300px
  const stickerBuffer = await QRCode.toBuffer(url, { ...opts, width: 300 });

  return { main: mainBuffer, wallpaper: wallpaperBuffer, sticker: stickerBuffer };
}
