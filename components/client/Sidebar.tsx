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
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'qr-code', label: 'QR Code', icon: QrCode },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'calls', label: 'Call Log', icon: Phone },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme,
  isMobileMenuOpen,
  setIsMobileMenuOpen 
}: SidebarProps) {
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40
          w-64 h-full
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-700
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-0
        `}
      >
        {/* Close button - visible only on mobile, at top right */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

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

        {/* Footer with theme toggle and logout */}
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