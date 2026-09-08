// app/page.tsx
import Link from 'next/link';
import { ArrowRight, Phone, Star, Calendar, BarChart3, Sparkles, MessageSquare, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            α
          </span>
          <span className="text-xl font-bold text-gray-800 dark:text-white">Alpha AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin-login"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Admin Login
          </Link>
          <Link
            href="/admin/new"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Get Started
            <ArrowRight className="w-4 h-4 inline ml-1" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-blue-700 dark:text-blue-300 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            AI-powered receptionist for local businesses
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            Your AI Receptionist
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Never Miss a Lead
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mt-6 max-w-2xl mx-auto">
            Alpha AI answers calls 24/7, books appointments instantly, and auto-replies to reviews — turning every lead into a paying customer.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href="/admin/new"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3.5 rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-8 py-3.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Everything You Need to Grow
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            AI-powered tools designed for local service businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 dark:hover:border-blue-800"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              α
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Alpha AI</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Terms of Service
            </Link>
            <a href="mailto:support@alphaai.usethesetools.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Contact
            </a>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Alpha AI. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}

// Feature data
const features = [
  {
    icon: <Phone className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
    title: '24/7 AI Receptionist',
    description: 'Answers every call, books appointments, and captures leads — even when you\'re asleep.',
  },
  {
    icon: <Star className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />,
    title: 'Auto Review Responder',
    description: 'Automatically replies to 5-star Google reviews with AI-generated responses that build trust.',
  },
  {
    icon: <Calendar className="w-7 h-7 text-purple-600 dark:text-purple-400" />,
    title: 'Smart Scheduling',
    description: 'Integrates with Cal.com to book appointments instantly, syncing with your calendar.',
  },
  {
    icon: <BarChart3 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
    title: 'Live Dashboard',
    description: 'See all calls, bookings, and reviews in one place — updated in real-time.',
  },
  {
    icon: <MessageSquare className="w-7 h-7 text-rose-600 dark:text-rose-400" />,
    title: 'Smart Follow-ups',
    description: 'Automatically calls back leads within 30 seconds of form submission — never lose a customer.',
  },
  {
    icon: <Zap className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
    title: 'Zero-Touch Setup',
    description: 'Sign in with Google once — no technical skills required. Everything runs automatically.',
  },
];