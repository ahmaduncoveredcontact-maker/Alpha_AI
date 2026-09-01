import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@alphaai.com';

export const email = {
  sendWelcome: async (to: string, businessName: string, accessCode: string) => {
    // ... (keep as is)
  },

  sendCallSummary: async (to: string, businessName: string, callData: any) => {
    // ... (keep as is)
  },

  // NEW: Notify when a call log is updated or deleted
  sendCallUpdate: async (
    to: string,
    businessName: string,
    callData: any,
    action: 'updated' | 'deleted'
  ) => {
    const subject = action === 'updated' ? 'Call Log Updated' : 'Call Log Deleted';
    const actionText = action === 'updated' ? 'updated' : 'removed';
    const actionEmoji = action === 'updated' ? '✏️' : '🗑️';

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${subject} – ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1a1a2e, #4a1942); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">${actionEmoji} Call Log ${action === 'updated' ? 'Updated' : 'Deleted'}</h1>
            <p style="color: #cbd5e1; margin: 4px 0 0;">${businessName}</p>
          </div>
          <div style="padding: 24px; background: white; border-radius: 0 0 8px 8px;">
            <p style="color: #475569; margin-top: 0;">A call log has been <strong>${actionText}</strong> for <strong>${businessName}</strong>.</p>
            ${action === 'updated' ? `
              <p><strong>Updated details:</strong></p>
              <ul style="color: #475569; padding-left: 20px;">
                <li><strong>Customer:</strong> ${callData.customer_name}</li>
                <li><strong>Phone:</strong> ${callData.customer_phone}</li>
                <li><strong>Summary:</strong> ${callData.summary}</li>
                <li><strong>Status:</strong> ${callData.status}</li>
                <li><strong>Time:</strong> ${new Date(callData.timestamp).toLocaleString()}</li>
                ${callData.booked_time ? `<li><strong>Booked Time:</strong> ${callData.booked_time}</li>` : ''}
                ${callData.address ? `<li><strong>Address:</strong> ${callData.address}</li>` : ''}
              </ul>
            ` : `
              <p><strong>Removed call:</strong></p>
              <ul style="color: #475569; padding-left: 20px;">
                <li><strong>Customer:</strong> ${callData.customer_name}</li>
                <li><strong>Phone:</strong> ${callData.customer_phone}</li>
                <li><strong>Original summary:</strong> ${callData.summary}</li>
                <li><strong>Original status:</strong> ${callData.status}</li>
                <li><strong>Time:</strong> ${new Date(callData.timestamp).toLocaleString()}</li>
              </ul>
            `}
            <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">This change was made from your client dashboard.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/live" style="background: #4285F4; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                View Dashboard
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
              © ${new Date().getFullYear()} Alpha AI – Your trusted AI receptionist.
            </p>
          </div>
        </div>
      `,
    });
  },
};