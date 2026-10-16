import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Edit3,
  Archive,
  Trash2,
  Upload,
  Package,
  BarChart2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Business } from '../types';
import { compressImageFile, calculateFinancialSummary, formatRupiah } from '../utils/calculations';
import { isSafeImageUrl } from '../utils/security';
import { DoodleStar, WavyCoralUnderline, ProfitLossBadge } from '../components/Doodles';

const PASTEL_ACCENT_OPTIONS = [
  { label: 'Lavender Pastel', hex: '#DDD6FE' },
  { label: 'Yellow Highlight', hex: '#FDE047' },
  { label: 'Soft Blue', hex: '#DBEAFE' },
  { label: 'Soft Green', hex: '#D9F99D' },
  { label: 'Soft Rose', hex: '#FFE4E6' },
];

export const BusinessesPage: React.FC = () => {
  const {
    db,
    canManageBusinessAndProducts,
    saveBusiness,
    deleteOrArchiveBusiness,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBiz, setEditingBiz] = useState<Business | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cardAccentColor, setCardAccentColor] = useState('#DDD6FE');
  const [logoUrl, setLogoUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  if (!canManageBusinessAndProducts) {
    return <Navigate to="/transactions" replace />;
  }

  const openCreateModal = () => {
    setEditingBiz(null);
    setName('');
    setDescription('');
    setCardAccentColor('#DDD6FE');
    setLogoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (biz: Business) => {
    setEditingBiz(biz);
    setName(biz.name);
    setDescription(biz.description);
    setCardAccentColor(biz.card_accent_color || '#DDD6FE');
    setLogoUrl(biz.logo_url || '');
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 160, 0.78);
      setLogoUrl(compressed);
    } catch (err) {
      console.error('Gagal mengompresi gambar:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveBusiness({
      id: editingBiz?.id,
      name: name.trim(),
      description: description.trim(),
      logo_url: logoUrl,
      card_accent_color: cardAccentColor,
      is_archived: editingBiz?.is_archived ?? false,
    });
    setIsModalOpen(false);
  };

  // Active businesses first (in their array order), archived businesses always at the very bottom
  const displayedBusinesses = [
    ...db.businesses.filter((b) => !b.is_archived),
    ...(showArchived ? db.businesses.filter((b) => b.is_archived) : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-hand text-lg font-bold text-cobalt">
            ✨ Selected Work & Portfolio Unit Bisnis
          </span>
          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-cobalt tracking-tight flex items-center gap-3">
            <span>Manajemen Profil Bisnis</span>
            <DoodleStar className="w-7 h-7" color="#FDE047" />
          </h1>
          <div className="w-36 mt-1">
            <WavyCoralUnderline />
          </div>
          <p className="text-sm text-ink/70 mt-2">
            Kelola profil bisnis di bawah naungan <strong>Revelation Group</strong>, warna aksen kartu, dan upload logo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className="px-4 py-2.5 rounded-full bg-surface border border-ink/15 text-xs font-bold text-ink/75 hover:border-cobalt transition"
          >
            {showArchived ? 'Sembunyikan Arsip' : 'Tampilkan Arsip'}
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-3 rounded-full bg-ink hover:bg-cobalt text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bisnis Baru ↗</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedBusinesses.map((biz) => {
          const bizProducts = db.products.filter((p) => p.business_id === biz.id);
          const bizSales = db.sales_transactions.filter((t) => t.business_id === biz.id);
          const bizExpenses = db.operational_expenses.filter(
            (e) => e.business_id === biz.id
          );
          const summary = calculateFinancialSummary(bizSales, bizExpenses);
          const accentHex = biz.card_accent_color || '#DDD6FE';

          return (
            <div
              key={biz.id}
              style={{ '--biz-accent': accentHex } as React.CSSProperties}
              className={`bg-surface rounded-2xl border border-ink/10 shadow-card overflow-hidden flex flex-col justify-between transition hover:shadow-lg ${
                biz.is_archived ? 'opacity-70' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl border border-ink/15 flex items-center justify-center font-serif font-extrabold text-2xl text-ink shrink-0 overflow-hidden shadow-sm"
                    style={{ backgroundColor: accentHex }}
                  >
                    {biz.logo_url && isSafeImageUrl(biz.logo_url) ? (
                      <img
                        src={biz.logo_url}
                        alt={biz.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      biz.name.charAt(0)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-serif font-extrabold text-2xl text-ink tracking-tight">
                        {biz.name}
                      </h2>
                      {biz.is_archived && (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-loss-bg text-loss-text border border-loss-accent">
                          Diarsipkan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/70 mt-1 line-clamp-2">
                      {biz.description || 'Belum ada deskripsi bisnis.'}
                    </p>
                  </div>
                </div>

                {/* 3 Metric Boxes colored with the business's default pastel accent */}
                <div className="mt-5 pt-4 border-t border-dashed border-ink/15 grid grid-cols-3 gap-2.5 text-xs">
                  <div
                    className="p-3 rounded-xl border border-ink/10"
                    style={{ backgroundColor: accentHex }}
                  >
                    <span className="text-ink/70 font-semibold block">Total Produk</span>
                    <span className="font-extrabold text-sm text-ink mt-0.5 block">
                      {bizProducts.length} Produk
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-xl border border-ink/10"
                    style={{ backgroundColor: accentHex }}
                  >
                    <span className="text-ink/70 font-semibold block">Total Omzet</span>
                    <span className="font-extrabold text-sm text-ink mt-0.5 block truncate">
                      {formatRupiah(summary.gross_revenue)}
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-xl border border-ink/10 flex flex-col justify-between"
                    style={{ backgroundColor: accentHex }}
                  >
                    <span className="text-ink/70 font-semibold block">Status All-Time</span>
                    <div className="mt-0.5 space-y-1">
                      <span
                        className={`font-serif font-extrabold text-sm sm:text-base block truncate tracking-tight ${
                          summary.net_profit_or_loss >= 0
                            ? 'text-profit-text'
                            : 'text-loss-text'
                        }`}
                      >
                        {formatRupiah(summary.net_profit_or_loss, true)}
                      </span>
                      <div>
                        <ProfitLossBadge
                          status={summary.profit_status}
                          label={summary.profit_status}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: 4 Icon Buttons (Package, Edit, Archive, Delete) with pastel hover + Buka Dashboard */}
              <div className="px-6 py-4 bg-cream/50 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/business/${biz.id}/products`}
                    title={`Produk & Kalkulator HPP (${bizProducts.length} Produk)`}
                    className="w-9 h-9 rounded-full bg-surface border border-ink/15 text-ink hover:bg-[var(--biz-accent)] hover:border-ink flex items-center justify-center transition shadow-sm"
                  >
                    <Package className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => openEditModal(biz)}
                    title="Edit Profil Bisnis"
                    className="w-9 h-9 rounded-full bg-surface border border-ink/15 text-ink hover:bg-[var(--biz-accent)] hover:border-ink flex items-center justify-center transition shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteOrArchiveBusiness(biz.id, true)}
                    title={biz.is_archived ? 'Aktifkan Kembali' : 'Arsipkan Bisnis'}
                    className="w-9 h-9 rounded-full bg-surface border border-ink/15 text-ink hover:bg-[var(--biz-accent)] hover:border-ink flex items-center justify-center transition shadow-sm"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Hapus permanen unit bisnis "${biz.name}"? (Gunakan tombol Arsip jika hanya ingin menyembunyikan)`
                        )
                      ) {
                        deleteOrArchiveBusiness(biz.id, false);
                      }
                    }}
                    title="Hapus Bisnis"
                    className="w-9 h-9 rounded-full bg-surface border border-ink/15 text-ink hover:bg-[var(--biz-accent)] hover:border-ink flex items-center justify-center transition shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  to={`/business/${biz.id}/dashboard`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold transition shadow-sm"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Buka Dashboard ↗</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Business Modal — !m-0 ensures full top-to-bottom backdrop coverage */}
      {isModalOpen && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border-2 border-ink shadow-card max-w-lg w-full overflow-hidden">
            <div
              className="px-6 py-4 border-b border-ink/10 flex items-center justify-between"
              style={{ backgroundColor: cardAccentColor }}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-ink" />
                <h3 className="font-serif font-extrabold text-xl text-ink">
                  {editingBiz ? 'Edit Profil Bisnis' : 'Tambah Unit Bisnis Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-surface/80 hover:bg-surface text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Nama Unit Bisnis *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Revelation Roastery & Coffee"
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Deskripsi Singkat Bisnis
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan fokus produk atau layanan unit bisnis ini..."
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                  Warna Header Kartu (Pastel Editorial)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PASTEL_ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.hex}
                      type="button"
                      onClick={() => setCardAccentColor(opt.hex)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition ${
                        cardAccentColor === opt.hex
                          ? 'border-ink ring-2 ring-cobalt scale-105'
                          : 'border-ink/15 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: opt.hex }}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
                  Upload Logo Bisnis (Auto-Compress Client-Side)
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl border border-ink/15 flex items-center justify-center font-serif font-bold text-xl overflow-hidden shrink-0"
                    style={{ backgroundColor: cardAccentColor }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      name.charAt(0) || 'R'
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream border border-ink/20 hover:border-cobalt text-xs font-bold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-cobalt" />
                      <span>
                        {isCompressing ? 'Mengompresi...' : 'Pilih Gambar Logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="ml-2 text-xs text-loss-text font-bold hover:underline"
                      >
                        Hapus Logo
                      </button>
                    )}
                    <p className="text-[11px] text-ink/60 mt-1">
                      Otomatis dikompres ke WebP ringan (&lt;15KB) agar hemat kuota Free Tier & Google Sheets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-ink/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-ink/70 hover:bg-cream"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <span>Simpan Bisnis ↗</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
