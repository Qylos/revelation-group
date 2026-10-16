import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Calculator,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HppComponentItem, HppMode, Product } from '../types';
import { formatRupiah } from '../utils/calculations';
import { DoodleStar } from '../components/Doodles';
import { CustomSelect, SelectOption } from '../components/CustomSelect';

export const ProductsHppPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    db,
    canManageBusinessAndProducts,
    saveProduct,
    deleteProduct,
  } = useApp();

  if (!canManageBusinessAndProducts) {
    return <Navigate to="/transactions" replace />;
  }

  const activeBusinesses = db.businesses.filter((b) => !b.is_archived);
  const currentBusiness =
    db.businesses.find((b) => b.id === id) || activeBusinesses[0];

  const products = useMemo(
    () =>
      db.products.filter(
        (p) => p.business_id === (currentBusiness?.id || id)
      ),
    [db.products, currentBusiness, id]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [hppMode, setHppMode] = useState<HppMode>('itemized');
  const [directHpp, setDirectHpp] = useState<number>(0);
  const [components, setComponents] = useState<HppComponentItem[]>([
    { item_name: 'Bahan Baku Utama', cost: 10000 },
    { item_name: 'Kemasan / Packaging', cost: 2000 },
  ]);
  const [sellingPrice, setSellingPrice] = useState<number>(25000);

  if (!currentBusiness) {
    return <Navigate to="/businesses" replace />;
  }

  const businessOptions: SelectOption[] = activeBusinesses.map((b) => ({
    value: b.id,
    label: b.name,
    accentColor: b.card_accent_color,
    logoUrl: b.logo_url || undefined,
  }));

  const getDynamicMetricFontSize = (text: string): string => {
    const len = text.length;
    if (len <= 10) return 'text-sm sm:text-base';
    if (len <= 12) return 'text-xs sm:text-sm';
    if (len <= 15) return 'text-[11px] sm:text-xs';
    return 'text-[10px] sm:text-[11px]';
  };

  const openAddModal = () => {
    setEditingProd(null);
    setProdName('');
    setHppMode('itemized');
    setDirectHpp(10000);
    setComponents([
      { item_name: 'Bahan Baku Utama', cost: 8000 },
      { item_name: 'Cup / Kemasan', cost: 2000 },
    ]);
    setSellingPrice(22000);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProd(prod);
    setProdName(prod.name);
    setHppMode(prod.hpp_mode);
    setDirectHpp(prod.current_total_hpp);
    setComponents(
      prod.hpp_components && prod.hpp_components.length > 0
        ? prod.hpp_components
        : [{ item_name: 'Komponen Bahan Baku', cost: prod.current_total_hpp }]
    );
    setSellingPrice(prod.current_selling_price);
    setIsModalOpen(true);
  };

  const computedTotalHpp =
    hppMode === 'itemized'
      ? components.reduce((sum, item) => sum + Number(item.cost || 0), 0)
      : Number(directHpp || 0);

  const computedMarginRp = Number(sellingPrice || 0) - computedTotalHpp;
  const computedMarginPct =
    Number(sellingPrice) > 0
      ? (computedMarginRp / Number(sellingPrice)) * 100
      : 0;

  const handleAddComponentRow = () => {
    setComponents((prev) => [...prev, { item_name: '', cost: 0 }]);
  };

  const handleUpdateComponentRow = (
    idx: number,
    field: 'item_name' | 'cost',
    val: string | number
  ) => {
    setComponents((prev) =>
      prev.map((c, i) =>
        i === idx
          ? {
              ...c,
              [field]: field === 'cost' ? Number(val) : String(val),
            }
          : c
      )
    );
  };

  const handleRemoveComponentRow = (idx: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const cleanComponents =
      hppMode === 'itemized'
        ? components.filter((c) => c.item_name.trim() !== '' || c.cost > 0)
        : [];

    saveProduct({
      id: editingProd?.id,
      business_id: currentBusiness.id,
      name: prodName.trim(),
      hpp_mode: hppMode,
      hpp_components: cleanComponents,
      current_total_hpp: computedTotalHpp,
      current_selling_price: Number(sellingPrice),
      is_active: true,
    });
    setIsModalOpen(false);
  };

  const handleDeleteFromModal = () => {
    if (!editingProd) return;
    if (window.confirm(`Hapus produk "${editingProd.name}"?`)) {
      deleteProduct(editingProd.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Bar & Custom Business Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/business/${currentBusiness.id}/dashboard`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-cobalt transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ke Dashboard {currentBusiness.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink/60">Pilih Bisnis:</span>
          <CustomSelect
            size="sm"
            align="right"
            value={currentBusiness.id}
            onChange={(val) => navigate(`/business/${val}/products`)}
            options={businessOptions}
            className="w-56"
            buttonClassName="bg-surface border-ink/20 text-ink shadow-sm"
          />
        </div>
      </div>

      {/* Header & Historical Snapshot Notice */}
      <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden">
        <div
          className="px-6 py-4 border-b border-ink/10 flex flex-wrap items-center justify-between gap-4"
          style={{ backgroundColor: currentBusiness.card_accent_color || '#DDD6FE' }}
        >
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink/70">
              DUAL-MODE COGS / HPP CALCULATOR
            </span>
            <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-ink flex items-center gap-2">
              <span>Produk & HPP — {currentBusiness.name}</span>
              <DoodleStar className="w-6 h-6" color="#FDE047" />
            </h1>
          </div>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk & Hitung HPP ↗</span>
          </button>
        </div>

        <div className="px-6 py-3.5 bg-pastel-yellow/35 border-b border-ink/10 flex items-start sm:items-center gap-3 text-xs">
          <Lock className="w-4 h-4 text-cobalt shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-ink/85 font-medium">
            <strong>Proteksi Historical Snapshot Aktif:</strong> Klik langsung pada tombol{' '}
            <strong>Total HPP</strong> atau <strong>Harga Jual</strong> di bawah untuk mengubah nilai. Perubahan hanya berlaku untuk transaksi baru ke depan.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-ink/20 p-12 text-center space-y-3">
          <Calculator className="w-10 h-10 text-cobalt mx-auto" />
          <h3 className="font-serif font-bold text-xl text-ink">
            Belum Ada Produk di {currentBusiness.name}
          </h3>
          <p className="text-sm text-ink/65 max-w-md mx-auto">
            Tambahkan produk pertama Anda menggunakan Mode Input Langsung atau Mode Rincian Komponen bahan baku.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-white text-xs font-bold"
          >
            <span>+ Tambah Produk Sekarang ↗</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((prod) => {
            const marginRp = prod.current_selling_price - prod.current_total_hpp;
            const marginPct =
              prod.current_selling_price > 0
                ? (marginRp / prod.current_selling_price) * 100
                : 0;
            const isHealthyMargin = marginRp > 0;

            const hppText = formatRupiah(prod.current_total_hpp);
            const priceText = formatRupiah(prod.current_selling_price);
            const marginRpText = formatRupiah(marginRp, true);
            const marginPctText = `${marginPct.toFixed(1)}%`;

            const displayComponents =
              prod.hpp_components && prod.hpp_components.length > 0
                ? prod.hpp_components
                : [{ item_name: 'Total HPP Langsung (Direct)', cost: prod.current_total_hpp }];

            return (
              <div
                key={prod.id}
                className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6">
                  <h3 className="font-serif font-extrabold text-xl text-ink">
                    {prod.name}
                  </h3>

                  {/* 4 Metric Boxes — Single-line auto-scaling font size */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      title="Klik untuk ubah HPP Produk"
                      className="text-left p-3 rounded-xl bg-cream/80 hover:bg-pastel-yellow/50 border border-ink/15 hover:border-ink shadow-[0_2px_0_rgba(17,24,39,0.08)] hover:shadow-[0_4px_0_rgba(17,24,39,0.18)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none active:scale-[0.98] transition-all duration-150 cursor-pointer group overflow-hidden"
                    >
                      <span className="text-ink/65 group-hover:text-ink block font-semibold whitespace-nowrap truncate">
                        Total HPP (COGS)
                      </span>
                      <span
                        className={`font-serif font-extrabold text-ink mt-0.5 block whitespace-nowrap tracking-tight ${getDynamicMetricFontSize(
                          hppText
                        )}`}
                      >
                        {hppText}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      title="Klik untuk ubah Harga Jual Produk"
                      className="text-left p-3 rounded-xl bg-cream/80 hover:bg-pastel-blue/60 border border-ink/15 hover:border-cobalt shadow-[0_2px_0_rgba(17,24,39,0.08)] hover:shadow-[0_4px_0_rgba(26,69,229,0.22)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none active:scale-[0.98] transition-all duration-150 cursor-pointer group overflow-hidden"
                    >
                      <span className="text-ink/65 group-hover:text-cobalt block font-semibold whitespace-nowrap truncate">
                        Harga Jual
                      </span>
                      <span
                        className={`font-serif font-extrabold text-cobalt mt-0.5 block whitespace-nowrap tracking-tight ${getDynamicMetricFontSize(
                          priceText
                        )}`}
                      >
                        {priceText}
                      </span>
                    </button>

                    <div
                      className={`p-3 rounded-xl border overflow-hidden ${
                        isHealthyMargin
                          ? 'bg-profit-bg/60 border-profit-accent text-profit-text'
                          : 'bg-loss-bg/60 border-loss-accent text-loss-text'
                      }`}
                    >
                      <span className="block font-semibold opacity-80 whitespace-nowrap truncate">
                        Margin (Rp)
                      </span>
                      <span
                        className={`font-serif font-extrabold mt-0.5 block whitespace-nowrap tracking-tight ${getDynamicMetricFontSize(
                          marginRpText
                        )}`}
                      >
                        {marginRpText}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border overflow-hidden ${
                        isHealthyMargin
                          ? 'bg-profit-bg/60 border-profit-accent text-profit-text'
                          : 'bg-loss-bg/60 border-loss-accent text-loss-text'
                      }`}
                    >
                      <span className="block font-semibold opacity-80 whitespace-nowrap truncate">
                        Margin (%)
                      </span>
                      <span
                        className={`font-serif font-extrabold mt-0.5 block whitespace-nowrap tracking-tight ${getDynamicMetricFontSize(
                          marginPctText
                        )}`}
                      >
                        {marginPctText}
                      </span>
                    </div>
                  </div>

                  {/* Rincian Komponen HPP — Fixed height & scrollable with Revelation scrollbar when > 3 items */}
                  <div className="mt-4 pt-3 border-t border-dashed border-ink/15">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/60">
                        Rincian Komponen HPP:
                      </p>
                      {displayComponents.length > 3 && (
                        <span className="text-[10px] font-bold text-cobalt">
                          Scroll ↓ ({displayComponents.length} item)
                        </span>
                      )}
                    </div>
                    <div
                      className={`space-y-1.5 ${
                        displayComponents.length > 3
                          ? 'max-h-[72px] overflow-y-auto pr-2 revelation-scroll'
                          : ''
                      }`}
                    >
                      {displayComponents.map((comp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-ink/80 gap-2"
                        >
                          <span className="truncate">• {comp.item_name}</span>
                          <span className="font-bold whitespace-nowrap shrink-0">
                            {formatRupiah(comp.cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dual-Mode HPP Calculator Modal — !m-0 ensures full top-to-bottom backdrop blur */}
      {isModalOpen && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/55 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border-2 border-ink shadow-card max-w-xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-pastel-yellow border-b border-ink/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink/70 block">
                  {currentBusiness.name}
                </span>
                <h3 className="font-serif font-extrabold text-xl text-ink">
                  {editingProd ? 'Edit Produk & Kalkulasi HPP' : 'Tambah Produk & Kalkulasi HPP'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-surface/80 hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-6 space-y-5 max-h-[82vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Nama Produk / Menu *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Contoh: Iced Kopi Susu Revelation"
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              {/* Dual-Mode Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-2">
                  Pilih Mode Perhitungan HPP (COGS)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setHppMode('direct')}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      hppMode === 'direct'
                        ? 'bg-pastel-blue/60 border-cobalt ring-2 ring-cobalt/30'
                        : 'bg-cream/50 border-ink/15 hover:bg-cream'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink">
                        1. Mode Input Langsung
                      </span>
                      {hppMode === 'direct' && (
                        <CheckCircle2 className="w-4 h-4 text-cobalt" />
                      )}
                    </div>
                    <p className="text-[11px] text-ink/65 mt-1">
                      Ketik nominal total HPP secara langsung jika sudah diketahui.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHppMode('itemized')}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      hppMode === 'itemized'
                        ? 'bg-pastel-lavender/60 border-cobalt ring-2 ring-cobalt/30'
                        : 'bg-cream/50 border-ink/15 hover:bg-cream'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink">
                        2. Mode Rincian Komponen
                      </span>
                      {hppMode === 'itemized' && (
                        <CheckCircle2 className="w-4 h-4 text-cobalt" />
                      )}
                    </div>
                    <p className="text-[11px] text-ink/65 mt-1">
                      Input bahan baku & kemasan satu per satu, dijumlahkan otomatis.
                    </p>
                  </button>
                </div>
              </div>

              {hppMode === 'direct' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                    Total HPP per Produk (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={directHpp}
                    onChange={(e) => setDirectHpp(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cobalt"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-cream/70 border border-ink/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
                      Daftar Komponen Bahan Baku & Kemasan
                    </span>
                    <button
                      type="button"
                      onClick={handleAddComponentRow}
                      className="text-xs font-bold text-cobalt hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Komponen</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {components.map((comp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nama bahan / kemasan..."
                          value={comp.item_name}
                          onChange={(e) =>
                            handleUpdateComponentRow(idx, 'item_name', e.target.value)
                          }
                          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-ink/15 text-xs font-semibold"
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Biaya (Rp)"
                          value={comp.cost}
                          onChange={(e) =>
                            handleUpdateComponentRow(idx, 'cost', e.target.value)
                          }
                          className="w-32 px-3 py-2 rounded-lg bg-surface border border-ink/15 text-xs font-bold text-right"
                        />
                        {components.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveComponentRow(idx)}
                            className="p-1.5 text-ink/50 hover:text-loss-text"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-xs font-extrabold">
                    <span>Total HPP Otomatis:</span>
                    <span className="text-sm text-cobalt">
                      {formatRupiah(computedTotalHpp)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Harga Jual Produk (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  computedMarginRp >= 0
                    ? 'bg-profit-bg/60 border-profit-accent text-profit-text'
                    : 'bg-loss-bg/60 border-loss-accent text-loss-text'
                }`}
              >
                <div>
                  <span className="text-[11px] font-extrabold uppercase block">
                    Estimasi Margin Laba Kotor per Pcs
                  </span>
                  <span className="font-serif font-extrabold text-xl">
                    {formatRupiah(computedMarginRp, true)} ({computedMarginPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-right text-xs font-bold">
                  <div>Harga Jual: {formatRupiah(sellingPrice)}</div>
                  <div>Total HPP: {formatRupiah(computedTotalHpp)}</div>
                </div>
              </div>

              {/* Footer with Trash Icon on Bottom Left (when editing) and Batal / Simpan on Bottom Right */}
              <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-2">
                <div>
                  {editingProd && (
                    <button
                      type="button"
                      onClick={handleDeleteFromModal}
                      title="Hapus Produk Ini"
                      className="p-2.5 rounded-full bg-loss-bg/80 hover:bg-loss-accent hover:text-white text-loss-text border border-loss-accent transition flex items-center justify-center shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-ink/70 hover:bg-cream"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold shadow-sm transition"
                  >
                    Simpan Produk & HPP ↗
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
