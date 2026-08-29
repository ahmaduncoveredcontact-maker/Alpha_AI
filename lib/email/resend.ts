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
        <h1>Welcome!</h1>
        <p>Your Alpha AI account for <strong>${businessName}</strong> has been created.</p>
        <p>Your access code: <strong>${accessCode}</strong></p>
        <p>Log in at: ${process.env.NEXT_PUBLIC_BASE_URL}/live/your-slug</p>
      `,
    });
  },
  sendCallSummary: async (to: string, businessName: string, callData: any) => {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New Call Summary – ${businessName}`,
      html: `
        <h2>New Call Received</h2>
        <p><strong>Customer:</strong> ${callData.customer_name}</p>
        <p><strong>Phone:</strong> ${callData.customer_phone}</p>
        <p><strong>Summary:</strong> ${callData.summary}</p>
        <p><strong>Status:</strong> ${callData.status}</p>
        ${callData.recording_url ? `<p><a href="${callData.recording_url}">Listen to recording</a></p>` : ''}
      `,
    });
  },
};
