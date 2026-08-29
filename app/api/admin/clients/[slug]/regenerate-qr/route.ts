import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateQRImages } from '@/lib/qr/generate';
import { uploadQRImages } from '@/lib/supabase/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Ensure bucket exists
    const bucketName = 'qrcodes';
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.error('List buckets error:', listError);
      return NextResponse.json({ error: 'Failed to list buckets' }, { status: 500 });
    }
    const bucketExists = buckets.some((b: any) => b.name === bucketName);
    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png'],
      });
      if (createError) {
        console.error('Create bucket error:', createError);
        return NextResponse.json({ error: `Failed to create bucket: ${createError.message}` }, { status: 500 });
      }
      console.log('✅ Created bucket: qrcodes');
    }

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
    console.error('QR regeneration error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}