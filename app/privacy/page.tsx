// app/privacy/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              Alpha AI collects the following information when you sign in with Google:
            </p>
            <ul>
              <li>
                <strong>Email address</strong> – To identify your account and send notifications.
              </li>
              <li>
                <strong>Google Business Profile access</strong> – To read and reply to reviews on your behalf.
              </li>
              <li>
                <strong>Gmail access</strong> – To read review notification emails and process replies automatically.
              </li>
            </ul>
            <p>
              We only access emails from <code>noreply-maps-business@google.com</code> that contain review notifications. We do not read any other emails.
            </p>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>To provide AI-powered review replies for your Google Business Profile.</li>
              <li>To log calls and appointments in your dashboard.</li>
              <li>To send you email notifications about new reviews and calls.</li>
              <li>To improve our AI models (anonymized).</li>
            </ul>

            <h2>3. Data Storage</h2>
            <p>
              Your data is stored in secure Supabase databases with encryption at rest. We do not share your data with third parties except:
            </p>
            <ul>
              <li><strong>Mistral AI</strong> – To generate review reply content (anonymized).</li>
              <li><strong>Google</strong> – For API access (Gmail and Business Profile).</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>
              We retain your data as long as you have an active account. You may request deletion at any time. Upon deletion, your data is permanently removed from our systems within 30 days.
            </p>

            <h2>5. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access the data we hold about you.</li>
              <li>Correct any inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p>
              To exercise these rights, contact us at <strong>support@alphaai.usethesetools.com</strong>.
            </p>

            <h2>6. Security</h2>
            <p>
              We use industry-standard encryption and security measures to protect your data. All API communications are over HTTPS.
            </p>

            <h2>7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2>8. Contact</h2>
            <p>
              For any privacy-related questions or concerns, please contact us at:
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