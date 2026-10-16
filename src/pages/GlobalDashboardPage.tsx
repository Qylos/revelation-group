import React, { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  Award,
  Landmark,
  Scale,
  History,
  FlaskConical,
  CheckCircle2,
  X,
  Trash2,
  UserCheck,
  Plus,
  Minus,
  Tag,
  BarChart3,
  PieChart,
  ShoppingBag,
  Receipt,
  Package,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DateRangeFilter, HOLDING_RND_ID, SUPER_ADMIN_ID, SUPER_ADMIN_EMAIL } from '../types';
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
import { CustomSelect, SelectOption } from '../components/CustomSelect';

export const GlobalDashboardPage: React.FC = () => {
  const {
    db,
    currentUser,
    isSuperAdmin,
    canManageBusinessAndProducts,
    updateBankSettings,
    recordBalanceAdjustment,
    deleteBalanceAdjustment,
  } = useApp();

  const isSuperAdminUser =
    Boolean(currentUser) &&
    (isSuperAdmin ||
      currentUser!.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
      currentUser!.id === SUPER_ADMIN_ID ||
      currentUser!.role === 'super_admin');

  // Business Switcher State (Beside Global Dashboard title)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('GLOBAL');

  // Trend Breakdown Modal State (for business view)
  const [selectedTrendDate, setSelectedTrendDate] = useState<string | null>(null);

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

  // Upgraded Reconcile Form state
  const [reconcileTab, setReconcileTab] = useState<'input' | 'koreksi' | 'report' | 'log'>('input');
  const [reconcileType, setReconcileType] = useState<'addition' | 'deduction'>('deduction');
  const [reconcileNominal, setReconcileNominal] = useState<string>('');
  const [reconcileTag, setReconcileTag] = useState<string>('Biaya Admin Bank');
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

  // Business Options & Selected Business State
  const businessOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'GLOBAL',
        label: `Semua Bisnis (${activeBusinesses.length})`,
      },
      ...activeBusinesses.map((biz) => ({
        value: biz.id,
        label: biz.name,
        accentColor: biz.card_accent_color,
        logoUrl: biz.logo_url || undefined,
      })),
    ],
    [activeBusinesses]
  );

  const selectedBiz = useMemo(
    () =>
      selectedBusinessId !== 'GLOBAL'
        ? activeBusinesses.find((b) => b.id === selectedBusinessId) || null
        : null,
    [selectedBusinessId, activeBusinesses]
  );

  // Business-Specific Filtered Transactions & Calculations
  const bizSales = useMemo(() => {
    if (!selectedBiz) return [];
    return filteredSales.filter((tx) => tx.business_id === selectedBiz.id);
  }, [filteredSales, selectedBiz]);

  const bizExpenses = useMemo(() => {
    if (!selectedBiz) return [];
    return filteredExpenses.filter((ex) => ex.business_id === selectedBiz.id);
  }, [filteredExpenses, selectedBiz]);

  const bizSummary = useMemo(() => {
    if (!selectedBiz) return null;
    return calculateFinancialSummary(bizSales, bizExpenses);
  }, [bizSales, bizExpenses, selectedBiz]);

  const bizDailyTrend = useMemo(() => {
    if (!selectedBiz) return [];
    const map = new Map<
      string,
      { date: string; revenue: number; hpp: number; ops: number; net: number }
    >();

    bizSales.forEach((tx) => {
      const cur = map.get(tx.transaction_date) || {
        date: tx.transaction_date,
        revenue: 0,
        hpp: 0,
        ops: 0,
        net: 0,
      };
      const rev = Number(tx.qty) * Number(tx.selling_price_snapshot);
      const hpp = Number(tx.qty) * Number(tx.hpp_snapshot);
      cur.revenue += rev;
      cur.hpp += hpp;
      cur.net = cur.revenue - cur.hpp - cur.ops;
      map.set(tx.transaction_date, cur);
    });

    bizExpenses.forEach((ex) => {
      const cur = map.get(ex.transaction_date) || {
        date: ex.transaction_date,
        revenue: 0,
        hpp: 0,
        ops: 0,
        net: 0,
      };
      cur.ops += Number(ex.amount);
      cur.net = cur.revenue - cur.hpp - cur.ops;
      map.set(ex.transaction_date, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [bizSales, bizExpenses, selectedBiz]);

  const maxBizTrendVal = useMemo(() => {
    return Math.max(
      ...bizDailyTrend.map((d) => Math.max(d.revenue, Math.abs(d.net))),
      1
    );
  }, [bizDailyTrend]);

  const selectedTrendData = useMemo(() => {
    if (!selectedTrendDate || !selectedBiz) return null;
    const targetDay = bizDailyTrend.find((d) => d.date === selectedTrendDate);
    const revenue = targetDay?.revenue || 0;
    const hpp = targetDay?.hpp || 0;
    const ops = targetDay?.ops || 0;
    const grossProfit = revenue - hpp;
    const netProfit = targetDay?.net ?? grossProfit - ops;
    const isProfit = netProfit >= 0;

    const sales = bizSales.filter((tx) => tx.transaction_date === selectedTrendDate);
    const expenses = bizExpenses.filter((ex) => ex.transaction_date === selectedTrendDate);

    let insight = '';
    if (sales.length === 0 && expenses.length === 0) {
      insight = 'Tidak ada transaksi penjualan maupun pengeluaran pada tanggal ini.';
    } else if (sales.length === 0 && ops > 0) {
      insight = `Penyebab Rugi: Tidak ada penjualan produk tercatat pada hari ini, namun terdapat beban pengeluaran operasional sebesar ${formatRupiah(
        ops
      )}, sehingga menyebabkan defisit bersih ${formatRupiah(Math.abs(netProfit))}.`;
    } else if (isProfit) {
      if (ops === 0) {
        insight = `Penyebab Laba: Penjualan produk menghasilkan omzet ${formatRupiah(
          revenue
        )} dengan margin kotor ${formatRupiah(
          grossProfit
        )}. Tanpa ada beban operasional hari ini, seluruh margin kotor menjadi laba bersih.`;
      } else {
        insight = `Penyebab Laba: Margin kotor penjualan produk (${formatRupiah(
          grossProfit
        )}) berhasil melampaui seluruh beban biaya operasional (${formatRupiah(
          ops
        )}), menghasilkan laba bersih ${formatRupiah(netProfit)}.`;
      }
    } else {
      insight = `Penyebab Rugi: Meskipun terdapat omzet sebesar ${formatRupiah(
        revenue
      )} (laba kotor ${formatRupiah(
        grossProfit
      )}), total pengeluaran operasional hari ini yang mencapai ${formatRupiah(
        ops
      )} lebih besar daripada margin yang didapat, sehingga menimbulkan rugi bersih ${formatRupiah(
        Math.abs(netProfit)
      )}.`;
    }

    return {
      date: selectedTrendDate,
      revenue,
      hpp,
      grossProfit,
      ops,
      netProfit,
      isProfit,
      insight,
      sales,
      expenses,
    };
  }, [selectedTrendDate, bizDailyTrend, bizSales, bizExpenses, selectedBiz]);

  const bizProductLeaderboard = useMemo(() => {
    if (!selectedBiz) return [];
    const prodMap = new Map<
      string,
      {
        productId: string;
        name: string;
        qtySold: number;
        totalRevenue: number;
        totalHpp: number;
        grossProfit: number;
      }
    >();

    bizSales.forEach((tx) => {
      const prod = db.products.find((p) => p.id === tx.product_id);
      const name = prod ? prod.name : 'Produk Terhapus';
      const cur = prodMap.get(tx.product_id) || {
        productId: tx.product_id,
        name,
        qtySold: 0,
        totalRevenue: 0,
        totalHpp: 0,
        grossProfit: 0,
      };
      const rev = Number(tx.qty) * Number(tx.selling_price_snapshot);
      const hpp = Number(tx.qty) * Number(tx.hpp_snapshot);
      cur.qtySold += Number(tx.qty);
      cur.totalRevenue += rev;
      cur.totalHpp += hpp;
      cur.grossProfit = cur.totalRevenue - cur.totalHpp;
      prodMap.set(tx.product_id, cur);
    });

    return Array.from(prodMap.values()).sort(
      (a, b) => b.grossProfit - a.grossProfit
    );
  }, [bizSales, db.products, selectedBiz]);

  // Historical Tag System for Reconciliation
  const DEFAULT_TAGS = [
    'Bunga Bank',
    'Biaya Admin Bank',
    'Pajak Bunga',
    'Tarik Tunai Dividen',
    'Koreksi Kasir',
    'Top-up Kas',
    'Selisih Transaksi',
  ];

  const historicalTags = useMemo(() => {
    const recorded = (db.balance_adjustments || [])
      .map((a) => a.tag?.trim())
      .filter((t): t is string => Boolean(t));
    return Array.from(new Set([...DEFAULT_TAGS, ...recorded]));
  }, [db.balance_adjustments]);

  const tagReport = useMemo(() => {
    const map = new Map<
      string,
      { tag: string; additions: number; deductions: number; net: number; count: number }
    >();

    (db.balance_adjustments || []).forEach((adj) => {
      const tag = adj.tag?.trim() || 'Lain-lain / Tanpa Tag';
      const cur = map.get(tag) || {
        tag,
        additions: 0,
        deductions: 0,
        net: 0,
        count: 0,
      };
      cur.count += 1;
      const diff = Number(adj.difference_amount || 0);
      if (diff >= 0) {
        cur.additions += diff;
      } else {
        cur.deductions += Math.abs(diff);
      }
      cur.net += diff;
      map.set(tag, cur);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.additions + b.deductions - (a.additions + a.deductions)
    );
  }, [db.balance_adjustments]);

  const topDeductionTag = useMemo(() => {
    const sorted = [...tagReport].sort((a, b) => b.deductions - a.deductions);
    return sorted[0]?.deductions > 0 ? sorted[0] : null;
  }, [tagReport]);

  const topAdditionTag = useMemo(() => {
    const sorted = [...tagReport].sort((a, b) => b.additions - a.additions);
    return sorted[0]?.additions > 0 ? sorted[0] : null;
  }, [tagReport]);

  const handleOpenReconcileModal = () => {
    setReconcileDate(getTodayDateString());
    setActualBankInput(String(currentBankBalance));
    setReconcileNominal('');
    setReconcileReason('');
    setReconcileTag('Biaya Admin Bank');
    setReconcileType('deduction');
    setReconcileTab('input');
    setIsReconcileModalOpen(true);
  };

  const handleSaveManualReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(reconcileNominal);
    if (!amount || amount <= 0) return;
    const diff = reconcileType === 'addition' ? amount : -amount;
    const newActual = currentBankBalance + diff;

    recordBalanceAdjustment({
      adjustment_date: reconcileDate,
      system_balance_before: currentBankBalance,
      actual_bank_balance: newActual,
      reason:
        reconcileReason.trim() ||
        (reconcileType === 'addition' ? 'Penambahan Saldo Bank' : 'Pengurangan Saldo Bank'),
      tag: reconcileTag.trim() || 'Penyesuaian Manual',
      type: reconcileType,
    });

    setIsReconcileModalOpen(false);
    setBankFeedback(
      `✅ Berhasil mencatat ${
        reconcileType === 'addition' ? 'penambahan' : 'pengurangan'
      } saldo sebesar ${formatRupiah(amount)} (Tag: #${reconcileTag}).`
    );
    setTimeout(() => setBankFeedback(null), 5000);
  };

  const handleSaveKoreksiReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualBankInput.trim() === '') return;
    const actualVal = Number(actualBankInput);
    const diff = actualVal - currentBankBalance;
    const type = diff >= 0 ? 'addition' : 'deduction';

    recordBalanceAdjustment({
      adjustment_date: reconcileDate,
      system_balance_before: currentBankBalance,
      actual_bank_balance: actualVal,
      reason: reconcileReason.trim() || 'Koreksi Saldo Otomatis',
      tag: reconcileTag.trim() || 'Koreksi Saldo',
      type,
    });

    setIsReconcileModalOpen(false);
    setBankFeedback(
      `✅ Saldo riil bank berhasil disesuaikan menjadi ${formatRupiah(
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
      {/* Editorial Hero Header & Dynamic Business Selector + Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-cobalt tracking-tight flex items-center gap-3">
            <span>{selectedBiz ? selectedBiz.name : 'Global Dashboard'}</span>
            <DoodleStar
              className="w-7 h-7 shrink-0"
              color={selectedBiz?.card_accent_color || '#FDE047'}
            />
          </h1>

          <p className="text-sm text-ink/70 mt-1.5 leading-relaxed">
            {selectedBiz ? (
              <span>
                {selectedBiz.description ||
                  `Laporan performa keuangan, omzet, HPP, dan analitik performa ${selectedBiz.name}.`}
              </span>
            ) : (
              <span>
                Analitik Laba/Rugi gabungan seluruh lini bisnis{' '}
                <span className="font-bold text-ink">Revelation Group</span>
                <br />
                berdasarkan tanggal transaksi.
              </span>
            )}
          </p>
        </div>

        {/* Right Section: Business Selector (Flush Right with All Time) + Date Filter Bar */}
        <div className="flex flex-col items-start lg:items-end gap-2.5">
          {/* Pilihan Bisnis di Kanan Sejajar All Time */}
          <div className="w-[195px] sm:w-[225px]">
            <CustomSelect
              size="sm"
              align="right"
              value={selectedBusinessId}
              onChange={(val) => setSelectedBusinessId(val)}
              options={businessOptions}
              className="w-full"
              buttonClassName="bg-surface hover:border-cobalt text-ink border-ink/20 shadow-sm text-xs font-bold"
              menuClassName="min-w-[240px]"
            />
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
      </div>

      {selectedBiz && bizSummary ? (
        /* Business-Specific Dashboard View */
        <div className="space-y-8 animate-fadeIn">
          {/* 4 Business Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Omzet Penjualan */}
            <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden flex flex-col justify-between">
              <div className="bg-pastel-blue px-4 py-2.5 border-b border-ink/10 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
                  1. Omzet Penjualan
                </span>
                <Wallet className="w-4 h-4 text-cobalt" />
              </div>
              <div className="p-4 sm:p-5">
                <p className="font-serif font-extrabold text-xl sm:text-2xl text-ink tracking-tight">
                  <span className="yellow-highlight">
                    {formatRupiah(bizSummary.gross_revenue)}
                  </span>
                </p>
                <div className="mt-3 pt-2.5 border-t border-dashed border-ink/10 flex items-center justify-between text-xs text-ink/70">
                  <span>Volume Terjual:</span>
                  <span className="font-bold text-ink">
                    {bizSummary.qty_sold} pcs ({bizSummary.sales_count} tx)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Beban HPP Terpakai */}
            <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden flex flex-col justify-between">
              <div className="bg-pastel-yellow px-4 py-2.5 border-b border-ink/10 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
                  2. HPP Terpakai
                </span>
                <Package className="w-4 h-4 text-ink" />
              </div>
              <div className="p-4 sm:p-5">
                <p className="font-serif font-extrabold text-xl sm:text-2xl text-ink tracking-tight">
                  {formatRupiah(bizSummary.total_hpp_cost)}
                </p>
                <div className="mt-3 pt-2.5 border-t border-dashed border-ink/10 flex items-center justify-between text-xs text-ink/70">
                  <span>Laba Kotor (Gross):</span>
                  <span className="font-bold text-ink">
                    {formatRupiah(bizSummary.gross_profit)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Beban Operasional Bisnis */}
            <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial overflow-hidden flex flex-col justify-between">
              <div className="bg-pastel-lavender px-4 py-2.5 border-b border-ink/10 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
                  3. Beban Operasional
                </span>
                <Receipt className="w-4 h-4 text-loss-text" />
              </div>
              <div className="p-4 sm:p-5">
                <p className="font-serif font-extrabold text-xl sm:text-2xl text-ink tracking-tight">
                  {formatRupiah(bizSummary.total_operational_expense)}
                </p>
                <div className="mt-3 pt-2.5 border-t border-dashed border-ink/10 flex items-center justify-between text-xs text-ink/70">
                  <span>Jumlah Catatan:</span>
                  <span className="font-bold text-ink">
                    {bizExpenses.length} pengeluaran
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Laba / Rugi Bersih Bisnis */}
            <div
              className={`rounded-2xl border-2 shadow-editorial overflow-hidden flex flex-col justify-between ${
                bizSummary.profit_status === 'PROFIT'
                  ? 'bg-profit-bg/60 border-profit-accent'
                  : 'bg-loss-bg/60 border-loss-accent'
              }`}
            >
              <div
                className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  bizSummary.profit_status === 'PROFIT'
                    ? 'bg-profit-accent/40 border-profit-accent text-profit-text'
                    : 'bg-loss-accent/30 border-loss-accent text-loss-text'
                }`}
              >
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  4. Laba / Rugi Bersih
                </span>
                {bizSummary.profit_status === 'PROFIT' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <p
                    className={`font-serif font-extrabold text-xl sm:text-2xl tracking-tight ${
                      bizSummary.profit_status === 'PROFIT'
                        ? 'text-profit-text'
                        : 'text-loss-text'
                    }`}
                  >
                    {formatRupiah(bizSummary.net_profit_or_loss, true)}
                  </p>
                  <ProfitLossBadge status={bizSummary.profit_status} size="sm" />
                </div>
                <div className="mt-3 pt-2.5 border-t border-dashed border-ink/15 flex items-center justify-between text-xs">
                  <span className="text-ink/70">Net Margin:</span>
                  <span className="font-extrabold text-ink">
                    {bizSummary.profit_margin_percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column: Daily Trend (Descending with breakdown click) & Top Products Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Tren Laba Harian (Urutan Terbaru ke Terlama, Clickable Cards) */}
            <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial p-5 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-serif font-bold text-lg text-cobalt flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cobalt" />
                    <span>Tren Performa Harian</span>
                  </h3>
                  <p className="text-xs text-ink/60 mt-0.5">
                    Urutan tanggal terbaru ke terlama • Klik baris/kartu untuk rincian & analisa
                  </p>
                </div>
                <span className="text-xs font-bold text-ink/50 bg-cream px-2.5 py-1 rounded-full border border-ink/10">
                  {bizDailyTrend.length} Hari Aktif
                </span>
              </div>

              <div className="w-20 mb-4">
                <WavyCoralUnderline />
              </div>

              {bizDailyTrend.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/50 bg-cream/50 rounded-xl border border-ink/10 my-auto">
                  Belum ada catatan penjualan atau operasional pada periode ini.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 revelation-scroll">
                  {bizDailyTrend.map((d) => {
                    const isProfit = d.net >= 0;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setSelectedTrendDate(d.date)}
                        className="w-full text-left p-3.5 rounded-xl bg-cream/60 hover:bg-surface border border-ink/10 hover:border-cobalt hover:shadow-sm transition group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-ink group-hover:text-cobalt transition">
                              📅 {formatFullIndoDate(d.date)}
                            </span>
                            <span className="text-[10px] text-ink/40 group-hover:text-cobalt group-hover:underline inline-flex items-center gap-0.5">
                              Lihat rincian ↗
                            </span>
                          </div>
                          <span
                            className={`font-extrabold text-xs px-2 py-0.5 rounded-full ${
                              isProfit
                                ? 'bg-profit-bg text-profit-text'
                                : 'bg-loss-bg text-loss-text'
                            }`}
                          >
                            {formatRupiah(d.net, true)}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-ink/70">
                          <div>
                            <span className="text-ink/40 block text-[10px]">Omzet</span>
                            <span className="font-bold text-ink">{formatRupiah(d.revenue)}</span>
                          </div>
                          <div>
                            <span className="text-ink/40 block text-[10px]">HPP</span>
                            <span className="font-semibold">{formatRupiah(d.hpp)}</span>
                          </div>
                          <div>
                            <span className="text-ink/40 block text-[10px]">Operasional</span>
                            <span className="font-semibold">{formatRupiah(d.ops)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Leaderboard Produk Terlaris & Margin */}
            <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial p-5 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-serif font-bold text-lg text-cobalt flex items-center gap-2">
                    <Award className="w-5 h-5 text-cobalt" />
                    <span>Produk Terlaris & Kontribusi Margin</span>
                  </h3>
                  <p className="text-xs text-ink/60 mt-0.5">
                    Peringkat produk berdasarkan total laba kotor kontribusi
                  </p>
                </div>
              </div>

              <div className="w-20 mb-4">
                <WavyCoralUnderline />
              </div>

              {bizProductLeaderboard.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/50 bg-cream/50 rounded-xl border border-ink/10 my-auto">
                  Belum ada produk yang terjual pada rentang tanggal ini.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 revelation-scroll">
                  {bizProductLeaderboard.map((item, idx) => (
                    <div
                      key={item.productId}
                      className="p-3.5 rounded-xl bg-cream/60 border border-ink/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-ink text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{item.name}</p>
                          <p className="text-[11px] text-ink/60">
                            Terjual: <strong>{item.qtySold} pcs</strong> • Omzet: {formatRupiah(item.totalRevenue)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-ink/50 block">Laba Kotor</span>
                        <span className="font-extrabold text-profit-text">
                          +{formatRupiah(item.grossProfit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Footer for Business */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-cream/60 border border-ink/10">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/transactions"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Input Transaksi {selectedBiz.name} ↗</span>
              </Link>
              {canManageBusinessAndProducts && (
                <Link
                  to={`/business/${selectedBiz.id}/products`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface hover:bg-cream text-ink border border-ink/15 text-xs font-bold transition"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Atur Produk & HPP</span>
                </Link>
              )}
            </div>
            <Link
              to={`/business/${selectedBiz.id}/dashboard`}
              className="text-xs font-bold text-cobalt hover:underline inline-flex items-center gap-1"
            >
              <span>Buka Dashboard Analitik Lengkap {selectedBiz.name}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Global Consolidated Dashboard View */
        <>
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

          {canManageBusinessAndProducts && balanceAdjustments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
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
          {/* Box 1: Saldo Awal Bank — Clickable ONLY for Super Admin */}
          <div
            onClick={isSuperAdminUser ? handleOpenOpeningBalanceModal : undefined}
            role={isSuperAdminUser ? 'button' : undefined}
            tabIndex={isSuperAdminUser ? 0 : undefined}
            title={
              isSuperAdminUser
                ? 'Klik untuk atur Saldo Awal Bank (Khusus Super Admin)'
                : undefined
            }
            className={`p-4 rounded-xl bg-cream/70 border border-ink/10 flex flex-col justify-between transition-all ${
              isSuperAdminUser
                ? 'hover:bg-pastel-yellow/50 hover:border-ink hover:shadow-[0_4px_0_rgba(17,24,39,0.18)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer group'
                : 'cursor-default'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-ink/65">
              <span className={isSuperAdminUser ? 'group-hover:text-ink flex items-center gap-1' : ''}>
                1. Saldo Awal Bank {isSuperAdminUser && '↗'}
              </span>
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

          {/* Box 2: Akumulasi Laba/Rugi & R&D All-Time — Static display */}
          <div className="p-4 rounded-xl bg-cream/70 border border-ink/10 flex flex-col justify-between cursor-default">
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

          {/* Box 3: Total Penyesuaian / Rekonsiliasi — Clickable for Super Admin & Partner Admin */}
          <div
            onClick={canManageBusinessAndProducts ? handleOpenReconcileModal : undefined}
            role={canManageBusinessAndProducts ? 'button' : undefined}
            tabIndex={canManageBusinessAndProducts ? 0 : undefined}
            title={
              canManageBusinessAndProducts
                ? 'Klik untuk membuka Modul Rekonsiliasi Saldo Bank'
                : undefined
            }
            className={`p-4 rounded-xl bg-cream/70 border border-ink/10 flex flex-col justify-between transition-all ${
              canManageBusinessAndProducts
                ? 'hover:bg-pastel-blue/50 hover:border-cobalt hover:shadow-[0_4px_0_rgba(26,69,229,0.22)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer group'
                : 'cursor-default'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-ink/65">
              <span
                className={
                  canManageBusinessAndProducts
                    ? 'group-hover:text-cobalt flex items-center gap-1'
                    : ''
                }
              >
                3. Penyesuaian Rekonsiliasi {canManageBusinessAndProducts && '↗'}
              </span>
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
          <div className="p-4 rounded-xl bg-pastel-blue/70 border-2 border-cobalt flex flex-col justify-between shadow-sm cursor-default">
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
    </>
  )}

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

      {/* Modal 2: Modul Rekonsiliasi Saldo Bank (Sistem Tag, Tambah/Kurang Saldo & Laporan) */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface rounded-3xl border-2 border-ink shadow-editorial max-w-2xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-pastel-blue px-6 py-4 border-b border-ink/15 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-ink text-pastel-blue flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-extrabold text-base sm:text-lg text-ink leading-tight">
                    Modul Rekonsiliasi Saldo Bank
                  </h3>
                  <p className="text-[11px] text-ink/70">
                    Sistem Tag & Penyesuaian Saldo Riil Bank Rekening Partner
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="p-1 rounded-full hover:bg-ink/10 text-ink transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-cream/80 border-b border-ink/15 px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setReconcileTab('input')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  reconcileTab === 'input'
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-surface hover:bg-cream text-ink/70 border border-ink/10'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ / - Penyesuaian</span>
              </button>
              <button
                type="button"
                onClick={() => setReconcileTab('koreksi')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  reconcileTab === 'koreksi'
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-surface hover:bg-cream text-ink/70 border border-ink/10'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Koreksi Saldo Riil</span>
              </button>
              <button
                type="button"
                onClick={() => setReconcileTab('report')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  reconcileTab === 'report'
                    ? 'bg-cobalt text-white shadow-sm'
                    : 'bg-surface hover:bg-cream text-ink/70 border border-ink/10'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Laporan Per Tag</span>
              </button>
              <button
                type="button"
                onClick={() => setReconcileTab('log')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  reconcileTab === 'log'
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-surface hover:bg-cream text-ink/70 border border-ink/10'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat ({balanceAdjustments.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* TAB 1: + / - Penyesuaian Manual dengan Sistem Tag */}
              {reconcileTab === 'input' && (
                <form onSubmit={handleSaveManualReconcile} className="space-y-4">
                  <p className="text-xs text-ink/70 leading-relaxed">
                    Catat penambahan (misal bunga tabungan, top-up modal) atau pengurangan saldo (misal biaya admin bank bulanan, pajak, bagi hasil) dengan <strong>Sistem Tag</strong> agar terlacak dalam laporan analitik.
                  </p>

                  {/* Toggle Tambah / Kurang */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReconcileType('addition')}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition ${
                        reconcileType === 'addition'
                          ? 'bg-profit-bg border-profit-accent text-profit-text shadow-sm'
                          : 'bg-cream/60 border-ink/10 text-ink/60 hover:bg-surface'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Saldo Bank</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReconcileType('deduction')}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition ${
                        reconcileType === 'deduction'
                          ? 'bg-loss-bg border-loss-accent text-loss-text shadow-sm'
                          : 'bg-cream/60 border-ink/10 text-ink/60 hover:bg-surface'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      <span>- Kurang Saldo Bank</span>
                    </button>
                  </div>

                  {/* Nominal & Tanggal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                        Nominal Penyesuaian (Rp) *
                      </label>
                      <input
                        type="number"
                        required
                        value={reconcileNominal}
                        onChange={(e) => setReconcileNominal(e.target.value)}
                        placeholder="Contoh: 25000"
                        className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-cobalt"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                        Tanggal Penyesuaian *
                      </label>
                      <CustomDatePicker
                        value={reconcileDate}
                        onChange={(d) => setReconcileDate(d)}
                      />
                    </div>
                  </div>

                  {/* Tag Selector & Non-editable historical chips */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-cobalt" />
                        <span>Sistem Tag Transaksi (Pilih / Buat Baru) *</span>
                      </label>
                      <span className="text-[11px] text-ink/50">Klik tag untuk memilih</span>
                    </div>

                    {/* Non-editable Historical Chips that can be clicked to reuse */}
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-cream/70 border border-ink/10 max-h-28 overflow-y-auto revelation-scroll">
                      {historicalTags.map((t) => {
                        const isSelected = reconcileTag.toLowerCase() === t.toLowerCase();
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setReconcileTag(t)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-cobalt text-white shadow-sm ring-2 ring-cobalt/30'
                                : 'bg-surface hover:bg-pastel-yellow text-ink border border-ink/15'
                            }`}
                          >
                            #{t}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Tag Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={reconcileTag}
                        onChange={(e) => setReconcileTag(e.target.value)}
                        placeholder="Ketik tag atau pilih chip di atas..."
                        className="flex-1 px-4 py-2 rounded-xl bg-cream/60 border border-ink/15 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cobalt"
                      />
                      <span className="text-[11px] text-ink/50 italic shrink-0">
                        Tag otomatis masuk ke riwayat
                      </span>
                    </div>
                  </div>

                  {/* Catatan / Keterangan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                      Catatan / Alasan Penyesuaian *
                    </label>
                    <input
                      type="text"
                      required
                      value={reconcileReason}
                      onChange={(e) => setReconcileReason(e.target.value)}
                      placeholder="Contoh: Bunga tabungan bulanan, biaya administrasi kartu, selisih kas, dll."
                      className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cobalt"
                    />
                  </div>

                  {/* Balance Impact Preview */}
                  <div className="p-3.5 rounded-2xl bg-cream/80 border border-ink/15 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-ink/60 block">Saldo Saat Ini</span>
                      <span className="font-extrabold text-sm text-ink">{formatRupiah(currentBankBalance)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase text-ink/60 block">Dampak</span>
                      <span
                        className={`font-extrabold text-sm ${
                          reconcileType === 'addition' ? 'text-profit-text' : 'text-loss-text'
                        }`}
                      >
                        {reconcileType === 'addition' ? '+' : '-'}
                        {formatRupiah(Number(reconcileNominal) || 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-ink/60 block">Estimasi Saldo Baru</span>
                      <span className="font-serif font-extrabold text-sm text-cobalt">
                        {formatRupiah(
                          currentBankBalance +
                            (reconcileType === 'addition'
                              ? Number(reconcileNominal) || 0
                              : -(Number(reconcileNominal) || 0))
                        )}
                      </span>
                    </div>
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
                      <span>Simpan Penyesuaian Saldo</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Koreksi Saldo Riil Bank (1 Baris: Saldo Bank Saat Ini) */}
              {reconcileTab === 'koreksi' && (
                <form onSubmit={handleSaveKoreksiReconcile} className="space-y-4">
                  <p className="text-xs text-ink/70 leading-relaxed">
                    Ketik langsung saldo akhir yang tertera di rekening / mutasi bank asli saat ini. Sistem akan secara otomatis menghitung selisih dan membuat penyesuaian yang seimbang.
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

                  {/* 1 Baris: Saldo Bank Saat ini */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1 whitespace-nowrap">
                      Saldo Bank Saat ini *
                    </label>
                    <input
                      type="number"
                      required
                      value={actualBankInput}
                      onChange={(e) => setActualBankInput(e.target.value)}
                      placeholder="Masukkan angka persis sesuai mutasi bank"
                      className="w-full px-4 py-2.5 rounded-xl bg-cream/60 border border-ink/15 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-cobalt"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                        Tanggal Penyesuaian *
                      </label>
                      <CustomDatePicker
                        value={reconcileDate}
                        onChange={(d) => setReconcileDate(d)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                        Tag Transaksi
                      </label>
                      <input
                        type="text"
                        value={reconcileTag}
                        onChange={(e) => setReconcileTag(e.target.value)}
                        placeholder="Koreksi Saldo"
                        className="w-full px-4 py-2 rounded-xl bg-cream/60 border border-ink/15 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cobalt"
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
                      placeholder="Contoh: Sinkronisasi saldo persis mutasi rekening bank BCA"
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
                      <span>Sesuaikan dengan Saldo Bank</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: Laporan Dampak Per Tag (Report Generator) */}
              {reconcileTab === 'report' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-cobalt flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-cobalt" />
                      <span>Laporan Dampak Mutasi Saldo Bank Per Tag</span>
                    </h4>
                    <span className="text-[11px] text-ink/60 bg-cream px-2.5 py-1 rounded-full border border-ink/10">
                      {tagReport.length} Tag Terdaftar
                    </span>
                  </div>

                  {/* Highlight 2 Bagian Utama: Top Pengurang & Top Penambah */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-loss-bg/70 border border-loss-accent">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-loss-text block">
                        🔻 Bagian yang Mengambil / Mengurangi Paling Banyak
                      </span>
                      {topDeductionTag ? (
                        <div className="mt-1.5">
                          <p className="font-serif font-extrabold text-base text-loss-text">
                            #{topDeductionTag.tag}
                          </p>
                          <p className="text-xs font-bold text-loss-text mt-0.5">
                            Total Pengurangan: -{formatRupiah(topDeductionTag.deductions)}
                          </p>
                          <span className="text-[11px] text-ink/60">
                            Dari {topDeductionTag.count} transaksi pencatatan
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-ink/50 mt-2">Belum ada catatan pengurangan saldo.</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-profit-bg/70 border border-profit-accent">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-profit-text block">
                        🔺 Bagian yang Menambahkan Paling Banyak
                      </span>
                      {topAdditionTag ? (
                        <div className="mt-1.5">
                          <p className="font-serif font-extrabold text-base text-profit-text">
                            #{topAdditionTag.tag}
                          </p>
                          <p className="text-xs font-bold text-profit-text mt-0.5">
                            Total Penambahan: +{formatRupiah(topAdditionTag.additions)}
                          </p>
                          <span className="text-[11px] text-ink/60">
                            Dari {topAdditionTag.count} transaksi pencatatan
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-ink/50 mt-2">Belum ada catatan penambahan saldo.</p>
                      )}
                    </div>
                  </div>

                  {/* Tabel Breakdown Lengkap Per Tag */}
                  <div className="border border-ink/15 rounded-2xl overflow-hidden bg-surface">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-cream/80 border-b border-ink/10 text-[10px] font-extrabold uppercase tracking-wider text-ink/70">
                          <th className="py-2.5 px-3">Nama Tag</th>
                          <th className="py-2.5 px-2 text-center">Tx</th>
                          <th className="py-2.5 px-2 text-right">Penambahan (+)</th>
                          <th className="py-2.5 px-2 text-right">Pengurangan (-)</th>
                          <th className="py-2.5 px-3 text-right">Dampak Bersih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10">
                        {tagReport.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-xs text-ink/50">
                              Belum ada data rekonsiliasi bertag.
                            </td>
                          </tr>
                        ) : (
                          tagReport.map((t) => (
                            <tr key={t.tag} className="hover:bg-cream/40 transition">
                              <td className="py-2.5 px-3 font-bold text-ink">
                                <span className="px-2 py-0.5 rounded-full bg-cream border border-ink/10 text-cobalt text-[11px]">
                                  #{t.tag}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center font-semibold text-ink/70">
                                {t.count}
                              </td>
                              <td className="py-2.5 px-2 text-right font-bold text-profit-text">
                                {t.additions > 0 ? `+${formatRupiah(t.additions)}` : '—'}
                              </td>
                              <td className="py-2.5 px-2 text-right font-bold text-loss-text">
                                {t.deductions > 0 ? `-${formatRupiah(t.deductions)}` : '—'}
                              </td>
                              <td
                                className={`py-2.5 px-3 text-right font-extrabold ${
                                  t.net >= 0 ? 'text-profit-text' : 'text-loss-text'
                                }`}
                              >
                                {formatRupiah(t.net, true)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Riwayat Log Audit Penyesuaian Saldo */}
              {reconcileTab === 'log' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-cobalt flex items-center gap-2">
                      <History className="w-4 h-4 text-cobalt" />
                      <span>Log Audit Penyesuaian & Rekonsiliasi Bank</span>
                    </h4>
                    <span className="text-[11px] text-ink/60">
                      Total {balanceAdjustments.length} catatan
                    </span>
                  </div>

                  {balanceAdjustments.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-cream/40 border border-ink/10 text-center text-xs text-ink/50">
                      Belum ada riwayat penyesuaian saldo.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 revelation-scroll">
                      {balanceAdjustments.map((adj) => {
                        const isPositive = adj.difference_amount >= 0;
                        return (
                          <div
                            key={adj.id}
                            className="p-3 rounded-xl bg-cream/50 border border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="space-y-1">
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
                                  {formatRupiah(adj.difference_amount, true)}
                                </span>
                                {adj.tag && (
                                  <span className="px-2 py-0.5 rounded-full bg-pastel-yellow border border-ink/15 text-ink text-[10px] font-bold">
                                    #{adj.tag}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[11px] text-ink/65 bg-surface px-2 py-0.5 rounded-full border border-ink/10">
                                  <UserCheck className="w-3 h-3 text-cobalt" />
                                  <span>Oleh: {getUserDisplayName(adj.created_by)}</span>
                                </span>
                              </div>
                              <p className="text-ink/80 font-medium">
                                Alasan: <strong>"{adj.reason}"</strong>
                              </p>
                              <p className="text-[11px] text-ink/60">
                                Sebelum: {formatRupiah(adj.system_balance_before)} → Saldo Riil:{' '}
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

            {/* Modal Footer */}
            <div className="p-4 bg-cream/60 border-t border-ink/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="px-5 py-2 rounded-full bg-ink text-white text-xs font-bold hover:bg-cobalt transition"
              >
                Tutup Modul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Rincian Analisa Performa Harian */}
      {selectedTrendData && (
        <div className="fixed inset-0 !m-0 z-[100] bg-ink/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface rounded-3xl border-2 border-ink shadow-editorial max-w-xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-pastel-yellow px-6 py-4 border-b border-ink/15 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink/60 block">
                  Rincian Laporan Harian • {selectedBiz?.name}
                </span>
                <h3 className="font-serif font-extrabold text-lg text-ink">
                  📅 {formatFullIndoDate(selectedTrendData.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrendDate(null)}
                className="p-1 rounded-full hover:bg-ink/10 text-ink transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Insight Card */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  selectedTrendData.isProfit
                    ? 'bg-profit-bg/70 border-profit-accent text-profit-text'
                    : 'bg-loss-bg/70 border-loss-accent text-loss-text'
                }`}
              >
                <p className="font-extrabold text-xs uppercase tracking-wider mb-1">
                  💡 Analisa Penyebab {selectedTrendData.isProfit ? 'Laba' : 'Rugi'}:
                </p>
                <p className="font-medium text-ink/80">{selectedTrendData.insight}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-cream/70 border border-ink/10">
                  <span className="text-[10px] text-ink/60 block font-bold">Omzet</span>
                  <span className="font-extrabold text-ink">{formatRupiah(selectedTrendData.revenue)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-cream/70 border border-ink/10">
                  <span className="text-[10px] text-ink/60 block font-bold">HPP</span>
                  <span className="font-extrabold text-ink">{formatRupiah(selectedTrendData.hpp)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-cream/70 border border-ink/10">
                  <span className="text-[10px] text-ink/60 block font-bold">Operasional</span>
                  <span className="font-extrabold text-loss-text">{formatRupiah(selectedTrendData.ops)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-cream/70 border border-ink/10">
                  <span className="text-[10px] text-ink/60 block font-bold">Laba Bersih</span>
                  <span
                    className={`font-extrabold ${
                      selectedTrendData.isProfit ? 'text-profit-text' : 'text-loss-text'
                    }`}
                  >
                    {formatRupiah(selectedTrendData.netProfit, true)}
                  </span>
                </div>
              </div>

              {/* Sales List on that day */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-cobalt" />
                  <span>Daftar Penjualan ({selectedTrendData.sales.length} transaksi)</span>
                </h4>
                {selectedTrendData.sales.length === 0 ? (
                  <p className="text-xs text-ink/50 italic bg-cream/40 p-2.5 rounded-xl">
                    Tidak ada penjualan pada hari ini.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1 revelation-scroll">
                    {selectedTrendData.sales.map((tx) => {
                      const prod = db.products.find((p) => p.id === tx.product_id);
                      const total = Number(tx.qty) * Number(tx.selling_price_snapshot);
                      return (
                        <div
                          key={tx.id}
                          className="p-2.5 rounded-xl bg-cream/40 border border-ink/10 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-ink">
                              {prod?.name || 'Produk'}
                            </span>
                            <span className="text-[11px] text-ink/60 ml-2">
                              {tx.qty} pcs × {formatRupiah(tx.selling_price_snapshot)}
                            </span>
                          </div>
                          <span className="font-extrabold text-ink">{formatRupiah(total)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expenses List on that day */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-loss-text" />
                  <span>Daftar Pengeluaran Operasional ({selectedTrendData.expenses.length})</span>
                </h4>
                {selectedTrendData.expenses.length === 0 ? (
                  <p className="text-xs text-ink/50 italic bg-cream/40 p-2.5 rounded-xl">
                    Tidak ada beban operasional pada hari ini.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1 revelation-scroll">
                    {selectedTrendData.expenses.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-2.5 rounded-xl bg-cream/40 border border-ink/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-ink">{ex.expense_name}</span>
                          <span className="text-[10px] bg-surface px-2 py-0.5 rounded-full border border-ink/10 text-ink/60 ml-2">
                            {ex.category}
                          </span>
                        </div>
                        <span className="font-extrabold text-loss-text">
                          -{formatRupiah(ex.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-cream/60 border-t border-ink/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTrendDate(null)}
                className="px-5 py-2 rounded-full bg-ink text-white text-xs font-bold hover:bg-cobalt transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
