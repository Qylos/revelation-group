import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPER_ADMIN_EMAIL } from '../types';
import { DoodleStar, DoodleSparkle, WavyCoralUnderline } from '../components/Doodles';

export const SetupPasswordPage: React.FC = () => {
  const { db, completePasswordSetup } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = (searchParams.get('email') || '').trim().toLowerCase();
  const tokenParam = (searchParams.get('token') || '').trim();

  const invitedUser = db.users.find(
    (u) => u.email.toLowerCase() === emailParam
  );

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const expiresAt = invitedUser?.invite_expires_at || 0;
  const remainingMs = expiresAt > 0 ? Math.max(0, expiresAt - nowMs) : 0;
  const isExpired = expiresAt > 0 && nowMs > expiresAt;

  const formatCountdown = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isExpired) {
      setErrorMsg(
        `Link undangan ini sudah melewati batas waktu 5 menit. Silakan hubungi ${SUPER_ADMIN_EMAIL}.`
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi Password Baru tidak sama dengan Password Baru.');
      return;
    }

    const res = completePasswordSetup(
      emailParam,
      tokenParam,
      oldPassword,
      newPassword
    );
    if (!res.ok) {
      setErrorMsg(res.message || 'Gagal menyimpan password baru.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      if (invitedUser?.role === 'member') {
        navigate('/transactions');
      } else {
        navigate('/dashboard');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-10 pt-safe pb-safe px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="pointer-events-none select-none">
        <DoodleStar
          className="w-10 h-10 absolute top-10 left-8 sm:left-20 animate-pulse"
          color="#FDE047"
        />
        <DoodleSparkle
          className="w-8 h-8 absolute top-20 right-10 sm:right-24"
          color="#F25C54"
        />
      </div>

      <div className="max-w-md w-full mx-auto relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pastel-lavender border border-ink/15 text-ink text-xs font-extrabold mb-3 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-cobalt" />
            <span>UNDANGAN RESMI DARI: {SUPER_ADMIN_EMAIL}</span>
          </div>

          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-cobalt tracking-tight">
            Aktivasi & Buat Password
          </h1>
          <div className="w-36 mx-auto mt-1">
            <WavyCoralUnderline />
          </div>
          <p className="mt-2 text-xs sm:text-sm text-ink/75 font-medium">
            Masukkan <strong>Password Lama</strong> dari email undangan dan atur{' '}
            <strong>Password Baru</strong> Anda.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border-2 border-ink shadow-[6px_6px_0px_#111827] overflow-hidden">
          {/* Top Status Header with 5-Minute Countdown */}
          <div className="bg-pastel-yellow px-6 py-3.5 border-b-2 border-ink flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-ink truncate">
              <Mail className="w-4 h-4 text-cobalt shrink-0" />
              <span className="truncate">{emailParam || 'User Undangan'}</span>
            </div>

            {expiresAt > 0 && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 ${
                  isExpired
                    ? 'bg-loss-bg text-loss-text border-loss-accent'
                    : 'bg-surface text-ink border-ink/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-pastel-coral" />
                <span>
                  {isExpired
                    ? 'Expired (>5m)'
                    : `Berlaku: ${formatCountdown(remainingMs)}`}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {isSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-profit-bg border-2 border-profit-accent text-profit-text flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-extrabold text-2xl text-ink">
                  Password Baru Aktif!
                </h3>
                <p className="text-xs sm:text-sm text-ink/75">
                  Akun Anda telah berhasil diaktifkan. Mengalihkan ke halaman utama...
                </p>
              </div>
            ) : isExpired ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-loss-bg border-2 border-loss-accent text-loss-text flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-extrabold text-xl text-loss-text">
                  Link Undangan Kadaluarsa (Melebihi 5 Menit)
                </h3>
                <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
                  Demi keamanan, link undangan dari{' '}
                  <strong>{SUPER_ADMIN_EMAIL}</strong> hanya berlaku selama{' '}
                  <strong>5 menit</strong>. Silakan minta Super Admin untuk mengirim ulang undangan.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-ink text-white text-xs font-bold"
                >
                  Kembali ke Halaman Login ↗
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-loss-bg border border-loss-accent text-loss-text text-xs font-bold">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-ink/70 mb-1.5">
                    Password Lama (Dari Email Undangan) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Contoh: REV-1234"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-cream/70 border border-ink/20 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-cobalt focus:bg-surface"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                    >
                      {showOldPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-ink/70 mb-1.5">
                    Password Baru *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cobalt absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan Password Baru"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-cream/70 border border-ink/20 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-cobalt focus:bg-surface"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                    >
                      {showNewPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-ink/70 mb-1.5">
                    Konfirmasi Password Baru *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cobalt absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi Password Baru"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/70 border border-ink/20 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-cobalt focus:bg-surface"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-full bg-ink hover:bg-cobalt text-white font-extrabold text-sm shadow-md transition"
                  >
                    Simpan Password Baru & Masuk ↗
                  </button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs font-bold text-ink/60 hover:text-cobalt underline"
                  >
                    Kembali ke Halaman Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
