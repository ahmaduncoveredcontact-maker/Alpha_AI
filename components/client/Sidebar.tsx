'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  QrCode, 
  Calendar, 
  Phone, 
  Clock, 
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  businessName: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'qr-code', label: 'QR Code', icon: QrCode },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'calls', label: 'Call Log', icon: Phone },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, theme, toggleTheme, businessName }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Navbar - visible on all screens */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              α
            </span>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Alpha AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{businessName}</span>
        </div>
      </nav>

      {/* Desktop Top Nav */}
      <div className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            α
          </span>
          <span className="text-lg font-semibold text-gray-800 dark:text-white">Alpha AI</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">| {businessName}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400"
            onClick={() => {
              document.cookie = 'client_session=; path=/; max-age=0';
              window.location.href = '/';
            }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40
          w-64 h-screen
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-700
          flex flex-col flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:top-0 lg:sticky
        `}
      >
        {/* Brand with Close button on RIGHT */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              α
            </span>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Alpha AI</span>
          </div>
          {/* Close button on RIGHT corner */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 px-6 pb-4 truncate">{businessName}</p>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700 dark:text-blue-400' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                Light Mode
              </>
            )}
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            onClick={() => {
              document.cookie = 'client_session=; path=/; max-age=0';
              window.location.href = '/';
            }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}