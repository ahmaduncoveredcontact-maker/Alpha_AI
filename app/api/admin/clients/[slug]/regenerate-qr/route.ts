import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateQRImages } from '@/lib/qr/generate';
import { uploadQRImages } from '@/lib/supabase/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${params.slug}`;
    const qrBuffers = await generateQRImages(redirectUrl);
    const qrUrls = await uploadQRImages(params.slug, qrBuffers);

    await supabaseAdmin
      .from('clients')
      .update({
        qr_main_url: qrUrls.main,
        qr_wallpaper_url: qrUrls.wallpaper,
        qr_sticker_url: qrUrls.sticker,
      })
      .eq('id', client.id);

    return NextResponse.json({ success: true, qrUrls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
