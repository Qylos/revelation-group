import React, { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  Layers,
  Award,
  Landmark,
  Scale,
  Settings2,
  History,
  FlaskConical,
  CheckCircle2,
  X,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DateRangeFilter, HOLDING_RND_ID } from '../types';
import {
  calculateFinancialSummary,
  formatFullIndoDate,
  formatIndoDate,
  formatRupiah,
  formatShortRupiah,
  getTodayDateString,
  isDateWithinRange,
} from '../utils/calculations';
import { ProfitLossBadge, DoodleStar, WavyCoralUnderline } from '../components/Doodles';
import { DashboardDateFilterBar } from '../components/DashboardDateFilterBar';
import { CustomDatePicker } from '../components/CustomDatePicker';

export const GlobalDashboardPage: React.FC = () => {
  const {
    db,
    currentUser,
    canManageBusinessAndProducts,
    updateBankSettings,
    recordBalanceAdjustment,
    deleteBalanceAdjustment,
  } = useApp();

  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayDateString());
  const [isCustomRangeMode, setIsCustomRangeMode] = useState<boolean>(false);

  // Modals & History toggle for Shared Partner Bank Account
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [showReconcileHistory, setShowReconcileHistory] = useState(false);
  const [bankFeedback, setBankFeedback] = useState<string | null>(null);

  // Opening Balance Form state
  const bankSettings = db.bank_settings || {
    bank_name: 'Rekening Bank Utama Partner',
    opening_balance: 50000000,
    opening_date: '2025-01-01',
    updated_by: 'usr-owner-david',
    updated_at: new Date().toISOString(),
  };
  const [bankNameInput, setBankNameInput] = useState(bankSettings.bank_name);
  const [openingBalanceInput, setOpeningBalanceInput] = useState(
    String(bankSettings.opening_balance)
  );
  const [openingDateInput, setOpeningDateInput] = useState(bankSettings.opening_date);

  // Reconcile Form state
  const [reconcileDate, setReconcileDate] = useState<string>(getTodayDateString());
  const [actualBankInput, setActualBankInput] = useState<string>('');
  const [reconcileReason, setReconcileReason] = useState<string>('');

  // Member only accesses /transactions
  if (currentUser?.role === 'member') {
    return <Navigate to="/transactions" replace />;
  }

  const activeBusinesses = useMemo(
    () => db.businesses.filter((b) => !b.is_archived),
    [db.businesses]
  );

  // All-time calculations for the Shared Partner Bank Balance
  const allTimeSummary = useMemo(
    () => calculateFinancialSummary(db.sales_transactions, db.operational_expenses),
    [db.sales_transactions, db.operational_expenses]
  );

  const allTimeRndExpense = useMemo(
    () =>
      db.operational_expenses
        .filter((ex) => ex.business_id === HOLDING_RND_ID)
        .reduce((sum, ex) => sum + Number(ex.amount || 0), 0),
    [db.operational_expenses]
  );

  const balanceAdjustments = db.balance_adjustments || [];

  const totalAdjustmentsAmount = useMemo(
    () =>
      balanceAdjustments.reduce(
        (sum, adj) => sum + Number(adj.difference_amount || 0),
        0
      ),
    [balanceAdjustments]
  );

  const currentBankBalance =
    Number(bankSettings.opening_balance || 0) +
    allTimeSummary.net_profit_or_loss +
    totalAdjustmentsAmount;

  // Date-filtered transactions for the Dashboard period
  const filteredSales = useMemo(
    () =>
      db.sales_transactions.filter((tx) =>
        isDateWithinRange(
          tx.transaction_date,
          dateRange,
          customStartDate,
          customEndDate,
          isCustomRangeMode
        )
      ),
    [
      db.sales_transactions,
      dateRange,
      customStartDate,
      customEndDate,
      isCustomRangeMode,
    ]
  );

  const filteredExpenses = useMemo(
    () =>
      db.operational_expenses.filter((ex) =>
        isDateWithinRange(
          ex.transaction_date,
          dateRange,
          customStartDate,
          customEndDate,
          isCustomRangeMode
        )
      ),
    [
      db.operational_expenses,
      dateRange,
      customStartDate,
      customEndDate,
      isCustomRangeMode,
    ]
  );

  const filteredRndExpenses = useMemo(
    () => filteredExpenses.filter((ex) => ex.business_id === HOLDING_RND_ID),
    [filteredExpenses]
  );

  const filteredBizExpenses = useMemo(
    () => filteredExpenses.filter((ex) => ex.business_id !== HOLDING_RND_ID),
    [filteredExpenses]
  );

  const rndPeriodTotal = useMemo(
    () => filteredRndExpenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [filteredRndExpenses]
  );

  const bizOpsPeriodTotal = useMemo(
    () => filteredBizExpenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [filteredBizExpenses]
  );

  const globalSummary = useMemo(
    () => calculateFinancialSummary(filteredSales, filteredExpenses),
    [filteredSales, filteredExpenses]
  );

  const businessPerformances = useMemo(() => {
    return activeBusinesses.map((biz) => {
      const bizSales = filteredSales.filter((tx) => tx.business_id === biz.id);
      const bizExpenses = filteredExpenses.filter((ex) => ex.business_id === biz.id);
      const summary = calculateFinancialSummary(bizSales, bizExpenses);
      const productsCount = db.products.filter(
        (p) => p.business_id === biz.id && p.is_active
      ).length;
      return {
        business: biz,
        summary,
        productsCount,
      };
    });
  }, [activeBusinesses, filteredSales, filteredExpenses, db.products]);

  const maxRevenueAmongBusinesses = useMemo(() => {
    const max = Math.max(
      ...businessPerformances.map((bp) => bp.summary.gross_revenue),
      1
    );
    return max;
  }, [businessPerformances]);

  const isGlobalProfit = globalSummary.profit_status === 'PROFIT';

  const getUserDisplayName = (userId: string): string => {
    const found = db.users.find((u) => u.id === userId);
    return found ? found.full_name : 'Partner';
  };

  const handleOpenOpeningBalanceModal = () => {
    setBankNameInput(bankSettings.bank_name);
    setOpeningBalanceInput(String(bankSettings.opening_balance));
    setOpeningDateInput(bankSettings.opening_date);
    setIsOpeningBalanceModalOpen(true);
  };

  const handleSaveOpeningBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const numericBalance = Number(openingBalanceInput || 0);
    updateBankSettings({
      bank_name: bankNameInput,
      opening_balance: numericBalance,
      opening_date: openingDateInput,
    });
    setIsOpeningBalanceModalOpen(false);
    setBankFeedback(
      `✅ Saldo Awal Bank berhasil diperbarui menjadi ${formatRupiah(numericBalance)}!`
    );
    setTimeout(() => setBankFeedback(null), 5000);
  };

  const handleOpenReconcileModal = () => {
    setReconcileDate(getTodayDateString());
    setActualBankInput(String(currentBankBalance));
    setReconcileReason('');
    setIsReconcileModalOpen(true);
  };

  const handleSaveReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualBankInput.trim() === '' || !reconcileReason.trim()) return;
    const actualVal = Number(actualBankInput);
    const diff = actualVal - currentBankBalance;
    recordBalanceAdjustment({
      adjustment_date: reconcileDate,
      system_balance_before: currentBankBalance,
      actual_bank_balance: actualVal,
      reason: reconcileReason,
    });
    setIsReconcileModalOpen(false);
    setBankFeedback(
      `✅ Rekonsiliasi berhasil! Saldo Bank kini disesuaikan menjadi ${formatRupiah(
        actualVal
      )} (Selisih: ${formatRupiah(diff, true)}).`
    );
    setTimeout(() => setBankFeedback(null), 5000);
  };

  const previewReconcileDiff =
    actualBankInput.trim() !== ''
      ? Number(actualBankInput) - currentBankBalance
      : 0;

  return (
    <div className="space-y-8">
      {/* Editorial Hero Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pastel-lavender/70 border border-ink/10 text-xs font-bold text-ink mb-2">
            <Layers className="w-3.5 h-3.5 text-cobalt" />
            <span>LAPORAN KONSOLIDASI • {activeBusinesses.length} UNIT BISNIS AKTIF</span>
          </div>
          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-cobalt tracking-tight flex items-center gap-3">
            <span>Global Dashboard</span>
            <DoodleStar className="w-7 h-7 shrink-0" color="#FDE047" />
          </h1>
          <p className="text-sm text-ink/70 mt-1 leading-relaxed">
            Analitik Laba/Rugi gabungan seluruh lini bisnis{' '}
            <span className="font-bold text-ink">Revelation Group</span>
            <br />
            berdasarkan tanggal transaksi.
          </p>
        </div>

        {/* Single-Line Date Range Filter Bar + Pilih Tanggal Popover */}
        <DashboardDateFilterBar
          dateRange={dateRange}
          onSelectPreset={(preset) => setDateRange(preset)}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          isRangeMode={isCustomRangeMode}
          onChangeCustomDates={(start, end, rangeMode) => {
            setCustomStartDate(start);
            setCustomEndDate(end);
            setIsCustomRangeMode(rangeMode);
          }}
          variant="surface"
        />
      </div>

      {/* Kas & Rekening Bank Partner (Shared Bank Account + Opening Balance + Reconciliation) */}
      <div className="bg-surface rounded-2xl border-2 border-ink/15 shadow-editorial overflow-hidden">
        <div className="bg-pastel-yellow/60 px-5 sm:px-6 py-3.5 border-b border-ink/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ink text-pastel-yellow flex items-center justify-center shadow-sm">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-ink block">
                KAS & REKENING BANK BERSAMA PARTNER
              </span>
              <span className="text-[11px] font-semibold text-ink/70">
                {bankSettings.bank_name} • Terhubung ke seluruh bisnis & pos Dana R&D
              </span>
            </div>
          </div>

          {canManageBusinessAndProducts && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenOpeningBalanceModal}
                className="px-3.5 py-1.5 rounded-full bg-surface hover:bg-cream text-ink border border-ink/20 text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
              >
                <Settings2 className="w-3.5 h-3.5 text-cobalt" />
                <span>Atur Saldo Awal</span>
              </button>
              <button
                type="button"
                onClick={handleOpenReconcileModal}
                className="px-4 py-1.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
              >
                <Scale className="w-3.5 h-3.5 text-pastel-yellow" />
                <span>Rekonsiliasi Saldo Bank</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReconcileHistory((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 transition ${
                  showReconcileHistory
                    ? 'bg-cobalt text-white border-cobalt'
                    : 'bg-cream/80 hover:bg-surface text-ink/80 border-ink/15'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat ({balanceAdjustments.length})</span>
              </button>
            </div>
          )}
        </div>

        {bankFeedback && (
          <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-xl bg-profit-bg border border-profit-accent text-profit-text text-xs sm:text-sm font-bold flex items-center justify-between">
            <span>{bankFeedback}</span>
            <button
              type="button"
              onClick={() => setBankFeedback(null)}
              className="text-xs underline ml-3"
            >
              Tutup
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Box 1: Saldo Awal Bank */}
          <div className="p-4 rounded-xl bg-cream/70 border border-ink/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-ink/65">
              <span>1. Saldo Awal Bank</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-ink/10 text-ink/70">
                Sejak {formatIndoDate(bankSettings.opening_date)}
              </span>
            </div>
            <p className="font-serif font-extrabold text-xl sm:text-2xl text-ink mt-2">
              {formatRupiah(bankSettings.opening_balance)}
            </p>
            <p className="text-[11px] text-ink/60 mt-1">
              Modal & kas awal rekening partner
            </p>
          </div>

          {/* Box 2: Akumulasi Laba/Rugi & R&D All-Time */}
          <div className="p-4 rounded-xl bg-cream/70 border border-ink/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-ink/65">
              <span>2. Laba/Rugi Bersih & R&D</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-ink/10 text-ink/70">
                All-Time
              </span>
            </div>
            <p
              className={`font-serif font-extrabold text-xl sm:text-2xl mt-2 ${
                allTimeSummary.net_profit_or_loss >= 0
                  ? 'text-profit-text'
                  : 'text-loss-text'
              }`}
            >
              {formatRupiah(allTimeSummary.net_profit_or_loss, true)}
            </p>
            <p className="text-[11px] text-ink/60 mt-1">
              Termasuk potongan R&D ({formatRupiah(allTimeRndExpense)})
            </p>
          </div>

          {/* Box 3: Total Penyesuaian / Rekonsiliasi */}
          <div className="p-4 rounded-xl bg-cream/70 border border-ink/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-ink/65">
              <span>3. Penyesuaian Rekonsiliasi</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-ink/10 text-ink/70">
                {balanceAdjustments.length}x Catatan
              </span>
            </div>
            <p
              className={`font-serif font-extrabold text-xl sm:text-2xl mt-2 ${
                totalAdjustmentsAmount === 0
                  ? 'text-ink'
                  : totalAdjustmentsAmount > 0
                  ? 'text-profit-text'
                  : 'text-loss-text'
              }`}
            >
              {totalAdjustmentsAmount === 0
                ? 'Rp 0'
                : formatRupiah(totalAdjustmentsAmount, true)}
            </p>
            <p className="text-[11px] text-ink/60 mt-1">
              Koreksi bunga, admin bank, atau selisih kas
            </p>
          </div>

          {/* Box 4: Saldo Akhir Bank Saat Ini */}
          <div className="p-4 rounded-xl bg-pastel-blue/70 border-2 border-cobalt flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs font-extrabold text-cobalt">
              <span>4. SALDO AKHIR BANK SAAT INI</span>
              <Landmark className="w-4 h-4 text-cobalt" />
            </div>
            <p className="font-serif font-extrabold text-2xl sm:text-3xl text-ink mt-2 tracking-tight">
              <span className="yellow-highlight">
                {formatRupiah(currentBankBalance)}
              </span>
            </p>
            <p className="text-[11px] font-semibold text-ink/75 mt-1">
              Saldo Awal + Laba Bersih All-Time ± Rekonsiliasi
            </p>
          </div>
        </div>

        {/* Collapsible Riwayat Rekonsiliasi Saldo Bank */}
        {showReconcileHistory && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-dashed border-ink/15 bg-cream/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-cobalt flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Log Audit Rekonsiliasi / Penyesuaian Saldo Bank</span>
              </h3>
              <span className="text-[11px] text-ink/60">
                Menjaga keseimbangan buku Revelation & mutasi rekening riil
              </span>
            </div>

            {balanceAdjustments.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface border border-ink/10 text-xs text-ink/60 text-center">
                Belum ada riwayat penyesuaian saldo. Klik tombol{' '}
                <strong>"Rekonsiliasi Saldo Bank"</strong> jika saldo rekening di bank berbeda dengan catatan sistem.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {balanceAdjustments.map((adj) => {
                  const isPositive = adj.difference_amount >= 0;
                  return (
                    <div
                      key={adj.id}
                      className="p-3 rounded-xl bg-surface border border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-ink">
                            📅 {formatFullIndoDate(adj.adjustment_date)}
                          </span>
                          <span
                            className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                              isPositive
                                ? 'bg-profit-bg text-profit-text'
                                : 'bg-loss-bg text-loss-text'
                            }`}
                          >
                            Selisih: {formatRupiah(adj.difference_amount, true)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-ink/65 bg-cream px-2 py-0.5 rounded-full">
                            <UserCheck className="w-3 h-3 text-cobalt" />
                            <span>Oleh: {getUserDisplayName(adj.created_by)}</span>
                          </span>
                        </div>
                        <p className="text-ink/80 font-medium">
                          Alasan: <strong>"{adj.reason}"</strong>
                        </p>
                        <p className="text-[11px] text-ink/60">
                          Saldo Buku Sebelum: {formatRupiah(adj.system_balance_before)} → Saldo Riil Bank:{' '}
                          <strong>{formatRupiah(adj.actual_bank_balance)}</strong>
                        </p>
                      </div>

                      {canManageBusinessAndProducts && (
                        <button
                          type="button"
                          onClick={() => deleteBalanceAdjustment(adj.id)}
                          title="Hapus Catatan Rekonsiliasi"
                          className="p-1.5 rounded-full hover:bg-loss-bg hover:text-loss-text text-ink/40 transition self-end sm:self-center"
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
        )}
      </div>

      {/* 3 Main Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden flex flex-col justify-between">
          <div className="bg-pastel-blue px-5 py-2.5 border-b border-ink/10 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
              1. Total Omzet Gabungan
            </span>
            <Wallet className="w-4 h-4 text-cobalt" />
          </div>
          <div className="p-5 sm:p-6">
            <p className="font-serif font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
              <span className="yellow-highlight">
                {formatRupiah(globalSummary.gross_revenue)}
              </span>
            </p>
            <div className="mt-4 pt-3 border-t border-dashed border-ink/10 flex items-center justify-between text-xs text-ink/70">
              <span>Total Produk Terjual:</span>
              <span className="font-bold text-ink">
                {globalSummary.qty_sold} pcs ({globalSummary.sales_count} transaksi)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden flex flex-col justify-between">
          <div className="bg-pastel-lavender px-5 py-2.5 border-b border-ink/10 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
              2. Total Pengeluaran (HPP + Ops + R&D)
            </span>
            <TrendingDown className="w-4 h-4 text-loss-text" />
          </div>
          <div className="p-5 sm:p-6">
            <p className="font-serif font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
              {formatRupiah(globalSummary.total_expenses)}
            </p>
            <div className="mt-4 pt-3 border-t border-dashed border-ink/10 space-y-1 text-xs">
              <div className="flex justify-between text-ink/70">
                <span>• Total Beban HPP (COGS):</span>
                <span className="font-bold text-ink">
                  {formatRupiah(globalSummary.total_hpp_cost)}
                </span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>• Operasional Unit Bisnis:</span>
                <span className="font-bold text-ink">
                  {formatRupiah(bizOpsPeriodTotal)}
                </span>
              </div>
              <div className="flex justify-between text-ink/80">
                <span>• 🧪 Dana R&D / Pusat:</span>
                <span className="font-extrabold text-loss-text">
                  {formatRupiah(rndPeriodTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border-2 shadow-editorial overflow-hidden flex flex-col justify-between ${
            isGlobalProfit
              ? 'bg-profit-bg/60 border-profit-accent'
              : 'bg-loss-bg/60 border-loss-accent'
          }`}
        >
          <div
            className={`px-5 py-2.5 border-b flex items-center justify-between ${
              isGlobalProfit
                ? 'bg-profit-accent/40 border-profit-accent text-profit-text'
                : 'bg-loss-accent/30 border-loss-accent text-loss-text'
            }`}
          >
            <span className="text-xs font-extrabold uppercase tracking-wider">
              3. Laba / Rugi Bersih Global
            </span>
            {isGlobalProfit ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p
                className={`font-serif font-extrabold text-2xl sm:text-3xl tracking-tight ${
                  isGlobalProfit ? 'text-profit-text' : 'text-loss-text'
                }`}
              >
                {formatRupiah(globalSummary.net_profit_or_loss, true)}
              </p>
              <ProfitLossBadge status={globalSummary.profit_status} />
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-ink/15 flex items-center justify-between text-xs">
              <span className="font-medium text-ink/80">
                Laba Kotor: <strong>{formatRupiah(globalSummary.gross_profit)}</strong>
              </span>
              <span className="font-extrabold px-2 py-0.5 rounded-full bg-surface/80 text-ink">
                Net Margin: {globalSummary.profit_margin_percent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Performa Antar Bisnis (Full Width, Tidak Bisa Di-Slide ke Samping) */}
      <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden">
        <div className="p-6 pb-4 border-b border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-xl text-cobalt flex items-center gap-2">
              <Award className="w-5 h-5 text-cobalt" />
              <span>Tabel Performa Antar Bisnis & Alokasi Dana R&D</span>
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              Performa tiap bisnis murni berdasarkan penjualannya, sedangkan pengeluaran R&D / Pusat tercatat terpisah di baris bawah.
            </p>
          </div>
        </div>

        <div className="w-full overflow-x-hidden">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-cream/80 border-b border-ink/10 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-ink/70">
                <th className="py-3.5 px-3 sm:px-5 w-[32%] sm:w-[30%]">Unit Bisnis / Pos</th>
                <th className="py-3.5 px-2 sm:px-3 text-right w-[17%]">Omzet</th>
                <th className="py-3.5 px-2 sm:px-3 text-right hidden sm:table-cell sm:w-[15%]">
                  Total HPP
                </th>
                <th className="py-3.5 px-2 sm:px-3 text-right hidden md:table-cell md:w-[14%]">
                  Operasional / R&D
                </th>
                <th className="py-3.5 px-2 sm:px-4 text-right w-[23%] sm:w-[16%]">
                  Laba / Rugi Bersih
                </th>
                <th className="py-3.5 px-2 sm:px-4 text-center w-[14%] sm:w-[10%]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 text-xs sm:text-sm">
              {businessPerformances.map(({ business, summary, productsCount }) => {
                const isProfit = summary.profit_status === 'PROFIT';
                return (
                  <tr key={business.id} className="hover:bg-cream/50 transition group">
                    <td className="py-4 px-3 sm:px-5">
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl border border-ink/15 flex items-center justify-center font-serif font-bold text-sm shrink-0 overflow-hidden"
                          style={{ backgroundColor: business.card_accent_color }}
                        >
                          {business.logo_url ? (
                            <img
                              src={business.logo_url}
                              alt={business.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            business.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/business/${business.id}/dashboard`}
                            className="font-bold text-ink group-hover:text-cobalt transition inline-flex items-center gap-1 leading-snug"
                          >
                            <span className="break-words">{business.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink/60 mt-0.5">
                            <span>{productsCount} Produk</span>
                            <span>•</span>
                            <span>{summary.qty_sold} terjual</span>
                            {canManageBusinessAndProducts && (
                              <>
                                <span>•</span>
                                <Link
                                  to={`/business/${business.id}/products`}
                                  className="text-cobalt font-semibold hover:underline"
                                >
                                  Atur HPP
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 sm:px-3 text-right font-bold text-ink">
                      {formatRupiah(summary.gross_revenue)}
                    </td>
                    <td className="py-4 px-2 sm:px-3 text-right text-ink/75 hidden sm:table-cell">
                      {formatRupiah(summary.total_hpp_cost)}
                    </td>
                    <td className="py-4 px-2 sm:px-3 text-right text-ink/75 hidden md:table-cell">
                      {formatRupiah(summary.total_operational_expense)}
                    </td>
                    <td
                      className={`py-4 px-2 sm:px-4 text-right font-extrabold ${
                        isProfit ? 'text-profit-text' : 'text-loss-text'
                      }`}
                    >
                      {formatRupiah(summary.net_profit_or_loss, true)}
                    </td>
                    <td className="py-4 px-2 sm:px-4 text-center">
                      <ProfitLossBadge
                        status={summary.profit_status}
                        label={isProfit ? 'PROFIT' : 'LOSS'}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}

              {/* Dedicated Corporate / R&D Row (Non-Business) */}
              <tr className="bg-pastel-yellow/15 hover:bg-pastel-yellow/25 transition">
                <td className="py-4 px-3 sm:px-5">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border border-ink/20 bg-pastel-yellow flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4 h-4 text-ink" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-ink flex items-center gap-1.5 leading-snug">
                        <span>Dana R&D & Beban Pusat (Holding)</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink/65 mt-0.5">
                        <span>{filteredRndExpenses.length} catatan R&D</span>
                        <span>•</span>
                        <span>Non-Bisnis</span>
                        <span>•</span>
                        <Link
                          to="/transactions"
                          className="text-cobalt font-semibold hover:underline"
                        >
                          Input R&D →
                        </Link>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2 sm:px-3 text-right text-ink/45 font-semibold">
                  —
                </td>
                <td className="py-4 px-2 sm:px-3 text-right text-ink/45 hidden sm:table-cell">
                  —
                </td>
                <td className="py-4 px-2 sm:px-3 text-right font-bold text-loss-text hidden md:table-cell">
                  {formatRupiah(rndPeriodTotal)}
                </td>
                <td className="py-4 px-2 sm:px-4 text-right font-extrabold text-loss-text">
                  {rndPeriodTotal > 0 ? `-${formatRupiah(rndPeriodTotal)}` : 'Rp 0'}
                </td>
                <td className="py-4 px-2 sm:px-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pastel-yellow border border-ink/20 text-ink">
                    R&D PUSAT
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-pastel-yellow/35 border-t-2 border-ink/20 font-extrabold text-xs sm:text-sm">
                <td className="py-3.5 px-3 sm:px-5">
                  TOTAL GABUNGAN REVELATION GROUP
                </td>
                <td className="py-3.5 px-2 sm:px-3 text-right">
                  {formatRupiah(globalSummary.gross_revenue)}
                </td>
                <td className="py-3.5 px-2 sm:px-3 text-right hidden sm:table-cell">
                  {formatRupiah(globalSummary.total_hpp_cost)}
                </td>
                <td className="py-3.5 px-2 sm:px-3 text-right hidden md:table-cell">
                  {formatRupiah(globalSummary.total_operational_expense)}
                </td>
                <td
                  className={`py-3.5 px-2 sm:px-4 text-right ${
                    isGlobalProfit ? 'text-profit-text' : 'text-loss-text'
                  }`}
                >
                  {formatRupiah(globalSummary.net_profit_or_loss, true)}
                </td>
                <td className="py-3.5 px-2 sm:px-4 text-center">
                  <ProfitLossBadge
                    status={globalSummary.profit_status}
                    label={isGlobalProfit ? 'PROFIT' : 'LOSS'}
                    size="sm"
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-4 bg-cream/50 border-t border-ink/10 text-xs text-ink/70 flex flex-wrap items-center justify-between gap-2">
          <span>
            💡 <strong>Rumus Laba Bersih Global:</strong> (Omzet Penjualan − Total HPP Snapshot) − (Operasional Bisnis + Dana R&D Pusat)
          </span>
          <span className="font-hand text-sm font-bold text-cobalt">
            Revelation Group Analytics
          </span>
        </div>
      </div>

      {/* Grafik Perbandingan Bisnis */}
      <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif font-bold text-xl text-cobalt">
            Grafik Perbandingan Bisnis
          </h2>
          <span className="font-hand text-base text-ink/70">Omzet vs Laba Bersih</span>
        </div>
        <div className="w-28 mb-5">
          <WavyCoralUnderline />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessPerformances.map(({ business, summary }) => {
            const revPercent = Math.max(
              Math.min(
                Math.round((summary.gross_revenue / maxRevenueAmongBusinesses) * 100),
                100
              ),
              4
            );
            const netPercent = Math.max(
              Math.min(
                Math.round(
                  (Math.abs(summary.net_profit_or_loss) / maxRevenueAmongBusinesses) *
                    100
                ),
                100
              ),
              4
            );
            const isProfit = summary.profit_status === 'PROFIT';

            return (
              <div
                key={business.id}
                className="p-4 rounded-xl bg-cream/60 border border-ink/10 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/business/${business.id}/dashboard`}
                    className="font-bold text-sm text-ink hover:text-cobalt transition flex items-center gap-2 truncate"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-ink/30 shrink-0"
                      style={{ backgroundColor: business.card_accent_color }}
                    />
                    <span className="truncate">{business.name}</span>
                  </Link>
                  <ProfitLossBadge
                    status={summary.profit_status}
                    label={
                      isProfit
                        ? `+${formatShortRupiah(summary.net_profit_or_loss)}`
                        : formatShortRupiah(summary.net_profit_or_loss)
                    }
                    size="sm"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-ink/70 font-semibold">
                    <span>Omzet Penjualan</span>
                    <span>{formatRupiah(summary.gross_revenue)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-ink/10">
                    <div
                      className="h-full bg-cobalt rounded-full transition-all duration-500"
                      style={{ width: `${revPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-ink/70 font-semibold">
                    <span>{isProfit ? 'Laba Bersih' : 'Rugi Bersih'}</span>
                    <span
                      className={
                        isProfit
                          ? 'text-profit-text font-bold'
                          : 'text-loss-text font-bold'
                      }
                    >
                      {formatRupiah(summary.net_profit_or_loss, true)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-ink/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isProfit ? 'bg-profit-accent' : 'bg-loss-accent'
                      }`}
                      style={{ width: `${netPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Transaksi / Dana R&D Hari Ini ↗</span>
          </Link>
          {canManageBusinessAndProducts && (
            <Link
              to="/businesses"
              className="text-xs font-bold text-cobalt hover:underline"
            >
              Kelola Unit Bisnis →
            </Link>
          )}
        </div>
      </div>

      {/* Modal 1: Atur Saldo Awal Bank Partner */}
      {isOpeningBalanceModalOpen && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border-2 border-ink shadow-editorial max-w-md w-full overflow-hidden">
            <div className="bg-pastel-yellow px-6 py-4 border-b border-ink/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-ink" />
                <h3 className="font-serif font-extrabold text-lg text-ink">
                  Atur Saldo Awal Bank Partner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpeningBalanceModalOpen(false)}
                className="p-1 rounded-full hover:bg-ink/10 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpeningBalance} className="p-6 space-y-4">
              <p className="text-xs text-ink/70 leading-relaxed">
                Tetapkan <strong>Saldo Awal Rekening Bank Bersama</strong> yang terhubung ke seluruh partner Revelation Group.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Nama Bank / Rekening Bersama *
                </label>
                <input
                  type="text"
                  required
                  value={bankNameInput}
                  onChange={(e) => setBankNameInput(e.target.value)}
                  placeholder="Contoh: BCA Prioritas — Rekening Partner"
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Nominal Saldo Awal Bank (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  placeholder="Contoh: 50000000"
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Tanggal Pencatatan Saldo Awal *
                </label>
                <CustomDatePicker
                  value={openingDateInput}
                  onChange={(d) => setOpeningDateInput(d)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpeningBalanceModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-cream text-ink text-xs font-bold hover:bg-ink/10 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Saldo Awal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Rekonsiliasi / Penyesuaian Saldo Bank */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border-2 border-ink shadow-editorial max-w-lg w-full overflow-hidden">
            <div className="bg-pastel-blue px-6 py-4 border-b border-ink/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cobalt" />
                <h3 className="font-serif font-extrabold text-lg text-ink">
                  Rekonsiliasi / Penyesuaian Saldo Bank
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="p-1 rounded-full hover:bg-ink/10 text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReconciliation} className="p-6 space-y-4">
              <p className="text-xs text-ink/70 leading-relaxed">
                Gunakan fitur ini apabila <strong>Saldo Riil di Mutasi Bank</strong> tidak seimbang dengan <strong>Saldo Buku Sistem Revelation</strong> (misal karena biaya admin bank, bunga, atau selisih transaksi).
              </p>

              <div className="p-3.5 rounded-2xl bg-cream border border-ink/15 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-ink/60 block">
                    Saldo Buku Sistem Saat Ini
                  </span>
                  <span className="font-serif font-extrabold text-lg text-ink">
                    {formatRupiah(currentBankBalance)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-ink/60 block">
                    Selisih Koreksi Otomatis
                  </span>
                  <span
                    className={`font-serif font-extrabold text-lg ${
                      previewReconcileDiff === 0
                        ? 'text-ink/60'
                        : previewReconcileDiff > 0
                        ? 'text-profit-text'
                        : 'text-loss-text'
                    }`}
                  >
                    {previewReconcileDiff === 0
                      ? 'Rp 0 (Seimbang)'
                      : formatRupiah(previewReconcileDiff, true)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                    Tanggal Rekonsiliasi *
                  </label>
                  <CustomDatePicker
                    value={reconcileDate}
                    onChange={(d) => setReconcileDate(d)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                    Saldo Riil di Bank Saat Ini (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={actualBankInput}
                    onChange={(e) => setActualBankInput(e.target.value)}
                    placeholder="Masukkan angka sesuai mutasi bank"
                    className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-cobalt"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                  Catatan / Alasan Penyesuaian *
                </label>
                <input
                  type="text"
                  required
                  value={reconcileReason}
                  onChange={(e) => setReconcileReason(e.target.value)}
                  placeholder="Contoh: Potongan biaya admin bank bulanan & pajak bunga"
                  className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReconcileModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-cream text-ink text-xs font-bold hover:bg-ink/10 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Rekonsiliasi Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
