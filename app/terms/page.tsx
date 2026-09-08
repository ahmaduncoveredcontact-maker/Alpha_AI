// app/terms/page.tsx
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, Shield, AlertCircle, Mail } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8" />
              <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-purple-100/80 text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-100 dark:border-green-800/30">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Clear & fair terms</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800/30">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Your data is protected</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center border border-amber-100 dark:border-amber-800/30">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Liability limited</p>
                </div>
              </div>

              <h2>1. Acceptance of Terms</h2>
              <p>
                By using Alpha AI ("the Service"), you agree to these Terms of Service. If you do not agree, please do not use the Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>Alpha AI provides AI-powered receptionist services including:</p>
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

              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 my-4 rounded-r-xl">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>⚠️ Important:</strong> AI-generated replies should be reviewed before posting. You are responsible for the final content.
                </p>
              </div>

              <h2>4. Service Availability</h2>
              <p>
                We strive to provide 99.9% uptime but do not guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue any feature of the Service at any time.
              </p>

              <h2>5. User Responsibilities</h2>
              <ul>
                <li>You agree not to use the Service for any illegal or unauthorized purpose.</li>
                <li>You are responsible for reviewing and approving AI-generated replies before they are posted.</li>
                <li>You acknowledge that AI-generated content may contain errors and you assume full responsibility for the final reply.</li>
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

              <h2>9. Termination</h2>
              <p>
                We may terminate or suspend your account at any time without prior notice for violation of these Terms or for any other reason.
              </p>

              <h2>10. Contact</h2>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800/30 flex items-center gap-4">
                <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Questions about these Terms?</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    <a href="mailto:help.alphaai@gmail.com">help.alphaai@gmail.com</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
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
    </div>
  );
}