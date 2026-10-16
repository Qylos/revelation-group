import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Camera,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building2,
  Mail,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DoodleStar } from '../components/Doodles';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateCurrentUserProfile, logout, db } = useApp();
  const navigate = useNavigate();

  // Full Name State
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Image Upload & Crop State
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Handle Full Name Save
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    const res = updateCurrentUserProfile({ full_name: fullName.trim() });
    if (res.ok) {
      setNameSuccess('Nama lengkap berhasil diperbarui!');
      setTimeout(() => setNameSuccess(null), 3500);
    }
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok.');
      return;
    }

    const res = updateCurrentUserProfile({
      old_password: oldPassword,
      new_password: newPassword,
    });

    if (res.ok) {
      setPasswordSuccess('Password berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.message || 'Gagal mengubah password.');
    }
  };

  // Handle File Selection with Auto-Downscale
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Auto convert & downscale if image is overly large
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = offscreen.toDataURL('image/jpeg', 0.88);
          setSelectedRawImage(compressed);
          setCropZoom(1);
          setCropPan({ x: 0, y: 0 });
          setIsCropModalOpen(true);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset file input so user can choose the same file again if wanted
    e.target.value = '';
  };

  // Cropper Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPan.x, y: e.clientY - cropPan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Apply Crop & Save to User Profile
  const handleApplyCrop = () => {
    if (!selectedRawImage) return;

    const img = imageRef.current;
    if (!img) return;

    const cropSize = 320; // 320x320 high resolution avatar
    const canvas = document.createElement('canvas');
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw circular cropped image
    const displaySize = 240; // Size of the crop frame on screen
    const scale = (cropSize / displaySize) * cropZoom;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.clip();

    const drawX = cropSize / 2 + cropPan.x * (cropSize / displaySize);
    const drawY = cropSize / 2 + cropPan.y * (cropSize / displaySize);
    const drawWidth = img.naturalWidth * (displaySize / img.naturalWidth) * scale;
    const drawHeight = img.naturalHeight * (displaySize / img.naturalWidth) * scale;

    ctx.drawImage(
      img,
      drawX - drawWidth / 2,
      drawY - drawHeight / 2,
      drawWidth,
      drawHeight
    );
    ctx.restore();

    // Export optimized WebP/JPEG
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    updateCurrentUserProfile({ avatar_url: croppedDataUrl });
    setIsCropModalOpen(false);
    setSelectedRawImage(null);
    setAvatarSuccess('Foto profil berhasil diperbarui!');
    setTimeout(() => setAvatarSuccess(null), 3500);
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('Hapus foto profil ini dan gunakan inisial?')) {
      updateCurrentUserProfile({ avatar_url: '' });
      setAvatarSuccess('Foto profil dihapus.');
      setTimeout(() => setAvatarSuccess(null), 3000);
    }
  };

  const getCleanRoleLabel = (role: string) => {
    if (role === 'super_admin') return 'Super Admin (Founder)';
    if (role === 'admin') return 'Partner Admin';
    return 'Member';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-cobalt tracking-tight flex items-center gap-3">
          <span>Profil Pengguna & Akun</span>
          <DoodleStar className="w-7 h-7 shrink-0" color="#FDE047" />
        </h1>
        <p className="text-sm text-ink/70 mt-1">
          Kelola foto profil, identitas akun, dan kata sandi Anda di{' '}
          <strong className="text-ink">Revelation Group</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Foto Profil & Identitas Ringkas */}
        <div className="bg-surface rounded-2xl border-2 border-ink shadow-editorial p-6 flex flex-col items-center text-center">
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-ink shadow-[4px_4px_0px_rgba(17,24,39,1)] bg-pastel-yellow flex items-center justify-center">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-serif font-black text-3xl sm:text-4xl text-ink">
                  {currentUser.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Unggah Foto Baru"
              className="absolute bottom-0 right-0 p-2.5 rounded-full bg-ink hover:bg-cobalt text-white border-2 border-surface shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <h3 className="font-serif font-extrabold text-xl text-ink mt-4">
            {currentUser.full_name}
          </h3>

          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-pastel-yellow border border-ink/20 text-ink">
              <ShieldCheck className="w-3.5 h-3.5 text-cobalt" />
              <span>{getCleanRoleLabel(currentUser.role)}</span>
            </span>
          </div>

          <p className="text-xs text-ink/65 mt-2 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{currentUser.email}</span>
          </p>

          {avatarSuccess && (
            <div className="mt-3 p-2 rounded-xl bg-profit-bg border border-profit-accent text-profit-text text-xs font-bold w-full">
              {avatarSuccess}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-dashed border-ink/15 w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-cream hover:bg-pastel-yellow/50 border border-ink/20 text-xs font-bold text-ink transition inline-flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-cobalt" />
              <span>Ganti Foto Profil</span>
            </button>

            {currentUser.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="w-full py-1.5 px-3 rounded-xl hover:bg-loss-bg/50 border border-transparent hover:border-loss-accent text-xs font-semibold text-loss-text transition inline-flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Foto Profil</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Cards: Identitas, Ganti Password & Sign Out */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Edit Nama Lengkap */}
          <div className="bg-surface rounded-2xl border-2 border-ink shadow-editorial p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
              <UserIcon className="w-5 h-5 text-cobalt" />
              <h3 className="font-serif font-extrabold text-lg text-ink">
                Informasi Akun
              </h3>
            </div>

            {nameSuccess && (
              <div className="p-3 rounded-xl bg-profit-bg border border-profit-accent text-profit-text text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{nameSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/20 focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                    Email Terdaftar (Read-Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-4 py-2.5 rounded-xl bg-ink/5 border border-ink/15 text-sm font-medium text-ink/60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                    Peran Akun (Role)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={getCleanRoleLabel(currentUser.role)}
                    className="w-full px-4 py-2.5 rounded-xl bg-ink/5 border border-ink/15 text-sm font-medium text-ink/60 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold transition shadow-sm"
                >
                  Simpan Nama
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Ganti Kata Sandi (Password) */}
          <div className="bg-surface rounded-2xl border-2 border-ink shadow-editorial p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
              <Lock className="w-5 h-5 text-cobalt" />
              <div>
                <h3 className="font-serif font-extrabold text-lg text-ink">
                  Ganti Kata Sandi (Password)
                </h3>
                <p className="text-xs text-ink/60">
                  Pastikan kata sandi baru Anda kuat dan minimal 6 karakter.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-loss-bg border border-loss-accent text-loss-text text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-profit-bg border border-profit-accent text-profit-text text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Kata Sandi Saat Ini *
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-cream/60 border border-ink/20 focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 outline-none text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                    Kata Sandi Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-cream/60 border border-ink/20 focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 outline-none text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                    Konfirmasi Kata Sandi Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-cream/60 border border-ink/20 focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 outline-none text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold transition shadow-sm"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Sign Out Section */}
          <div className="bg-surface rounded-2xl border-2 border-ink shadow-editorial p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-extrabold text-base text-ink flex items-center gap-2">
                <LogOut className="w-4 h-4 text-loss-text" />
                <span>Keluar dari Akun (Sign Out)</span>
              </h3>
              <p className="text-xs text-ink/65 mt-0.5">
                Mengakhiri sesi kerja Anda pada perangkat ini dan kembali ke halaman login.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-5 py-2.5 rounded-full bg-loss-bg hover:bg-loss-accent text-loss-text hover:text-white border border-loss-accent text-xs font-bold transition shrink-0 inline-flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Crop Modal */}
      {isCropModalOpen && selectedRawImage && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-3xl border-2 border-ink shadow-editorial max-w-md w-full overflow-hidden my-6">
            <div className="bg-pastel-yellow px-6 py-4 border-b-2 border-ink flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cobalt" />
                <h3 className="font-serif font-extrabold text-lg text-ink">
                  Atur & Potong Foto Profil
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCropModalOpen(false)}
                className="p-1 rounded-full hover:bg-ink/10 text-ink"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-ink/70 leading-relaxed text-center">
                Geser (drag) foto dan atur perbesaran (zoom) agar wajah pas di dalam lingkaran profil.
              </p>

              {/* Crop Canvas Workspace */}
              <div
                className="relative w-64 h-64 mx-auto bg-ink/10 rounded-2xl overflow-hidden border-2 border-ink flex items-center justify-center cursor-move select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Image being dragged/zoomed */}
                <img
                  ref={imageRef}
                  src={selectedRawImage}
                  alt="Crop preview"
                  draggable={false}
                  className="max-w-none transition-transform pointer-events-none"
                  style={{
                    transform: `translate(${cropPan.x}px, ${cropPan.y}px) scale(${cropZoom})`,
                    transformOrigin: 'center center',
                  }}
                />

                {/* Circular Mask Overlay */}
                <div className="absolute inset-0 pointer-events-none rounded-full border-4 border-cobalt shadow-[0_0_0_9999px_rgba(17,24,39,0.55)]" />
              </div>

              {/* Zoom & Reset Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-ink/70">
                  <span className="flex items-center gap-1">
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </span>
                  <span>{Math.round(cropZoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.6"
                    max="3"
                    step="0.05"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-cobalt cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCropZoom(1);
                      setCropPan({ x: 0, y: 0 });
                    }}
                    title="Reset Posisi & Zoom"
                    className="p-1.5 rounded-lg bg-cream border border-ink/15 hover:bg-pastel-yellow text-ink transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-ink/20 text-xs font-bold hover:bg-cream transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-5 py-2 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan Foto Profil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
