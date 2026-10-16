import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  Trash2,
  UserCheck,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HOLDING_RND_ID } from '../types';
import {
  formatFullIndoDate,
  formatIndoDate,
  formatRupiah,
  getTodayDateString,
} from '../utils/calculations';
import { DoodleStar, WavyCoralUnderline } from '../components/Doodles';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect, SelectOption } from '../components/CustomSelect';

const EXPENSE_CATEGORIES = [
  'Marketing & Iklan',
  'Sewa Tempat & Gedung',
  'Utilitas & Listrik/Air',
  'Gaji & Komisi Staf',
  'Bahan Rusak / Waste',
  'Logistik & Kurir',
  'Perlengkapan Toko / Kantor',
  'Lain-lain Operasional',
];

const RND_EXPENSE_CATEGORIES = [
  'Riset & Pengembangan Produk (R&D)',
  'Eksperimen / Trial Bisnis Baru',
  'Pembelian Alat & Sampel R&D',
  'Biaya Legal & Administrasi Grup',
  'Lain-lain R&D / Holding',
];

export const TransactionsPage: React.FC = () => {
  const {
    db,
    canManageBusinessAndProducts,
    recordBatchSalesTransactions,
    deleteSalesTransaction,
    recordOperationalExpense,
    deleteOperationalExpense,
  } = useApp();

  const activeBusinesses = useMemo(
    () => db.businesses.filter((b) => !b.is_archived),
    [db.businesses]
  );

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    activeBusinesses[0]?.id || HOLDING_RND_ID
  );
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  const [expenseName, setExpenseName] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const [showAllDatesHistory, setShowAllDatesHistory] = useState(false);

  const isRndSelected = selectedBusinessId === HOLDING_RND_ID;

  const businessOptions: SelectOption[] = useMemo(
    () => [
      ...activeBusinesses.map((biz) => ({
        value: biz.id,
        label: biz.name,
        accentColor: biz.card_accent_color,
        logoUrl: biz.logo_url || undefined,
      })),
      {
        value: HOLDING_RND_ID,
        label: '🧪 Revelation Group — Dana R&D / Pusat (Non-Bisnis)',
        accentColor: '#FDE047',
      },
    ],
    [activeBusinesses]
  );

  const activeCategoryList = isRndSelected
    ? RND_EXPENSE_CATEGORIES
    : EXPENSE_CATEGORIES;

  const categoryOptions: SelectOption[] = activeCategoryList.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const businessProducts = useMemo(
    () =>
      db.products.filter(
        (p) => p.business_id === selectedBusinessId && p.is_active
      ),
    [db.products, selectedBusinessId]
  );

  const liveBatchPreview = useMemo(() => {
    let totalQty = 0;
    let totalRevenue = 0;
    let totalHpp = 0;
    businessProducts.forEach((p) => {
      const q = Number(qtyMap[p.id] || 0);
      if (q > 0) {
        totalQty += q;
        totalRevenue += q * p.current_selling_price;
        totalHpp += q * p.current_total_hpp;
      }
    });
    return {
      totalQty,
      totalRevenue,
      totalHpp,
      grossProfit: totalRevenue - totalHpp,
    };
  }, [businessProducts, qtyMap]);

  const handleQtyChange = (productId: string, val: number) => {
    const clean = Math.max(0, Math.floor(val));
    setQtyMap((prev) => ({
      ...prev,
      [productId]: clean,
    }));
  };

  const handleRecordSales = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRndSelected) return;
    const items = Object.entries(qtyMap)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));

    if (items.length === 0) {
      setFeedbackBanner('⚠️ Masukkan minimal 1 jumlah produk terjual (Qty > 0).');
      return;
    }

    const count = recordBatchSalesTransactions(
      selectedBusinessId,
      selectedDate,
      items
    );
    setQtyMap({});
    setFeedbackBanner(
      `✅ Berhasil mencatat ${count} transaksi penjualan pada ${formatFullIndoDate(
        selectedDate
      )}!`
    );
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(expenseAmount);
    if (!expenseName.trim() || numericAmount <= 0) return;

    recordOperationalExpense({
      business_id: selectedBusinessId,
      transaction_date: selectedDate,
      expense_name: expenseName,
      category: expenseCategory,
      amount: numericAmount,
      notes: expenseNotes,
    });

    setExpenseName('');
    setExpenseAmount('');
    setExpenseNotes('');
    setFeedbackBanner(
      `✅ ${isRndSelected ? 'Dana R&D / Pusat' : 'Biaya operasional'} "${expenseName}" sebesar ${formatRupiah(
        numericAmount
      )} berhasil dicatat untuk ${formatFullIndoDate(selectedDate)}!`
    );
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  const getUserDisplayName = (userId: string): string => {
    const found = db.users.find((u) => u.id === userId);
    return found ? found.full_name : 'User Internal';
  };

  const getBusinessName = (bizId: string): string => {
    if (bizId === HOLDING_RND_ID) {
      return '🧪 Dana R&D / Pusat';
    }
    return db.businesses.find((b) => b.id === bizId)?.name || 'Unit Bisnis';
  };

  const getProductName = (prodId: string): string => {
    return db.products.find((p) => p.id === prodId)?.name || 'Produk';
  };

  const displayedSalesHistory = useMemo(() => {
    return db.sales_transactions
      .filter((tx) =>
        showAllDatesHistory ? true : tx.transaction_date === selectedDate
      )
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  }, [db.sales_transactions, selectedDate, showAllDatesHistory]);

  const displayedExpensesHistory = useMemo(() => {
    return db.operational_expenses
      .filter((ex) =>
        showAllDatesHistory ? true : ex.transaction_date === selectedDate
      )
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  }, [db.operational_expenses, selectedDate, showAllDatesHistory]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="font-hand text-lg font-bold text-cobalt">
          📝 Pencatatan Penjualan & Pengeluaran Harian
        </span>
        <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-cobalt tracking-tight flex items-center gap-3">
          <span>Input Transaksi & Operasional</span>
          <DoodleStar className="w-7 h-7" color="#FDE047" />
        </h1>
        <div className="w-36 mt-1">
          <WavyCoralUnderline />
        </div>
      </div>

      {/* Top Picker Card: Compact Date Picker (4 cols) + Larger Business Selector (8 cols) */}
      <div className="bg-surface rounded-2xl border-2 border-ink/15 shadow-editorial p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* 1. Compact Date Picker (Smaller, No '(MENDUKUNG BACKDATE)', Full Indo Date, No helper text) */}
          <div className="md:col-span-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-cobalt mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Pilih Tanggal Transaksi</span>
            </label>
            <CustomDatePicker
              value={selectedDate}
              onChange={(dateStr) => setSelectedDate(dateStr)}
            />
          </div>

          {/* 2. Larger Business Selector (Wider & Larger, No 'Diinput oleh' text below) */}
          <div className="md:col-span-8">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-cobalt mb-1.5">
              2. Pilih Unit Bisnis / Pos Dana R&D Revelation Group
            </label>
            <CustomSelect
              size="lg"
              value={selectedBusinessId}
              onChange={(val) => {
                setSelectedBusinessId(val);
                setQtyMap({});
                if (val === HOLDING_RND_ID) {
                  setActiveTab('expenses');
                  setExpenseCategory(RND_EXPENSE_CATEGORIES[0]);
                } else {
                  setExpenseCategory(EXPENSE_CATEGORIES[0]);
                }
              }}
              options={businessOptions}
              buttonClassName="bg-cream hover:bg-surface text-ink border-ink/20 shadow-sm"
            />
          </div>
        </div>
      </div>

      {feedbackBanner && (
        <div className="p-4 rounded-2xl bg-profit-bg border-2 border-profit-accent text-profit-text text-sm font-bold flex items-center justify-between shadow-sm">
          <span>{feedbackBanner}</span>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Dual Tabs: Tab 1 (Penjualan Produk) & Tab 2 (Biaya Operasional / R&D Non-HPP) */}
      <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden">
        <div className="grid grid-cols-2 border-b border-ink/10 bg-cream/60">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`py-4 px-4 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition border-b-4 ${
              activeTab === 'sales'
                ? 'bg-surface text-cobalt border-pastel-coral'
                : 'text-ink/60 border-transparent hover:text-ink'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tab 1 — Input Penjualan Produk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`py-4 px-4 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition border-b-4 ${
              activeTab === 'expenses'
                ? 'bg-surface text-cobalt border-pastel-coral'
                : 'text-ink/60 border-transparent hover:text-ink'
            }`}
          >
            {isRndSelected ? (
              <FlaskConical className="w-4 h-4 text-cobalt" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            <span>
              {isRndSelected
                ? 'Tab 2 — Input Dana R&D / Pengeluaran Pusat'
                : 'Tab 2 — Input Biaya Operasional (Non-HPP)'}
            </span>
          </button>
        </div>

        {activeTab === 'sales' ? (
          isRndSelected ? (
            <div className="p-8 text-center space-y-4 bg-pastel-yellow/15">
              <div className="w-12 h-12 rounded-2xl bg-pastel-yellow border-2 border-ink/20 flex items-center justify-center mx-auto shadow-sm">
                <FlaskConical className="w-6 h-6 text-ink" />
              </div>
              <div className="max-w-lg mx-auto space-y-1.5">
                <h3 className="font-serif font-extrabold text-xl text-ink">
                  Pos Khusus Dana R&D / Pusat (Non-Bisnis)
                </h3>
                <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">
                  Pos <strong>🧪 Revelation Group — Dana R&D / Pusat</strong> digunakan khusus untuk mencatat pengeluaran riset, eksperimen bisnis baru, atau beban pusat yang memotong Saldo Bank Partner tanpa membebani Laba/Rugi bisnis tertentu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                className="px-6 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm transition"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Buka Form Input Dana R&D / Pusat →</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecordSales} className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif font-bold text-xl text-ink">
                    Input Jumlah Terjual (Qty) — {getBusinessName(selectedBusinessId)}
                  </h2>
                  <p className="text-xs text-ink/65">
                    Masukkan jumlah terjual (Qty) untuk satu atau banyak produk sekaligus pada{' '}
                    <strong>{formatFullIndoDate(selectedDate)}</strong>.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-pastel-lavender/70 text-ink">
                  Snapshot Harga & HPP Terkunci Otomatis
                </span>
              </div>

              {businessProducts.length === 0 ? (
                <div className="p-8 rounded-xl bg-cream text-center text-sm text-ink/70">
                  Belum ada produk aktif pada unit bisnis ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessProducts.map((prod) => {
                    const qty = qtyMap[prod.id] || 0;
                    const subtotalRev = qty * prod.current_selling_price;
                    const subtotalProfit =
                      qty * (prod.current_selling_price - prod.current_total_hpp);

                    return (
                      <div
                        key={prod.id}
                        className={`p-4 rounded-xl border transition flex items-center justify-between gap-3 ${
                          qty > 0
                            ? 'bg-pastel-yellow/25 border-cobalt shadow-sm'
                            : 'bg-cream/50 border-ink/10'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-ink truncate">
                            {prod.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-ink/65 mt-1">
                            <span>
                              Harga: <strong>{formatRupiah(prod.current_selling_price)}</strong>
                            </span>
                            <span>•</span>
                            <span>HPP: {formatRupiah(prod.current_total_hpp)}</span>
                          </div>
                          {qty > 0 && (
                            <p className="text-[11px] font-bold text-profit-text mt-1">
                              Omzet: {formatRupiah(subtotalRev)} (Laba Kotor: +
                              {formatRupiah(subtotalProfit)})
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, qty - 1)}
                            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-surface border border-ink/20 font-bold text-base sm:text-sm hover:bg-cream active:scale-90 transition touch-manipulation flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={qty === 0 ? '' : qty}
                            placeholder="0"
                            onChange={(e) =>
                              handleQtyChange(prod.id, Number(e.target.value))
                            }
                            className="w-16 py-1.5 px-2 text-center rounded-xl bg-surface border border-ink/20 font-extrabold text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-cobalt"
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(prod.id, qty + 1)}
                            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-ink text-white font-bold text-base sm:text-sm hover:bg-cobalt active:scale-90 transition touch-manipulation flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-4 sm:p-5 rounded-2xl bg-cream border border-ink/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-ink/60 block text-xs">Total Qty Input:</span>
                    <span className="font-extrabold text-ink">
                      {liveBatchPreview.totalQty} pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-ink/60 block text-xs">Total Omzet:</span>
                    <span className="font-extrabold text-cobalt">
                      {formatRupiah(liveBatchPreview.totalRevenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink/60 block text-xs">Estimasi Laba Kotor:</span>
                    <span className="font-extrabold text-profit-text">
                      +{formatRupiah(liveBatchPreview.grossProfit)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={liveBatchPreview.totalQty === 0}
                  className="px-6 py-3 rounded-full bg-ink hover:bg-cobalt disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Penjualan ({formatIndoDate(selectedDate)}) ↗</span>
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handleRecordExpense} className="p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif font-bold text-xl text-ink flex items-center gap-2">
                  <span>
                    {isRndSelected
                      ? 'Input Pengeluaran Dana R&D / Pusat (Non-Bisnis)'
                      : `Input Biaya Operasional (Non-HPP) — ${getBusinessName(selectedBusinessId)}`}
                  </span>
                </h2>
                <p className="text-xs text-ink/65 mt-0.5">
                  {isRndSelected ? (
                    <>
                      Pengeluaran R&D ini tercatat di Global Dashboard & langsung mengurangi{' '}
                      <strong>Saldo Kas/Bank Partner</strong> tanpa membebani unit bisnis tertentu pada{' '}
                      <strong>{formatFullIndoDate(selectedDate)}</strong>.
                    </>
                  ) : (
                    <>
                      Catat pengeluaran operasional seperti sewa, iklan, listrik, gaji, atau bahan rusak pada{' '}
                      <strong>{formatFullIndoDate(selectedDate)}</strong>.
                    </>
                  )}
                </p>
              </div>
              {isRndSelected && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-pastel-yellow border border-ink/20 text-ink">
                  🧪 Beban R&D / Holding
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  {isRndSelected
                    ? 'Nama Kegiatan / Kebutuhan R&D *'
                    : 'Nama Pengeluaran Operasional *'}
                </label>
                <input
                  type="text"
                  required
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder={
                    isRndSelected
                      ? 'Contoh: Riset Formula Produk Baru / Pembelian Alat Lab / Trial Kemasan'
                      : 'Contoh: Bayar Iklan Instagram / Token Listrik / Susu Rusak'
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Kategori Biaya *
                </label>
                <CustomSelect
                  value={expenseCategory}
                  onChange={(val) => setExpenseCategory(val)}
                  options={categoryOptions}
                  buttonClassName="bg-cream/60 hover:bg-surface text-ink border-ink/15"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Nominal Biaya (Rp) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Contoh: 250000"
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder={
                    isRndSelected
                      ? 'Misal: Nama tim R&D / tujuan eksperimen...'
                      : 'Keterangan singkat...'
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-ink hover:bg-cobalt text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
              >
                <span>
                  {isRndSelected
                    ? `Simpan Pengeluaran R&D (${formatIndoDate(selectedDate)}) ↗`
                    : `Simpan Biaya Operasional (${formatIndoDate(selectedDate)}) ↗`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Riwayat Transaksi */}
      <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <div>
            <h2 className="font-serif font-bold text-xl text-cobalt flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pastel-coral" />
              <span>
                Riwayat Transaksi{' '}
                {showAllDatesHistory
                  ? '(Semua Tanggal)'
                  : formatFullIndoDate(selectedDate)}
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAllDatesHistory((prev) => !prev)}
            className="px-4 py-2 rounded-full bg-cream border border-ink/15 hover:border-cobalt text-xs font-bold text-ink transition"
          >
            {showAllDatesHistory
              ? `Filter Tanggal ${formatIndoDate(selectedDate)} Saja`
              : 'Tampilkan Semua Tanggal'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink/70 flex items-center justify-between">
              <span>Penjualan Produk ({displayedSalesHistory.length})</span>
            </h3>

            {displayedSalesHistory.length === 0 ? (
              <div className="p-6 rounded-xl bg-cream/50 border border-dashed border-ink/15 text-center text-xs text-ink/60">
                Belum ada catatan penjualan pada filter tanggal ini.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {displayedSalesHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-cream/60 border border-ink/10 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-pastel-blue text-cobalt">
                          {getBusinessName(tx.business_id)}
                        </span>
                        <span className="text-[11px] font-bold text-ink/60">
                          📅 {formatIndoDate(tx.transaction_date)}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-ink">
                        {getProductName(tx.product_id)} × {tx.qty} pcs
                      </p>
                      <p className="text-xs text-ink/70">
                        Omzet: <strong>{formatRupiah(tx.total_revenue)}</strong> • HPP Snapshot:{' '}
                        {formatRupiah(tx.total_hpp)} • Laba:{' '}
                        <strong className="text-profit-text">
                          +{formatRupiah(tx.gross_profit)}
                        </strong>
                      </p>
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/70 bg-surface px-2.5 py-0.5 rounded-full border border-ink/10 mt-1">
                        <UserCheck className="w-3 h-3 text-cobalt" />
                        <span>Diinput oleh: {getUserDisplayName(tx.created_by)}</span>
                      </div>
                    </div>

                    {canManageBusinessAndProducts && (
                      <button
                        onClick={() => deleteSalesTransaction(tx.id)}
                        title="Hapus Transaksi"
                        className="p-1.5 rounded-full hover:bg-loss-bg hover:text-loss-text text-ink/40 transition shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink/70 flex items-center justify-between">
              <span>Biaya Operasional & Dana R&D ({displayedExpensesHistory.length})</span>
            </h3>

            {displayedExpensesHistory.length === 0 ? (
              <div className="p-6 rounded-xl bg-cream/50 border border-dashed border-ink/15 text-center text-xs text-ink/60">
                Belum ada catatan biaya operasional / R&D pada filter tanggal ini.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {displayedExpensesHistory.map((ex) => {
                  const isRnd = ex.business_id === HOLDING_RND_ID;
                  return (
                    <div
                      key={ex.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                        isRnd
                          ? 'bg-pastel-yellow/20 border-ink/20'
                          : 'bg-cream/60 border-ink/10'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isRnd
                                ? 'bg-pastel-yellow text-ink border border-ink/20'
                                : 'bg-pastel-lavender text-ink'
                            }`}
                          >
                            {getBusinessName(ex.business_id)}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface border border-ink/10">
                            {ex.category}
                          </span>
                          <span className="text-[11px] font-bold text-ink/60">
                            📅 {formatIndoDate(ex.transaction_date)}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-ink">{ex.expense_name}</p>
                        <p className="font-serif font-extrabold text-sm text-loss-text">
                          -{formatRupiah(ex.amount)}
                        </p>
                        {ex.notes && (
                          <p className="text-xs text-ink/65 italic">"{ex.notes}"</p>
                        )}
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/70 bg-surface px-2.5 py-0.5 rounded-full border border-ink/10 mt-1">
                          <UserCheck className="w-3 h-3 text-cobalt" />
                          <span>Diinput oleh: {getUserDisplayName(ex.created_by)}</span>
                        </div>
                      </div>

                      {canManageBusinessAndProducts && (
                        <button
                          onClick={() => deleteOperationalExpense(ex.id)}
                          title="Hapus Biaya"
                          className="p-1.5 rounded-full hover:bg-loss-bg hover:text-loss-text text-ink/40 transition shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
