import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@alphaai.com';

export const email = {
  sendWelcome: async (to: string, businessName: string, accessCode: string) => {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to Alpha AI – ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1a1a2e, #4a1942); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Alpha AI</h1>
            <p style="color: #cbd5e1; margin: 4px 0 0;">Your AI receptionist</p>
          </div>
          <div style="padding: 24px; background: white; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${businessName}!</h2>
            <p style="color: #475569;">Your Alpha AI account has been created. Here is your access code:</p>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0f172a;">
              ${accessCode}
            </div>
            <p style="color: #475569; margin-top: 16px;">
              Log in at <a href="${process.env.NEXT_PUBLIC_BASE_URL}/live" style="color: #4285F4; text-decoration: none;">your dashboard</a> to manage your AI receptionist.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Alpha AI. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
  },

  sendCallSummary: async (to: string, businessName: string, callData: any) => {
    const {
      customer_name,
      customer_phone,
      summary,
      status,
      booked_time,
      address,
      recording_url,
    } = callData;

    const details = [
      { label: 'Customer', value: customer_name || 'Not provided' },
      { label: 'Phone', value: customer_phone || 'Not provided' },
      { label: 'Status', value: status || 'General Inquiry' },
      { label: 'Summary', value: summary || 'No summary' },
    ];

    if (booked_time) {
      details.push({ label: 'Appointment Time', value: booked_time });
    }
    if (address) {
      details.push({ label: 'Address', value: address });
    }

    const detailRows = details
      .map(
        (d) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; width: 40%;">${d.label}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${d.value}</td>
          </tr>
        `
      )
      .join('');

    const recordingHtml = recording_url
      ? `<p style="margin-top: 16px;"><a href="${recording_url}" style="color: #4285F4; text-decoration: none; font-weight: 500;">▶ Listen to recording</a></p>`
      : '';

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New Call Summary – ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1a1a2e, #4a1942); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">📞 New Call Received</h1>
            <p style="color: #cbd5e1; margin: 4px 0 0;">${businessName}</p>
          </div>
          <div style="padding: 24px; background: white; border-radius: 0 0 8px 8px;">
            <p style="color: #475569; margin-top: 0;">A new call was handled by your AI receptionist. Here are the details:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tbody>
                ${detailRows}
              </tbody>
            </table>

            ${recordingHtml}

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