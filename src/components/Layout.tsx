import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Package,
  Receipt,
  ShieldCheck,
  Cloud,
  RefreshCw,
  LogOut,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DoodleSparkle, WavyCoralUnderline } from './Doodles';
import { exportDatabaseToExcel } from '../services/googleSheetsService';
import { IosInstallPrompt } from './IosInstallPrompt';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    db,
    currentUser,
    isSuperAdmin,
    canManageBusinessAndProducts,
    sheetsWebhookUrl,
    isSyncing,
    lastSyncTime,
    pullFromGoogleSheets,
    logout,
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const isMember = currentUser?.role === 'member';
  const activeBusinesses = db.businesses.filter((b) => !b.is_archived);
  const defaultBizId =
    activeBusinesses[0]?.id || db.businesses[0]?.id || 'biz-revelation-coffee';

  const matchBiz = location.pathname.match(/^\/business\/([^/]+)/);
  const currentBusinessId = matchBiz ? matchBiz[1] : '';

  // Navigation items: Member ONLY sees "Input Transaksi", Super Admin ONLY sees "Super Admin"
  const navItems = [
    {
      label: 'Global Dashboard',
      shortLabel: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      visible: !isMember,
      isActive:
        location.pathname === '/dashboard' ||
        (location.pathname.startsWith('/business/') &&
          location.pathname.endsWith('/dashboard')),
    },
    {
      label: 'Input Transaksi',
      shortLabel: 'Transaksi',
      path: '/transactions',
      icon: Receipt,
      visible: true,
      isActive: location.pathname === '/transactions',
    },
    {
      label: 'Kelola Bisnis',
      shortLabel: 'Bisnis',
      path: '/businesses',
      icon: Briefcase,
      visible: canManageBusinessAndProducts,
      isActive: location.pathname === '/businesses',
    },
    {
      label: 'Produk & HPP',
      shortLabel: 'HPP Produk',
      path: `/business/${currentBusinessId || defaultBizId}/products`,
      icon: Package,
      visible: canManageBusinessAndProducts,
      isActive: location.pathname.includes('/products'),
    },
    {
      label: 'Super Admin',
      shortLabel: 'Super Admin',
      path: '/super-admin',
      icon: ShieldCheck,
      visible: isSuperAdmin,
      isActive: location.pathname === '/super-admin',
    },
  ].filter((item) => item.visible);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink pb-28 md:pb-12">
      {/* Top Editorial Header Bar (Optimized for iPhone notch & Dynamic Island with pt-safe) */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md pt-safe border-b border-ink/5">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Brand Logo */}
            <Link
              to={isMember ? '/transactions' : '/dashboard'}
              className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-cobalt flex items-center justify-center text-white font-serif font-extrabold text-lg sm:text-xl shadow-sm group-hover:rotate-[-4deg] transition-transform relative">
                R
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-pastel-yellow border-2 border-cream" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-extrabold text-base sm:text-xl text-cobalt tracking-tight">
                    Revelation
                  </span>
                  <span className="font-serif font-extrabold text-base sm:text-xl text-ink hidden xs:inline">
                    Group
                  </span>
                  <DoodleSparkle className="w-3.5 h-3.5 hidden sm:inline-block" color="#F25C54" />
                </div>
                <p className="font-hand text-xs sm:text-sm text-ink/70 -mt-1 hidden sm:block">
                  Multi-Business COGS & Profit Tracker
                </p>
              </div>
            </Link>

            {/* Right Controls: [Super Admin Only: Export Excel & Sheets Live] + [Semua Bisnis] + [Profile] */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Export Excel & Sheets Live — ONLY visible to Super Admin */}
              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => exportDatabaseToExcel(db)}
                    title="Download / Export Database ke File Excel (.xls)"
                    className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-profit-bg text-profit-text border border-profit-accent text-xs font-bold hover:brightness-95 transition whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>

                  {sheetsWebhookUrl ? (
                    <button
                      onClick={() => pullFromGoogleSheets()}
                      disabled={isSyncing}
                      title={`Google Sheets Terhubung${
                        lastSyncTime ? ` (Sync: ${lastSyncTime})` : ''
                      }. Klik untuk refresh data.`}
                      className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pastel-blue/70 hover:bg-pastel-blue text-cobalt text-xs font-bold border border-cobalt/20 transition whitespace-nowrap"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                      />
                      <span>{isSyncing ? 'Syncing...' : 'Sheets Live'}</span>
                    </button>
                  ) : (
                    <Link
                      to="/super-admin"
                      title="Hubungkan Google Sheets Real-Time Database"
                      className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface border border-dashed border-ink/30 text-xs font-semibold text-ink/70 hover:border-cobalt hover:text-cobalt transition whitespace-nowrap"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Sheets Live</span>
                    </Link>
                  )}
                </>
              )}

              {/* Profile Pill (Navigates to /profile) + Logout */}
              {currentUser && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/profile"
                    title="Buka Profil & Pengaturan Akun"
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-pastel-yellow hover:bg-pastel-yellow/80 border-2 border-ink text-ink shadow-[2px_2px_0px_rgba(17,24,39,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer select-none group"
                  >
                    {/* User Avatar or Initials */}
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-ink text-pastel-yellow flex items-center justify-center text-[10px] font-black shrink-0 border border-ink/20">
                      {currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {currentUser.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-extrabold text-ink group-hover:text-cobalt transition truncate max-w-[85px] sm:max-w-[130px]">
                      {currentUser.full_name}
                    </span>

                    <span className="hidden sm:inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-surface/90 border border-ink/20 text-ink/80 tracking-wider">
                      {currentUser.role === 'super_admin'
                        ? 'SUPER'
                        : currentUser.role === 'admin'
                        ? 'PARTNER'
                        : 'MEMBER'}
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    title="Keluar / Sign Out dari Akun"
                    className="p-2 rounded-full bg-surface border border-ink/15 hover:bg-loss-bg hover:text-loss-text hover:border-loss-accent transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Bar — MODEL 3: Pastel Editorial Folder Tabs */}
          <div className="hidden md:block pt-2">
            <nav className="flex items-end gap-2 relative z-10 px-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => {
                      if (item.isActive) {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`px-5 py-2.5 rounded-t-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all select-none cursor-pointer ${
                      item.isActive
                        ? 'bg-pastel-yellow text-ink border-t-2 border-x-2 border-ink shadow-[2px_-2px_0px_rgba(17,24,39,0.08)] relative -mb-[2px] pb-[12px] z-20'
                        : 'bg-cream/80 hover:bg-pastel-lavender/40 text-ink/70 hover:text-ink border-t-2 border-x-2 border-pastel-lavender'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        item.isActive ? 'text-ink' : 'text-ink/50'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            {/* Continuous Folder Baseline (Dark line + Pastel Yellow bar) */}
            <div className="h-[2px] bg-ink w-full relative z-10" />
            <div className="h-1.5 bg-pastel-yellow w-full" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
        {children}
      </main>

      {/* iPhone Add to Home Screen Helper Prompt */}
      <IosInstallPrompt />

      {/* Mobile Bottom Navigation Bar (Optimized for iPhone Home Bar with pb-safe) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-ink/10 px-1 pt-1.5 pb-safe shadow-[0_-4px_24px_rgba(17,24,39,0.08)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (item.isActive) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl relative transition active:scale-95 cursor-pointer ${
                  item.isActive
                    ? 'text-cobalt font-extrabold'
                    : 'text-ink/60 font-medium hover:text-ink'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition ${
                    item.isActive ? 'bg-pastel-yellow/50' : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-bold">
                  {item.shortLabel}
                </span>
                {item.isActive && (
                  <div className="w-8 mt-0.5">
                    <WavyCoralUnderline />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
