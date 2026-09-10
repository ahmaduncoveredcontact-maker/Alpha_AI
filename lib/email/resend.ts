import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@alphaai.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://alphaai.usethesetools.com';

// ── Shared layout wrapper ──
const layout = (title: string, emoji: string, subtitle: string, body: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
    <div style="background: linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${emoji} ${title}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px;">${subtitle}</p>
    </div>
    <div style="padding: 32px 24px; background: white; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
      ${body}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} <strong>Alpha AI</strong> — Your trusted AI receptionist.
      </p>
    </div>
  </div>
`;

const button = (text: string, url: string) => `
  <div style="text-align: center; margin: 24px 0;">
    <a href="${url}" style="background: #4285F4; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 14px;">
      ${text}
    </a>
  </div>
`;

export const email = {
  // ── 1. Welcome email to new client ──
  sendWelcome: async (to: string, businessName: string, accessCode: string) => {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Welcome to Alpha AI – ${businessName}`,
        html: layout(
          'Welcome to Alpha AI',
          '🎉',
          businessName,
          `
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Hi there! Your AI receptionist is now live and ready to answer calls 24/7.
            </p>
            <div style="background: #f1f5f9; border-left: 4px solid #4285F4; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px; color: #475569; font-size: 13px; font-weight: 600;">YOUR ACCESS CODE</p>
              <p style="margin: 0; font-family: monospace; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: 4px;">
                ${accessCode}
              </p>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Use this code to access your dashboard. Keep it safe — you'll need it every time you log in.
            </p>
            ${button('Open Your Dashboard', `${BASE_URL}/live/${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)}
            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-top: 20px;">
              <strong>What happens next?</strong><br />
              • Your AI assistant answers every call<br />
              • Bookings sync to your calendar automatically<br />
              • Call summaries arrive in your inbox<br />
              • We notify you of new leads instantly
            </p>
          `
        ),
      });
      console.log(`✅ Welcome email sent to ${to}`);
    } catch (error: any) {
      console.error('❌ Welcome email failed:', error.message);
      throw error;
    }
  },

  // ── 2. Call summary email to business owner ──
  sendCallSummary: async (to: string, businessName: string, callData: any) => {
    const {
      customer_name,
      customer_phone,
      summary,
      status,
      booked_time,
      recording_url,
      address,
      timestamp,
      call_type,
    } = callData;

    const statusColors: Record<string, string> = {
      'Booked': '#34A853',
      'Emergency': '#EA4335',
      'General Inquiry': '#4285F4',
      'No Answer': '#94a3b8',
      'Rate Limited': '#FBBC05',
      'Completed': '#34A853',
    };
    const statusColor = statusColors[status] || '#94a3b8';

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `📞 New Call – ${customer_name || 'Unknown'} (${status})`,
        html: layout(
          'New Call Received',
          '📞',
          businessName,
          `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div style="display: inline-block; padding: 4px 12px; background: ${statusColor}20; border: 1px solid ${statusColor}; border-radius: 999px; color: ${statusColor}; font-size: 12px; font-weight: 600;">
                ${status || 'Unknown'}
              </div>
              <span style="color: #94a3b8; font-size: 12px;">
                ${call_type === 'outbound' ? '↗ Outbound' : '↙ Inbound'} • ${new Date(timestamp).toLocaleString()}
              </span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; width: 120px; color: #64748b;">Customer</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><strong>${customer_name || 'Unknown'}</strong></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Phone</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${customer_phone || '—'}</td>
              </tr>
              ${booked_time ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Booked for</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><strong style="color: #34A853;">${booked_time}</strong></td>
              </tr>
              ` : ''}
              ${address ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Address</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${address}</td>
              </tr>
              ` : ''}
            </table>

            <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #4285F4;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: 600;">CALL SUMMARY</p>
              <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
                ${summary || 'No summary available.'}
              </p>
            </div>

            ${recording_url ? `
              <div style="text-align: center; margin-top: 16px;">
                <a href="${recording_url}" style="color: #4285F4; text-decoration: none; font-size: 14px; font-weight: 500;">
                  🎧 Listen to Recording
                </a>
              </div>
            ` : ''}

            ${button('View Full Call Log', `${BASE_URL}/live`)}
          `
        ),
      });
      console.log(`✅ Call summary sent to ${to}`);
    } catch (error: any) {
      console.error('❌ Call summary failed:', error.message);
      throw error;
    }
  },

  // ── 3. Notify when a call log is updated or deleted ──
  sendCallUpdate: async (
    to: string,
    businessName: string,
    callData: any,
    action: 'updated' | 'deleted'
  ) => {
    const subject = action === 'updated' ? 'Call Log Updated' : 'Call Log Deleted';
    const actionText = action === 'updated' ? 'updated' : 'removed';
    const actionEmoji = action === 'updated' ? '✏️' : '🗑️';

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `${subject} – ${businessName}`,
        html: layout(
          `Call Log ${action === 'updated' ? 'Updated' : 'Deleted'}`,
          actionEmoji,
          businessName,
          `
            <p style="color: #475569; margin-top: 0; font-size: 15px;">
              A call log has been <strong>${actionText}</strong> for <strong>${businessName}</strong>.
            </p>
            ${action === 'updated' ? `
              <p style="color: #64748b; font-size: 13px; font-weight: 600; margin-bottom: 8px;">UPDATED DETAILS</p>
              <ul style="color: #475569; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                <li><strong>Customer:</strong> ${callData.customer_name}</li>
                <li><strong>Phone:</strong> ${callData.customer_phone}</li>
                <li><strong>Summary:</strong> ${callData.summary}</li>
                <li><strong>Status:</strong> ${callData.status}</li>
                <li><strong>Time:</strong> ${new Date(callData.timestamp).toLocaleString()}</li>
                ${callData.booked_time ? `<li><strong>Booked Time:</strong> ${callData.booked_time}</li>` : ''}
                ${callData.address ? `<li><strong>Address:</strong> ${callData.address}</li>` : ''}
              </ul>
            ` : `
              <p style="color: #64748b; font-size: 13px; font-weight: 600; margin-bottom: 8px;">REMOVED CALL</p>
              <ul style="color: #475569; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                <li><strong>Customer:</strong> ${callData.customer_name}</li>
                <li><strong>Phone:</strong> ${callData.customer_phone}</li>
                <li><strong>Original summary:</strong> ${callData.summary}</li>
                <li><strong>Original status:</strong> ${callData.status}</li>
                <li><strong>Time:</strong> ${new Date(callData.timestamp).toLocaleString()}</li>
              </ul>
            `}
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
              This change was made from your client dashboard.
            </p>
            ${button('View Dashboard', `${BASE_URL}/live`)}
          `
        ),
      });
      console.log(`✅ Call ${action} notification sent to ${to}`);
    } catch (error: any) {
      console.error(`❌ Call ${action} email failed:`, error.message);
      throw error;
    }
  },
};