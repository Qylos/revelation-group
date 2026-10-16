import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Package,
  Receipt,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DoodleSparkle, WavyCoralUnderline } from './Doodles';
import { IosInstallPrompt } from './IosInstallPrompt';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    db,
    currentUser,
    isSuperAdmin,
    canManageBusinessAndProducts,
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

            {/* Center: Simple Text-Only Navigation ("yang simple cuma kata-kata saja") */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (item.isActive) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`text-sm tracking-tight transition-all relative py-1 cursor-pointer select-none whitespace-nowrap ${
                    item.isActive
                      ? 'font-extrabold text-ink after:content-[""] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-[2px] after:bg-ink after:rounded-full'
                      : 'font-semibold text-ink/65 hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Controls: ID diganti profile picture saja (nama ga usah) + Sign Out */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {currentUser && (
                <>
                  {/* Circular Profile Picture Only */}
                  <Link
                    to="/profile"
                    title={`Profil: ${currentUser.full_name} (${currentUser.role.toUpperCase()})`}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-pastel-yellow border-2 border-ink shadow-[2px_2px_0px_rgba(17,24,39,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center shrink-0 group"
                  >
                    {currentUser.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs sm:text-sm font-black text-ink">
                        {currentUser.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </Link>

                  {/* Sign Out Button */}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    title="Keluar / Sign Out dari Akun"
                    className="p-2 sm:p-2.5 rounded-full bg-surface border border-ink/15 hover:bg-loss-bg hover:text-loss-text hover:border-loss-accent transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
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
