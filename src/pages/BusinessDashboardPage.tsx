import React, { useState, useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Flame,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DateRangeFilter } from '../types';
import {
  calculateFinancialSummary,
  formatIndoDate,
  formatRupiah,
  formatShortRupiah,
  getTodayDateString,
  isDateWithinRange,
} from '../utils/calculations';
import { ProfitLossBadge, WavyCoralUnderline } from '../components/Doodles';
import { DashboardDateFilterBar } from '../components/DashboardDateFilterBar';

export const BusinessDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { db, currentUser, canManageBusinessAndProducts } = useApp();
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayDateString());
  const [isCustomRangeMode, setIsCustomRangeMode] = useState<boolean>(false);

  // Member only accesses /transactions
  if (currentUser?.role === 'member') {
    return <Navigate to="/transactions" replace />;
  }

  const business = db.businesses.find((b) => b.id === id);

  const bizSales = useMemo(
    () =>
      db.sales_transactions.filter(
        (tx) =>
          tx.business_id === id &&
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
      id,
      dateRange,
      customStartDate,
      customEndDate,
      isCustomRangeMode,
    ]
  );

  const bizExpenses = useMemo(
    () =>
      db.operational_expenses.filter(
        (ex) =>
          ex.business_id === id &&
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
      id,
      dateRange,
      customStartDate,
      customEndDate,
      isCustomRangeMode,
    ]
  );

  const summary = useMemo(
    () => calculateFinancialSummary(bizSales, bizExpenses),
    [bizSales, bizExpenses]
  );

  const dailyTrend = useMemo(() => {
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

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [bizSales, bizExpenses]);

  const productLeaderboard = useMemo(() => {
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
      cur.grossProfit += rev - hpp;
      prodMap.set(tx.product_id, cur);
    });

    return Array.from(prodMap.values()).sort((a, b) => b.grossProfit - a.grossProfit);
  }, [bizSales, db.products]);

  if (!business) {
    return <Navigate to="/404" replace />;
  }

  const isProfit = summary.profit_status === 'PROFIT';
  const maxTrendVal = Math.max(
    ...dailyTrend.map((d) => Math.max(d.revenue, Math.abs(d.net))),
    1
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-cobalt transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Global Dashboard</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canManageBusinessAndProducts && (
            <Link
              to={`/business/${business.id}/products`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface border border-ink/15 hover:border-cobalt text-xs font-bold text-ink transition shadow-sm"
            >
              <Package className="w-3.5 h-3.5 text-cobalt" />
              <span>Kalkulator Produk & HPP ↗</span>
            </Link>
          )}
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink hover:bg-cobalt text-white text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Input Transaksi Bisnis Ini ↗</span>
          </Link>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-ink/10 shadow-editorial">
        <div
          className="px-6 py-4 rounded-t-2xl border-b border-ink/10 flex flex-wrap items-center justify-between gap-3"
          style={{ backgroundColor: business.card_accent_color || '#DDD6FE' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-ink/15 flex items-center justify-center font-serif font-extrabold text-xl text-cobalt shadow-sm overflow-hidden">
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
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink/70">
                DASHBOARD SPESIFIK UNIT BISNIS
              </span>
              <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
                {business.name}
              </h1>
            </div>
          </div>

          <ProfitLossBadge status={summary.profit_status} size="lg" />
        </div>

        <div className="p-5 sm:px-6 rounded-b-2xl flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-surface">
          <p className="text-sm text-ink/75 max-w-2xl">{business.description}</p>

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
            variant="cream"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-ink/10 p-5 shadow-editorial">
          <span className="text-xs font-extrabold uppercase tracking-wider text-ink/60">
            1. Omzet Penjualan
          </span>
          <p className="font-serif font-extrabold text-2xl text-ink mt-2">
            <span className="yellow-highlight">{formatRupiah(summary.gross_revenue)}</span>
          </p>
          <p className="text-xs text-ink/60 mt-2">
            {summary.qty_sold} produk terjual ({summary.sales_count} input)
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-ink/10 p-5 shadow-editorial">
          <span className="text-xs font-extrabold uppercase tracking-wider text-ink/60">
            2. Total HPP Terpakai
          </span>
          <p className="font-serif font-extrabold text-2xl text-ink mt-2">
            {formatRupiah(summary.total_hpp_cost)}
          </p>
          <p className="text-xs text-ink/60 mt-2">
            Laba Kotor: <strong>{formatRupiah(summary.gross_profit)}</strong>
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-ink/10 p-5 shadow-editorial">
          <span className="text-xs font-extrabold uppercase tracking-wider text-ink/60">
            3. Biaya Operasional
          </span>
          <p className="font-serif font-extrabold text-2xl text-ink mt-2">
            {formatRupiah(summary.total_operational_expense)}
          </p>
          <p className="text-xs text-ink/60 mt-2">
            {bizExpenses.length} catatan pengeluaran non-HPP
          </p>
        </div>

        <div
          className={`rounded-2xl border-2 p-5 shadow-editorial ${
            isProfit
              ? 'bg-profit-bg/60 border-profit-accent'
              : 'bg-loss-bg/60 border-loss-accent'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-extrabold uppercase tracking-wider ${
                isProfit ? 'text-profit-text' : 'text-loss-text'
              }`}
            >
              4. Laba / Rugi Bersih
            </span>
            {isProfit ? (
              <TrendingUp className="w-4 h-4 text-profit-text" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss-text" />
            )}
          </div>
          <p
            className={`font-serif font-extrabold text-2xl mt-2 ${
              isProfit ? 'text-profit-text' : 'text-loss-text'
            }`}
          >
            {formatRupiah(summary.net_profit_or_loss, true)}
          </p>
          <p className="text-xs font-bold text-ink/80 mt-2">
            Net Margin: {summary.profit_margin_percent.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-surface rounded-2xl border border-ink/10 shadow-editorial p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif font-bold text-xl text-cobalt flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Tren Pendapatan vs Laba/Rugi</span>
            </h2>
            <span className="font-hand text-base text-ink/70">Per Tanggal Transaksi</span>
          </div>
          <div className="w-28 mb-5">
            <WavyCoralUnderline />
          </div>

          {dailyTrend.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink/60 bg-cream/50 rounded-xl border border-dashed border-ink/15">
              Belum ada transaksi pada rentang waktu ini.
            </div>
          ) : (
            <div className="space-y-4">
              {dailyTrend.map((day) => {
                const revWidth = Math.max(
                  Math.round((day.revenue / maxTrendVal) * 100),
                  4
                );
                const netWidth = Math.max(
                  Math.round((Math.abs(day.net) / maxTrendVal) * 100),
                  4
                );
                const dayProfit = day.net >= 0;

                return (
                  <div
                    key={day.date}
                    className="p-3.5 rounded-xl bg-cream/60 border border-ink/10 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-ink">
                        📅 {formatIndoDate(day.date)}
                      </span>
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded-full text-[11px] ${
                          dayProfit
                            ? 'bg-profit-bg text-profit-text'
                            : 'bg-loss-bg text-loss-text'
                        }`}
                      >
                        Net: {formatRupiah(day.net, true)}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 items-center gap-2 text-[11px]">
                      <span className="col-span-3 text-ink/70 font-semibold">Omzet</span>
                      <div className="col-span-6 h-2.5 bg-surface rounded-full overflow-hidden border border-ink/10">
                        <div
                          className="h-full bg-cobalt rounded-full"
                          style={{ width: `${revWidth}%` }}
                        />
                      </div>
                      <span className="col-span-3 text-right font-bold">
                        {formatShortRupiah(day.revenue)}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 items-center gap-2 text-[11px]">
                      <span className="col-span-3 text-ink/70 font-semibold">
                        {dayProfit ? 'Untung' : 'Rugi'}
                      </span>
                      <div className="col-span-6 h-2.5 bg-surface rounded-full overflow-hidden border border-ink/10">
                        <div
                          className={`h-full rounded-full ${
                            dayProfit ? 'bg-profit-accent' : 'bg-loss-accent'
                          }`}
                          style={{ width: `${netWidth}%` }}
                        />
                      </div>
                      <span
                        className={`col-span-3 text-right font-bold ${
                          dayProfit ? 'text-profit-text' : 'text-loss-text'
                        }`}
                      >
                        {formatShortRupiah(day.net)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-surface rounded-2xl border border-ink/10 shadow-editorial p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif font-bold text-xl text-cobalt flex items-center gap-2">
              <Flame className="w-5 h-5 text-pastel-coral" />
              <span>Produk Terlaris & Kontributor Laba</span>
            </h2>
            <span className="font-hand text-base text-ink/70">Top Profit Contributors</span>
          </div>
          <div className="w-28 mb-5">
            <WavyCoralUnderline />
          </div>

          {productLeaderboard.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink/60 bg-cream/50 rounded-xl border border-dashed border-ink/15">
              Belum ada penjualan produk tercatat pada periode ini.
            </div>
          ) : (
            (() => {
              const totalPositiveGrossProfit = productLeaderboard.reduce(
                (sum, item) => sum + Math.max(0, item.grossProfit),
                0
              );
              const totalRevAll = productLeaderboard.reduce(
                (sum, item) => sum + Math.max(0, item.totalRevenue),
                0
              );

              const ringColors = ['#1A45E5', '#F25C54', '#16A34A', '#9333EA', '#EA580C', '#0891B2'];

              // Build conic-gradient stops for the overall circular donut chart
              let cumulativePct = 0;
              const gradientStops = productLeaderboard
                .map((item, idx) => {
                  const pct =
                    totalPositiveGrossProfit > 0
                      ? (Math.max(0, item.grossProfit) / totalPositiveGrossProfit) * 100
                      : totalRevAll > 0
                      ? (Math.max(0, item.totalRevenue) / totalRevAll) * 100
                      : 0;
                  const start = cumulativePct;
                  cumulativePct += pct;
                  const color = ringColors[idx % ringColors.length];
                  return `${color} ${start.toFixed(2)}% ${cumulativePct.toFixed(2)}%`;
                })
                .join(', ');

              const topContributor = productLeaderboard[0];
              const topPct =
                totalPositiveGrossProfit > 0 && topContributor
                  ? (Math.max(0, topContributor.grossProfit) / totalPositiveGrossProfit) * 100
                  : 0;

              return (
                <div className="space-y-4">
                  {/* Overall Circular Donut Chart Summary */}
                  <div className="p-4 rounded-2xl bg-cream/70 border border-ink/10 flex flex-col sm:flex-row items-center gap-4">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center shrink-0 border-2 border-ink shadow-sm relative"
                      style={{
                        background:
                          cumulativePct > 0
                            ? `conic-gradient(${gradientStops})`
                            : '#E5E7EB',
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-surface border border-ink/15 flex flex-col items-center justify-center text-center px-1">
                        <span className="text-[9px] font-extrabold uppercase text-ink/55 leading-none">
                          TOP #1
                        </span>
                        <span className="font-serif font-extrabold text-xs text-cobalt leading-tight mt-0.5">
                          {topPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold uppercase tracking-wider text-ink/60 text-[10px]">
                          Distribusi Kontribusi Laba ({productLeaderboard.length} Produk Terjual)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                        {productLeaderboard.map((item, idx) => {
                          const pct =
                            totalPositiveGrossProfit > 0
                              ? (Math.max(0, item.grossProfit) / totalPositiveGrossProfit) * 100
                              : totalRevAll > 0
                              ? (Math.max(0, item.totalRevenue) / totalRevAll) * 100
                              : 0;
                          const dotColor = ringColors[idx % ringColors.length];
                          return (
                            <div
                              key={`legend-${item.productId}`}
                              className="flex items-center justify-between gap-1.5 text-[11px]"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-ink/20"
                                  style={{ backgroundColor: dotColor }}
                                />
                                <span
                                  className={`truncate ${
                                    idx < 3 ? 'font-extrabold text-ink' : 'font-medium text-ink/70'
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </span>
                              <span className="font-extrabold text-ink shrink-0">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* All Sold Products List — Top 3 Highlighted + Circular Percentage Ring per item */}
                  <div className="space-y-3">
                    {productLeaderboard.map((item, idx) => {
                      const sharePct =
                        totalPositiveGrossProfit > 0
                          ? (Math.max(0, item.grossProfit) / totalPositiveGrossProfit) * 100
                          : totalRevAll > 0
                          ? (Math.max(0, item.totalRevenue) / totalRevAll) * 100
                          : 0;

                      const isTop3 = idx < 3;
                      const radius = 19;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset =
                        circumference - (Math.min(100, Math.max(0, sharePct)) / 100) * circumference;
                      const strokeColor = ringColors[idx % ringColors.length];

                      const cardHighlightClass =
                        idx === 0
                          ? 'bg-pastel-yellow/35 border-2 border-ink shadow-[3px_3px_0px_#111827]'
                          : idx === 1
                          ? 'bg-pastel-lavender/45 border-2 border-cobalt/40 shadow-sm'
                          : idx === 2
                          ? 'bg-pastel-blue/45 border-2 border-cobalt/30 shadow-sm'
                          : 'bg-cream/50 border border-ink/10';

                      return (
                        <div
                          key={item.productId}
                          className={`p-4 rounded-xl flex items-center justify-between gap-3 transition ${cardHighlightClass}`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Circular Percentage Ring Indicator */}
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 46 46">
                                <circle
                                  cx="23"
                                  cy="23"
                                  r={radius}
                                  fill="#FFFFFF"
                                  stroke="rgba(17,24,39,0.12)"
                                  strokeWidth="4.5"
                                />
                                <circle
                                  cx="23"
                                  cy="23"
                                  r={radius}
                                  fill="transparent"
                                  stroke={strokeColor}
                                  strokeWidth="4.5"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                <span className="font-serif font-extrabold text-[11px] text-ink">
                                  {Math.round(sharePct)}%
                                </span>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                    idx === 0
                                      ? 'bg-pastel-yellow text-ink border-ink'
                                      : idx === 1
                                      ? 'bg-pastel-lavender text-ink border-ink/25'
                                      : idx === 2
                                      ? 'bg-pastel-blue text-cobalt border-cobalt/30'
                                      : 'bg-surface text-ink/65 border-ink/15'
                                  }`}
                                >
                                  {isTop3 ? `★ TOP #${idx + 1}` : `#${idx + 1}`}
                                </span>
                                <p className="font-bold text-sm text-ink truncate">
                                  {item.name}
                                </p>
                              </div>
                              <p className="text-xs text-ink/65 mt-1">
                                Terjual: <strong>{item.qtySold} pcs</strong> • Omzet:{' '}
                                {formatRupiah(item.totalRevenue)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-extrabold uppercase text-profit-text bg-profit-bg border border-profit-accent px-2 py-0.5 rounded-full whitespace-nowrap">
                              {sharePct.toFixed(1)}% Kontribusi Laba
                            </span>
                            <p className="font-serif font-extrabold text-base text-profit-text mt-1 whitespace-nowrap">
                              +{formatRupiah(item.grossProfit)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};
