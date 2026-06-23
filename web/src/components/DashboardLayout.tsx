'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../app/providers';
import { useLanguage } from '../app/providers';
import { 
  LayoutDashboard, 
  UserSquare2, 
  Calculator, 
  Bot, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Languages,
  Users
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsImpersonating(!!localStorage.getItem('adminToken'));
  }, []);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    { label: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('profileWizard'), path: '/profile-wizard', icon: UserSquare2 },
    { label: t('taxComputation'), path: '/computation-wizard', icon: Calculator },
    { label: t('aiAssistant'), path: '/ai-assistant', icon: Bot },
  ];

  // Admin link
  if (user?.role === 'ADMIN') {
    navItems.push({ label: t('userDirectory'), path: '/admin?tab=users', icon: Users });
    navItems.push({ label: t('adminPanel'), path: '/admin', icon: ShieldAlert });
  }

  const isItemActive = (itemPath: string) => {
    if (itemPath.includes('?')) {
      const [basePath, searchStr] = itemPath.split('?');
      if (pathname !== basePath) return false;
      if (typeof window !== 'undefined') {
        return window.location.search.includes(searchStr);
      }
      return false;
    }
    if (itemPath === '/admin') {
      if (pathname !== '/admin') return false;
      if (typeof window !== 'undefined' && window.location.search.includes('tab=')) {
        const search = window.location.search;
        return !search.includes('tab=') || search.includes('tab=stats');
      }
      return true;
    }
    return pathname === itemPath || pathname?.startsWith(itemPath + '/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* -------------------- DESKTOP SIDEBAR -------------------- */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4">
        {/* Branding Logo */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <img src="/logo.png" alt="TaxCompute.in" className="w-10 h-10 rounded-xl object-cover shadow-md border border-slate-100 dark:border-slate-800" />
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
              TaxCompute<span className="text-blue-600 dark:text-sky-400 font-semibold">.in</span>
            </h1>
            <span className="text-2xs text-slate-400 uppercase font-bold tracking-wider">CA Portal Hub</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile details u/s Logout */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="px-2">
            <p className="text-xs text-slate-400 truncate">LOGGED IN AS</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
              {user?.email}
            </p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-2xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* -------------------- MOBILE HEADER -------------------- */}
      <header className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="TaxCompute.in" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-slate-100 dark:border-slate-800" />
          <span className="text-md font-black text-slate-900 dark:text-white tracking-tight">
            TaxCompute<span className="text-blue-600 dark:text-sky-400 font-semibold">.in</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside className={`md:hidden fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 p-4 border-r border-slate-200 dark:border-slate-800 transition-transform transform ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TaxCompute.in" className="w-7 h-7 rounded-md object-cover shadow-sm" />
            <span className="font-black text-slate-900 dark:text-white tracking-tight">
              TaxCompute<span className="text-blue-600 dark:text-sky-400">.in</span>
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)}>
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  active 
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* -------------------- MAIN PAGE WRAPPER -------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar controls */}
        <header className="hidden md:flex items-center justify-end bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 gap-4">
          
          {/* Multi-language Selector */}
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-800">
            <Languages className="w-4 h-4 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="text-xs bg-transparent font-medium border-none outline-none cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="pa">ਪੰਜਾਬੀ</option>
            </select>
          </div>

          {/* Theme Toggler */}
          <button
            onClick={toggleDarkMode}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors text-slate-500 dark:text-slate-400"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-yellow-500" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
          </button>
        </header>

        {/* Mobile controls bar */}
        <div className="md:hidden flex items-center justify-end bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 gap-3">
          <Languages className="w-4 h-4 text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="text-xs bg-transparent outline-none cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
            <option value="pa">PA</option>
          </select>
          <button onClick={toggleDarkMode} className="p-1 text-slate-500">
            {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-slate-900 px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-sm shrink-0 border-b border-amber-600/30">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
              </span>
              Impersonation Mode Active: Viewing user portal ({user?.email})
            </span>
            <button
              onClick={() => {
                const adminToken = localStorage.getItem('adminToken');
                const adminUser = localStorage.getItem('adminUser');
                if (adminToken && adminUser) {
                  localStorage.removeItem('adminToken');
                  localStorage.removeItem('adminUser');
                  localStorage.setItem('token', adminToken);
                  localStorage.setItem('user', adminUser);
                  window.location.href = '/admin';
                }
              }}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer text-[10px]"
            >
              Return to Admin
            </button>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
};
