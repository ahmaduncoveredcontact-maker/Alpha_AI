// app/terms/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-700/50">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By using Alpha AI ("the Service"), you agree to these Terms of Service. If you do not agree, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Alpha AI provides AI-powered receptionist services including:
            </p>
            <ul>
              <li>Inbound and outbound call handling.</li>
              <li>Appointment booking via Cal.com integration.</li>
              <li>Automated reply generation for Google reviews.</li>
              <li>Live dashboard for tracking calls, bookings, and reviews.</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
              You must sign in with a valid Google account to use the Service. You are responsible for maintaining the security of your account and any activities that occur under your account.
            </p>

            <h2>4. Service Availability</h2>
            <p>
              We strive to provide 99.9% uptime but do not guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue any feature of the Service at any time.
            </p>

            <h2>5. User Responsibilities</h2>
            <ul>
              <li>
                You agree not to use the Service for any illegal or unauthorized purpose.
              </li>
              <li>
                You are responsible for reviewing and approving AI-generated replies before they are posted.
              </li>
              <li>
                You acknowledge that AI-generated content may contain errors and you assume full responsibility for the final reply.
              </li>
            </ul>

            <h2>6. Payments & Refunds</h2>
            <p>
              Alpha AI is currently free. If we introduce paid plans in the future, we will notify you in advance and provide clear pricing terms.
            </p>

            <h2>7. Intellectual Property</h2>
            <p>
              All content, logos, and software on Alpha AI are the property of Alpha AI or its licensors and are protected by copyright and other intellectual property laws.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              Alpha AI is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of the Service.
            </p>

            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify and hold Alpha AI harmless from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
            </p>

            <h2>10. Termination</h2>
            <p>
              We may terminate or suspend your account at any time without prior notice for violation of these Terms or for any other reason.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of Pakistan. Any disputes shall be resolved in the courts of Pakistan.
            </p>

            <h2>12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes constitutes your acceptance of the new Terms.
            </p>

            <h2>13. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:support@alphaai.usethesetools.com">support@alphaai.usethesetools.com</a>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}