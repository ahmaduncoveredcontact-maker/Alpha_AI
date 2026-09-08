import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/gbp/token';
import { generateReply } from '@/lib/reviews/openrouter';

const GMAIL_SENDER = 'noreply-maps-business@google.com';
const GMAIL_SUBJECT = 'New review';

export async function processReviewEmailsForClient(slug: string) {
  // 1. Get valid access token (refreshes if needed)
  const accessToken = await getValidAccessToken(slug);
  if (!accessToken) return { error: 'No valid token' };

  // 2. Initialize Gmail API
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth });

  // 3. Search for unread review notification emails
  const query = `from:${GMAIL_SENDER} subject:"${GMAIL_SUBJECT}" is:unread`;
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 10,
  });

  const messages = res.data.messages || [];
  if (!messages.length) return { processed: 0 };

  let processed = 0;

  for (const msg of messages) {
    try {
      // 4. Get full email content
      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      });

      const emailData = msgRes.data;
      const htmlPart = emailData.payload?.parts?.find((p: any) => p.mimeType === 'text/html');
      const htmlContent = htmlPart?.body?.data
        ? Buffer.from(htmlPart.body.data, 'base64').toString('utf-8')
        : '';

      // 5. Parse review text and reply URL
      const reviewText = extractReviewText(htmlContent);
      const replyUrl = extractReplyUrl(htmlContent);

      if (!replyUrl || !reviewText) {
        await markEmailAsRead(gmail, msg.id!);
        continue;
      }

      // 6. Generate AI reply
      const businessName = await getBusinessName(slug);
      const aiReply = await generateReply(reviewText, businessName || 'our business');

      if (!aiReply) {
        await markEmailAsRead(gmail, msg.id!);
        continue;
      }

      // 7. POST reply to Google Maps
      const success = await postReplyToGoogle(replyUrl, aiReply);

      if (success) {
        // 8. Mark email as read so we don't process it again
        await markEmailAsRead(gmail, msg.id!);
        processed++;
        console.log(`✅ Replied to review for client ${slug}`);
      } else {
        console.warn(`⚠️ Reply failed for client ${slug}, will retry`);
      }
    } catch (err) {
      console.error(`Failed to process email ${msg.id}:`, err);
    }
  }

  return { processed };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function extractReviewText(html: string): string | null {
  const match = html.match(/"([^"]+)"\s*Left a review/);
  return match ? match[1] : null;
}

function extractReplyUrl(html: string): string | null {
  const match = html.match(/href="(https:\/\/business\.google\.com\/[^"]+\/reviews\/reply\/[^"]+)"/);
  return match ? match[1] : null;
}

async function markEmailAsRead(gmail: any, messageId: string) {
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

async function postReplyToGoogle(replyUrl: string, replyText: string): Promise<boolean> {
  try {
    const formData = new URLSearchParams();
    formData.append('comment', replyText);
    formData.append('action', 'reply');

    const res = await fetch(replyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    return res.ok;
  } catch {
    return false;
  }
}

async function getBusinessName(slug: string): Promise<string | null> {
  const { supabaseAdmin } = await import('@/lib/supabase/admin');
  const { data } = await supabaseAdmin
    .from('clients')
    .select('business_name')
    .eq('slug', slug)
    .single();
  return data?.business_name || null;
}