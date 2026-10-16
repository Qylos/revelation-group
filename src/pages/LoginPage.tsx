import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Send,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  DoodleStar,
  DoodleSparkle,
  WavyCoralUnderline,
} from '../components/Doodles';

export const LoginPage: React.FC = () => {
  const { db, loginWithEmail, requestForgotPassword } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lupa Password Popup State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'confirmed'>('input');
  const [forgotError, setForgotError] = useState<string | null>(null);

  const redirectAfterLogin = (targetEmail: string) => {
    const user = db.users.find(
      (u) => u.email.toLowerCase() === targetEmail.trim().toLowerCase()
    );
    if (user?.role === 'member') {
      navigate('/transactions');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = loginWithEmail(email, password);
    if (!res.ok) {
      setErrorMsg(res.message || 'Gagal masuk.');
      return;
    }
    redirectAfterLogin(email);
  };

  const openForgotModal = () => {
    setForgotEmail(email.trim());
    setForgotStep('input');
    setForgotError(null);
    setIsForgotOpen(true);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError('Silakan masukkan alamat E-mail Anda.');
      return;
    }
    const res = requestForgotPassword(forgotEmail);
    if (!res.ok) {
      setForgotError(res.message || 'Gagal memproses permintaan.');
      return;
    }
    setForgotStep('confirmed');
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-10 pt-safe pb-safe px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Editorial Background Elements */}
      <div className="pointer-events-none select-none">
        <div className="w-72 h-72 rounded-full bg-pastel-yellow/35 blur-3xl absolute -top-16 -left-16" />
        <div className="w-80 h-80 rounded-full bg-pastel-lavender/45 blur-3xl absolute -bottom-20 -right-16" />
        <DoodleStar
          className="w-10 h-10 absolute top-12 left-8 sm:left-24 animate-pulse"
          color="#FDE047"
        />
        <DoodleSparkle
          className="w-8 h-8 absolute top-20 right-10 sm:right-28"
          color="#F25C54"
        />
        <DoodleStar
          className="w-8 h-8 absolute bottom-14 left-12 sm:left-32"
          color="#DDD6FE"
        />
        <DoodleSparkle
          className="w-7 h-7 absolute bottom-16 right-14 sm:right-32"
          color="#1A45E5"
        />
      </div>

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Editorial Brand Emblem & Heading */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-cobalt border-2 border-ink shadow-[4px_4px_0px_#111827] flex items-center justify-center text-white font-serif font-extrabold text-2xl -rotate-3 relative">
              R
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-pastel-yellow border-2 border-ink" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pastel-lavender/90 border border-ink/15 text-ink text-xs font-extrabold mb-3 shadow-sm">
              <span>✨ REVELATION GROUP • MULTI-BUSINESS PORTAL v1.2.0</span>
            </div>
          </div>

          <h1 className="font-serif font-extrabold text-4xl sm:text-5xl text-cobalt tracking-tight relative inline-block">
            Welcome Back!
            <span className="block w-40 mx-auto mt-1">
              <WavyCoralUnderline />
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-ink/75 font-medium leading-relaxed">
            Manajemen terpusat HPP (COGS), pencatatan transaksi harian, dan analitik Laba/Rugi{' '}
            <span className="yellow-highlight font-bold text-ink">
              Revelation Group
            </span>
            .
          </p>
        </div>

        {/* Layered Editorial Card */}
        <div className="relative">
          {/* Decorative Tilted Backing Card */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-pastel-lavender border-2 border-ink/25 -rotate-2 translate-y-1.5 pointer-events-none"
          />

          <div className="relative bg-surface rounded-2xl border-2 border-ink shadow-[6px_6px_0px_#111827] overflow-hidden">
            {/* Pastel Yellow Header Bar (Google Sheets Ready badge removed) */}
            <div className="bg-pastel-yellow px-6 py-3.5 border-b-2 border-ink flex items-center justify-between">
              <span className="font-hand text-xl font-bold text-ink">
                📌 Portal Internal Tim & Partner
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pastel-coral border border-ink/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-cobalt border border-ink/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-surface border border-ink/40" />
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-loss-bg border border-loss-accent text-loss-text text-xs font-bold">
                  ⚠️ {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* E-mail Box with Icon inside, no external label */}
                <div className="relative group">
                  <Mail className="w-4 h-4 text-ink/45 group-focus-within:text-cobalt absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    aria-label="E-mail"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-cream/70 border-2 border-ink/15 text-sm font-bold text-ink placeholder:text-ink/45 focus:outline-none focus:border-cobalt focus:bg-surface transition"
                  />
                </div>

                {/* Password Box with Icon inside, no external label */}
                <div className="relative group">
                  <Lock className="w-4 h-4 text-ink/45 group-focus-within:text-cobalt absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    aria-label="Password"
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-cream/70 border-2 border-ink/15 text-sm font-bold text-ink placeholder:text-ink/45 focus:outline-none focus:border-cobalt focus:bg-surface transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/45 hover:text-cobalt transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Side-by-Side Buttons: Login & Lupa Password */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    type="submit"
                    className="py-3.5 px-5 rounded-full bg-ink hover:bg-cobalt text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 border-2 border-ink shadow-[3px_3px_0px_rgba(26,69,229,0.35)] transition-all transform active:scale-[0.98]"
                  >
                    <span>Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="py-3.5 px-4 rounded-full bg-cream hover:bg-pastel-yellow text-ink font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5 border-2 border-ink/20 hover:border-ink transition-all transform active:scale-[0.98]"
                  >
                    <span>Lupa Password</span>
                  </button>
                </div>
              </form>

              {/* Subtle Editorial Feature Highlights Footer */}
              <div className="mt-6 pt-5 border-t border-dashed border-ink/15 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-pastel-blue/40 border border-ink/10">
                  <Layers className="w-3.5 h-3.5 text-cobalt mx-auto mb-0.5" />
                  <span className="text-[10px] font-extrabold text-ink/80 block leading-tight">
                    Multi-Bisnis
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-pastel-yellow/45 border border-ink/10">
                  <Sparkles className="w-3.5 h-3.5 text-ink mx-auto mb-0.5" />
                  <span className="text-[10px] font-extrabold text-ink/80 block leading-tight">
                    Kalkulator HPP
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-pastel-lavender/50 border border-ink/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-cobalt mx-auto mb-0.5" />
                  <span className="text-[10px] font-extrabold text-ink/80 block leading-tight">
                    Akses Aman
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Lupa Password (Step 1: Isi Email -> Step 2: Halaman Konfirmasi Password Dikirim) */}
      {isForgotOpen && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border-2 border-ink shadow-[6px_6px_0px_#111827] max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-pastel-yellow border-b-2 border-ink flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cobalt" />
                <h3 className="font-serif font-extrabold text-lg text-ink">
                  {forgotStep === 'input'
                    ? 'Lupa Password'
                    : 'Konfirmasi Pengiriman Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="p-1.5 rounded-full bg-surface/80 hover:bg-surface text-ink border border-ink/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotStep === 'input' ? (
              <form onSubmit={handleForgotSubmit} className="p-6 space-y-4">
                <p className="text-xs sm:text-sm text-ink/75 font-medium leading-relaxed">
                  Masukkan alamat <strong>E-mail</strong> Anda di bawah ini. Sistem akan mengirimkan password akses Anda ke email tersebut.
                </p>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-loss-bg border border-loss-accent text-loss-text text-xs font-bold">
                    ⚠️ {forgotError}
                  </div>
                )}

                <div className="relative">
                  <Mail className="w-4 h-4 text-ink/45 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream/70 border-2 border-ink/15 text-sm font-bold text-ink placeholder:text-ink/45 focus:outline-none focus:border-cobalt focus:bg-surface"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-ink/70 hover:bg-cream"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Password</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-profit-bg border-2 border-profit-accent text-profit-text flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-serif font-extrabold text-xl text-ink">
                    Password Telah Dikirim!
                  </h4>
                  <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
                    Password akses Anda telah berhasil dikirimkan ke alamat email:
                  </p>
                  <p className="inline-block px-3.5 py-1 rounded-full bg-pastel-blue text-cobalt font-extrabold text-xs sm:text-sm border border-cobalt/20">
                    {forgotEmail}
                  </p>
                  <p className="text-[11px] text-ink/60 pt-1">
                    Silakan periksa kotak masuk (Inbox / Spam) email Anda dan gunakan password tersebut untuk Login.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(forgotEmail);
                      setIsForgotOpen(false);
                    }}
                    className="w-full py-3 px-6 rounded-full bg-ink hover:bg-cobalt text-white text-xs sm:text-sm font-extrabold shadow-sm transition"
                  >
                    Kembali ke Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
