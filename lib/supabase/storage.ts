import { supabaseAdmin } from '@/lib/supabase/admin';

export async function uploadQRImages(slug: string, buffers: { main: Buffer, wallpaper: Buffer, sticker: Buffer }) {
  const folder = `qrcodes/${slug}`;

  const upload = async (name: string, buffer: Buffer, contentType = 'image/png') => {
    const { data, error } = await supabaseAdmin.storage
      .from('qrcodes')
      .upload(`${folder}/${name}`, buffer, { contentType, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabaseAdmin.storage.from('qrcodes').getPublicUrl(`${folder}/${name}`);
    return publicUrl;
  };

  const [main, wallpaper, sticker] = await Promise.all([
    upload('main.png', buffers.main),
    upload('wallpaper.png', buffers.wallpaper),
    upload('sticker.png', buffers.sticker),
  ]);

  return { main, wallpaper, sticker };
}
