import QRCode from 'qrcode';

export async function generateQRImages(url: string): Promise<{ main: Buffer; wallpaper: Buffer; sticker: Buffer }> {
  const opts: QRCode.QRCodeToBufferOptions = {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  };

  const [main, wallpaper, sticker] = await Promise.all([
    QRCode.toBuffer(url, { ...opts, width: 500 }),
    QRCode.toBuffer(url, { ...opts, width: 1200 }),
    QRCode.toBuffer(url, { ...opts, width: 300 }),
  ]);

  return {
    main: main as Buffer,
    wallpaper: wallpaper as Buffer,
    sticker: sticker as Buffer,
  };
}