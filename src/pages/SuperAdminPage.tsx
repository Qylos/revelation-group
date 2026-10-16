import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Cloud,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  Download,
  Lock,
  Sparkles,
  Mail,
  Clock,
  ExternalLink,
  X,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import { InviteUserResult, useApp } from '../context/AppContext';
import { SUPER_ADMIN_EMAIL, User } from '../types';
import {
  APPS_SCRIPT_TEMPLATE,
  exportDatabaseToExcel,
} from '../services/googleSheetsService';
import { DoodleStar, WavyCoralUnderline } from '../components/Doodles';
import { CustomSelect, SelectOption } from '../components/CustomSelect';

const INVITE_ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Partner Admin' },
  { value: 'member', label: 'Member' },
];

const USER_ROLE_SWITCH_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Partner Admin' },
  { value: 'member', label: 'Member' },
  { value: 'inactive', label: 'Nonaktif' },
];

export const SuperAdminPage: React.FC = () => {
  const {
    db,
    currentUser,
    isSuperAdmin,
    sheetsWebhookUrl,
    sheetsApiKey,
    isSyncing,
    lastSyncTime,
    syncStatusMessage,
    setSheetsWebhookUrl,
    setSheetsApiKey,
    pullFromGoogleSheets,
    pushAllToGoogleSheets,
    inviteOrAddUser,
    updateUserRoleOrStatus,
  } = useApp();

  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('admin');
  const [urlInput, setUrlInput] = useState(sheetsWebhookUrl);
  const [apiKeyInput, setApiKeyInput] = useState(sheetsApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [inviteModalData, setInviteModalData] = useState<InviteUserResult | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  if (!currentUser || !isSuperAdmin) {
    return <Navigate to="/404" replace />;
  }

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newFullName.trim()) return;
    const res = inviteOrAddUser(newEmail, newFullName.slice(0, 20), newRole);
    if (res) {
      setInviteModalData(res);
      setCopiedInviteLink(false);
    }
    setNewEmail('');
    setNewFullName('');
  };

  const handleCopyInviteLink = () => {
    if (!inviteModalData) return;
    navigator.clipboard.writeText(inviteModalData.inviteLink);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 3000);
  };

  const handleRoleDropdownChange = (user: User, value: string) => {
    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return;
    if (value === 'inactive') {
      updateUserRoleOrStatus(user.id, { is_active: false });
    } else if (value === 'admin' || value === 'member') {
      updateUserRoleOrStatus(user.id, { role: value, is_active: true });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSaveAndSyncSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSheetsWebhookUrl(urlInput);
    setSheetsApiKey(apiKeyInput);
    if (urlInput.trim()) {
      await pullFromGoogleSheets(urlInput.trim(), apiKeyInput.trim());
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-surface rounded-2xl border-2 border-cobalt/30 shadow-editorial overflow-hidden">
        <div className="bg-pastel-yellow px-6 py-4 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-cobalt" />
            <span className="font-serif font-extrabold text-lg text-ink">
              SUPER ADMIN EXCLUSIVE CONTROL CENTER
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink text-white text-xs font-bold">
            <Lock className="w-3.5 h-3.5 text-pastel-yellow" />
            <span>Hard-Locked: {SUPER_ADMIN_EMAIL}</span>
          </span>
        </div>

        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif font-extrabold text-3xl text-cobalt flex items-center gap-2.5">
              <span>Manajemen Akses & Database Google Sheets</span>
              <DoodleStar className="w-7 h-7" color="#FDE047" />
            </h1>
            <div className="w-40 mt-1">
              <WavyCoralUnderline />
            </div>
            <p className="text-sm text-ink/75 mt-2">
              Halaman ini terkunci eksklusif untuk <strong>{SUPER_ADMIN_EMAIL}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => exportDatabaseToExcel(db)}
            className="px-5 py-3 rounded-full bg-profit-bg hover:brightness-95 text-profit-text border border-profit-accent text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (.xls) 5 Sheet ↗</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: GOOGLE SHEETS REAL-TIME DATABASE INTEGRATION */}
      <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden">
        <div className="bg-pastel-blue px-6 py-4 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-cobalt" />
            <h2 className="font-serif font-extrabold text-xl text-ink">
              Integrasi Google Sheets (Database Utama Real-Time Gratis)
            </h2>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-surface text-cobalt border border-cobalt/20">
            Akun Utama: {SUPER_ADMIN_EMAIL}
          </span>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                Gunakan <strong>Google Sheets</strong> pada akun{' '}
                <strong className="text-cobalt">{SUPER_ADMIN_EMAIL}</strong> sebagai database cloud real-time gratis (Rp 0) untuk seluruh Partner Admin dan Member.
              </p>

              <form onSubmit={handleSaveAndSyncSheets} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-ink/70 mb-1">
                    Google Apps Script Web App URL (Berakhiran /exec)
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-4 py-2.5 rounded-xl bg-cream/70 border border-ink/20 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ink/70">
                      <Key className="w-3.5 h-3.5 text-cobalt" />
                      <span>API Secret Key (Keamanan Google Sheets Endpoint)</span>
                    </label>
                    <span className="text-[10px] text-profit-text bg-pastel-green px-2 py-0.5 rounded-md font-bold">
                      Anti-Hacker Hardening
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Masukkan Secret Key (contoh: rev_secret_revelation_2026)"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-cream/70 border border-ink/20 text-xs sm:text-sm font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-cobalt"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-ink/60">
                    Kunci rahasia ini memastikan hanya Web App resmi yang dapat membaca atau menulis ke spreadsheet Anda.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Simpan & Hubungkan ↗</span>
                </button>
              </form>

              {sheetsWebhookUrl && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => pullFromGoogleSheets()}
                    className="px-4 py-2 rounded-full bg-pastel-blue hover:brightness-95 text-cobalt text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Tarik Data dari Google Sheets (Pull)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => pushAllToGoogleSheets()}
                    className="px-4 py-2 rounded-full bg-pastel-green hover:brightness-95 text-profit-text text-xs font-bold flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Kirim Semua Tabel ke Google Sheets (Push)</span>
                  </button>
                </div>
              )}

              {syncStatusMessage && (
                <p className="text-xs font-bold text-cobalt bg-pastel-blue/40 px-3.5 py-2 rounded-xl border border-cobalt/20">
                  ℹ️ {syncStatusMessage}{' '}
                  {lastSyncTime ? `(Sinkronisasi terakhir: ${lastSyncTime})` : ''}
                </p>
              )}
            </div>

            <div className="lg:col-span-5 p-4 rounded-2xl bg-cream border border-ink/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-hand text-lg font-bold text-cobalt">
                  ⚡ Cara Setup Google Sheets (2 Menit):
                </span>
                <Sparkles className="w-4 h-4 text-pastel-coral" />
              </div>
              <ol className="text-xs text-ink/80 space-y-1.5 list-decimal list-inside font-medium">
                <li>
                  Buka <strong>sheets.new</strong> dengan akun{' '}
                  <strong>{SUPER_ADMIN_EMAIL}</strong>.
                </li>
                <li>
                  Klik menu <strong>Extensions → Apps Script</strong>.
                </li>
                <li>
                  Salin kode script di bawah lalu tempel ke <code>Code.gs</code>.
                </li>
                <li>
                  Klik <strong>Deploy → New deployment → Web app</strong> (Akses:{' '}
                  <em>Anyone</em>), lalu tempel URL-nya di samping!
                </li>
              </ol>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-4 py-2 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-pastel-yellow" />
                      <span>Kode Apps Script Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Kode Google Apps Script</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowScriptCode((prev) => !prev)}
                  className="px-3 py-2 rounded-full bg-surface border border-ink/15 text-xs font-bold text-ink/75 hover:border-cobalt"
                >
                  {showScriptCode ? 'Sembunyikan Kode' : 'Lihat Kode'}
                </button>
              </div>
            </div>
          </div>

          {showScriptCode && (
            <div className="mt-4">
              <pre className="p-4 rounded-xl bg-ink text-cream text-[11px] overflow-x-auto max-h-72 leading-relaxed">
                {APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: USER & ROLE MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Tambah / Undang User Baru */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-ink/10 shadow-editorial">
          <div className="bg-pastel-lavender px-6 py-4 rounded-t-2xl border-b border-ink/10 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-ink" />
            <h2 className="font-serif font-extrabold text-lg text-ink">
              Tambah / Undang User Baru
            </h2>
          </div>

          <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Nama Lengkap *
                </label>
                <span className="text-[10px] font-bold text-ink/50">
                  {newFullName.length}/20
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={20}
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value.slice(0, 20))}
                placeholder="Contoh: Hendra Wijaya"
                className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                Alamat Email *
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nama@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                Level Akses Awal (Role) *
              </label>
              <CustomSelect
                value={newRole}
                onChange={(val) => setNewRole(val as 'admin' | 'member')}
                options={INVITE_ROLE_OPTIONS}
                buttonClassName="bg-cream/60 hover:bg-surface text-ink border-ink/15"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-5 rounded-full bg-ink hover:bg-cobalt text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Undang & Kirim Link Email (5 Menit) ↗</span>
            </button>
          </form>
        </div>

        {/* Daftar Seluruh Pengguna Terdaftar + Custom Role Switcher Dropdown */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-ink/10 shadow-editorial">
          <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cobalt" />
              <h2 className="font-serif font-extrabold text-xl text-cobalt">
                Daftar Seluruh Pengguna Terdaftar ({db.users.length})
              </h2>
            </div>
            <span className="font-hand text-base text-ink/70">
              Role Switcher
            </span>
          </div>

          <div className="w-full">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-cream/80 border-b border-ink/10 text-[11px] font-extrabold uppercase tracking-wider text-ink/70">
                  <th className="py-3.5 px-4 w-[38%]">Nama & Email</th>
                  <th className="py-3.5 px-3 hidden sm:table-cell sm:w-[20%]">User ID</th>
                  <th className="py-3.5 px-3 w-[24%] sm:w-[20%]">Status Role</th>
                  <th className="py-3.5 px-4 text-right w-[38%] sm:w-[22%]">Ubah Akses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-xs sm:text-sm">
                {db.users.map((u) => {
                  const isOwner =
                    u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                  const dropdownValue = !u.is_active
                    ? 'inactive'
                    : u.role === 'super_admin'
                    ? 'super_admin'
                    : u.role;

                  return (
                    <tr key={u.id} className="hover:bg-cream/40 transition">
                      <td className="py-4 px-4">
                        <p className="font-bold text-ink break-words">
                          {u.full_name.slice(0, 20)}
                        </p>
                        <p className="text-xs text-ink/65 break-all">{u.email}</p>
                      </td>
                      <td className="py-4 px-3 font-mono text-xs text-ink/60 hidden sm:table-cell truncate">
                        {u.id}
                      </td>
                      <td className="py-4 px-3">
                        {!u.is_active ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-loss-bg text-loss-text border border-loss-accent whitespace-nowrap">
                            Nonaktif
                          </span>
                        ) : isOwner ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-pastel-yellow text-ink border border-ink/20 whitespace-nowrap">
                            Super Admin
                          </span>
                        ) : u.role === 'admin' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-pastel-lavender text-ink border border-ink/15 whitespace-nowrap">
                            Partner Admin
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-pastel-blue text-cobalt border border-cobalt/20 whitespace-nowrap">
                            Member
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isOwner ? (
                          <span className="text-xs font-bold text-ink/50 italic">
                            Hard-Locked
                          </span>
                        ) : (
                          <div className="inline-block w-full max-w-[165px] text-left">
                            <CustomSelect
                              size="sm"
                              align="right"
                              value={dropdownValue}
                              onChange={(val) => handleRoleDropdownChange(u, val)}
                              options={USER_ROLE_SWITCH_OPTIONS}
                              buttonClassName="bg-cream hover:bg-surface text-ink border-ink/20"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Pengiriman Link Undangan 5 Menit dari david.calvin89@gmail.com */}
      {inviteModalData && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border-2 border-ink shadow-card max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-pastel-yellow border-b border-ink/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cobalt" />
                <h3 className="font-serif font-extrabold text-lg text-ink">
                  Link Undangan Email Terkirim!
                </h3>
              </div>
              <button
                onClick={() => setInviteModalData(null)}
                className="p-1.5 rounded-full bg-surface/80 hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-pastel-blue/50 border border-cobalt/20 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink/70">Pengirim Undangan:</span>
                  <span className="font-extrabold text-cobalt">{SUPER_ADMIN_EMAIL}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink/70">Email Diundang:</span>
                  <span className="font-extrabold text-ink">
                    {inviteModalData.user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink/70">Masa Berlaku Link:</span>
                  <span className="inline-flex items-center gap-1 font-extrabold text-loss-text">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Hanya 5 Menit</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cream border border-ink/15 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase tracking-wider text-ink/60">
                    Password Lama (Sementara):
                  </span>
                  <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-pastel-yellow text-ink border border-ink/20">
                    {inviteModalData.tempPassword}
                  </span>
                </div>
                <p className="text-ink/70 leading-relaxed">
                  Link undangan berisi halaman untuk memasukkan{' '}
                  <strong>Password Lama ({inviteModalData.tempPassword})</strong> dan membuat{' '}
                  <strong>Password Baru</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="flex-1 py-2.5 px-4 rounded-full bg-cream hover:bg-pastel-lavender border border-ink/20 text-xs font-extrabold text-ink flex items-center justify-center gap-1.5 transition"
                >
                  {copiedInviteLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-profit-text" />
                      <span>Link Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link (5 Menit)</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${encodeURIComponent(
                    inviteModalData.user.email
                  )}?subject=${encodeURIComponent(
                    'Undangan Akses Portal Revelation Group (Berlaku 5 Menit)'
                  )}&body=${encodeURIComponent(
                    `Halo ${inviteModalData.user.full_name},\n\nAnda telah diundang oleh ${SUPER_ADMIN_EMAIL} ke Portal Revelation Group.\n\nPassword Lama (Sementara): ${inviteModalData.tempPassword}\nLink Aktivasi & Ganti Password Baru (Hanya berlaku 5 menit):\n${inviteModalData.inviteLink}`
                  )}`}
                  className="py-2.5 px-4 rounded-full bg-surface hover:bg-pastel-blue border border-ink/20 text-xs font-extrabold text-cobalt flex items-center justify-center gap-1.5 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kirim via Email App</span>
                </a>
              </div>

              <div className="pt-2 border-t border-ink/10 flex items-center justify-between gap-2">
                <Link
                  to={`/setup-password?token=${encodeURIComponent(
                    inviteModalData.user.invite_token || ''
                  )}&email=${encodeURIComponent(inviteModalData.user.email)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cobalt hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Halaman Setup Password Sekarang ↗</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setInviteModalData(null)}
                  className="px-5 py-2 rounded-full bg-ink text-white text-xs font-bold"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
