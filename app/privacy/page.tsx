// app/privacy/page.tsx
import Link from 'next/link';
import { ArrowLeft, Shield, Mail, Lock, Server, Database, Eye, Trash2 } from 'lucide-react';

export default function PrivacyPage() {
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8" />
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-blue-100/80 text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800/30">
                  <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">We only access review emails</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-100 dark:border-green-800/30">
                  <Lock className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Encrypted data storage</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center border border-purple-100 dark:border-purple-800/30">
                  <Trash2 className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Delete data anytime</p>
                </div>
              </div>

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
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-4 rounded-r-xl">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>📧 We only access emails from</strong> <code className="bg-yellow-100 dark:bg-yellow-800/30 px-2 py-0.5 rounded">noreply-maps-business@google.com</code> 
                  {' '}that contain review notifications. We do not read any other emails.
                </p>
              </div>

              <h2>2. How We Use Your Information</h2>
              <ul>
                <li>To provide AI-powered review replies for your Google Business Profile.</li>
                <li>To log calls and appointments in your dashboard.</li>
                <li>To send you email notifications about new reviews and calls.</li>
                <li>To improve our AI models (anonymized).</li>
              </ul>

              <h2>3. Data Storage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-sm font-medium">Secure Supabase Database</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Encryption at rest and in transit</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
                  <p className="text-sm font-medium">Data Retention</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Stored until you request deletion</p>
                </div>
              </div>

              <h2>4. Data Retention</h2>
              <p>
                We retain your data as long as you have an active account. You may request deletion at any time. Upon deletion, your data is permanently removed from our systems within 30 days.
              </p>

              <h2>5. Your Rights</h2>
              <ul>
                <li>Access the data we hold about you.</li>
                <li>Correct any inaccurate data.</li>
                <li>Request deletion of your data.</li>
                <li>Withdraw consent at any time.</li>
              </ul>

              <h2>6. Security</h2>
              <p>
                We use industry-standard encryption and security measures to protect your data. All API communications are over HTTPS.
              </p>

              <h2>7. Contact</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800/30 flex items-center gap-4">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Questions about this Privacy Policy?</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
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