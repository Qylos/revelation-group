import {
  DateRangeFilter,
  FinancialSummary,
  OperationalExpense,
  SalesTransaction,
} from '../types';

export const DATE_RANGE_OPTIONS: {
  value: Exclude<DateRangeFilter, 'custom'>;
  label: string;
  shortLabel: string;
}[] = [
  { value: '7d', label: '7 Hari Terakhir', shortLabel: '7 Hari' },
  { value: '15d', label: '15 Hari Terakhir', shortLabel: '15 Hari' },
  { value: '30d', label: '30 Hari Terakhir', shortLabel: '30 Hari' },
  { value: '60d', label: '60 Hari Terakhir', shortLabel: '60 Hari' },
  { value: '90d', label: '90 Hari Terakhir', shortLabel: '90 Hari' },
  { value: '1y', label: '1 Tahun Terakhir', shortLabel: '1 Tahun' },
  { value: 'all_time', label: 'Semua Waktu (All Time)', shortLabel: 'All Time' },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateWithinRange(
  transactionDateStr: string,
  range: DateRangeFilter,
  customStartDate?: string,
  customEndDate?: string,
  isCustomRangeMode = false
): boolean {
  if (range === 'all_time') return true;
  if (!transactionDateStr) return false;

  if (range === 'custom') {
    const start = customStartDate || getTodayDateString();
    if (!isCustomRangeMode) {
      return transactionDateStr === start;
    }
    const end = customEndDate || start;
    const minDate = start <= end ? start : end;
    const maxDate = start <= end ? end : start;
    return transactionDateStr >= minDate && transactionDateStr <= maxDate;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const daysMap: Record<Exclude<DateRangeFilter, 'all_time' | 'custom'>, number> = {
    '7d': 7,
    '15d': 15,
    '30d': 30,
    '60d': 60,
    '90d': 90,
    '1y': 365,
  };

  const days = daysMap[range];
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const [y, m, d] = transactionDateStr.split('-').map(Number);
  if (!y || !m || !d) return false;
  const txDate = new Date(y, m - 1, d, 12, 0, 0);

  return txDate >= cutoff && txDate <= today;
}

export function calculateFinancialSummary(
  sales: SalesTransaction[],
  expenses: OperationalExpense[]
): FinancialSummary {
  const gross_revenue = sales.reduce(
    (sum, tx) => sum + Number(tx.qty) * Number(tx.selling_price_snapshot),
    0
  );
  const total_hpp_cost = sales.reduce(
    (sum, tx) => sum + Number(tx.qty) * Number(tx.hpp_snapshot),
    0
  );
  const gross_profit = gross_revenue - total_hpp_cost;
  const total_operational_expense = expenses.reduce(
    (sum, ex) => sum + Number(ex.amount),
    0
  );
  const total_expenses = total_hpp_cost + total_operational_expense;
  const net_profit_or_loss = gross_profit - total_operational_expense;
  const profit_status: 'PROFIT' | 'LOSS' = net_profit_or_loss >= 0 ? 'PROFIT' : 'LOSS';
  const profit_margin_percent =
    gross_revenue > 0 ? (net_profit_or_loss / gross_revenue) * 100 : 0;
  const qty_sold = sales.reduce((sum, tx) => sum + Number(tx.qty), 0);

  return {
    gross_revenue,
    total_hpp_cost,
    gross_profit,
    total_operational_expense,
    total_expenses,
    net_profit_or_loss,
    profit_status,
    profit_margin_percent,
    sales_count: sales.length,
    qty_sold,
  };
}

export function formatRupiah(amount: number, showPlusSign = false): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID').format(absVal);
  if (isNegative) return `-Rp ${formatted}`;
  if (showPlusSign && amount > 0) return `+Rp ${formatted}`;
  return `Rp ${formatted}`;
}

export function formatShortRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`;
  }
  return `${sign}Rp ${abs}`;
}

export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats date as full Indonesian day & month, e.g. "Jumat, 16 Oktober 2026"
 */
export function formatFullIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Automatic SKU Generator combining:
 * 1. Business Name Code (e.g. "Revelation Roastery & Coffee" -> "RRC")
 * 2. Product Sequence Number in that Business (e.g. 1 -> "001")
 * 3. Product Name Code (e.g. "Iced Kopi Susu Revelation" -> "IKSR")
 * Result example: "RRC-001-IKSR"
 */
export function generateProductSku(
  businessName: string,
  sequenceNumber: number,
  productName: string
): string {
  const cleanWords = (text: string): string[] =>
    text
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const bizWords = cleanWords(businessName);
  let bizPrefix = bizWords.map((w) => w[0]).join('').slice(0, 4);
  if (bizPrefix.length < 2) {
    bizPrefix = (bizWords[0] || 'REV').slice(0, 3);
  }

  const seqPart = String(Math.max(1, sequenceNumber)).padStart(3, '0');

  const prodWords = cleanWords(productName);
  let prodCode = '';
  if (prodWords.length >= 2) {
    prodCode = prodWords.map((w) => w[0]).join('').slice(0, 5);
  } else if (prodWords.length === 1) {
    prodCode = prodWords[0].slice(0, 4);
  } else {
    prodCode = 'PRD';
  }

  return `${bizPrefix}-${seqPart}-${prodCode}`;
}

export function compressImageFile(file: File, maxSizePx = 160, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSizePx) {
            height = Math.round((height * maxSizePx) / width);
            width = maxSizePx;
          }
        } else {
          if (height > maxSizePx) {
            width = Math.round((width * maxSizePx) / height);
            height = maxSizePx;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(event.target?.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = String(event.target?.result || '');
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
