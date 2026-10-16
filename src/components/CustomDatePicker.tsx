import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { formatFullIndoDate, getTodayDateString } from '../utils/calculations';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  maxDate?: string;
}

const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INDO_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  maxDate = getTodayDateString(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseYmd = (str: string) => {
    const [y, m, d] = str.split('-').map(Number);
    const now = new Date();
    return {
      year: y || now.getFullYear(),
      month: (m || now.getMonth() + 1) - 1, // 0-indexed
      day: d || now.getDate(),
    };
  };

  const initial = parseYmd(value || getTodayDateString());
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  useEffect(() => {
    const parsed = parseYmd(value);
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const buildDateStr = (year: number, monthZeroIdx: number, day: number) => {
    const m = String(monthZeroIdx + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const isAfterMax = (dateStr: string) => {
    if (!maxDate) return false;
    return dateStr > maxDate;
  };

  const setRelativeDaysAgo = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const ymd = buildDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(ymd);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-cream hover:bg-surface border border-ink/20 text-xs sm:text-sm font-extrabold text-ink flex items-center justify-between gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-cobalt transition"
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-cobalt shrink-0" />
          <span className="truncate">{formatFullIndoDate(value)}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-ink/60 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-cobalt' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-[95] mt-2 w-72 sm:w-80 bg-surface rounded-2xl border-2 border-ink shadow-card overflow-hidden">
          {/* Pastel Editorial Header */}
          <div className="bg-pastel-yellow px-4 py-3 border-b border-ink/15 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-full bg-surface border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-serif font-extrabold text-sm sm:text-base text-ink">
              {INDO_MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-full bg-surface border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 bg-cream/40">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
              {INDO_DAYS_SHORT.map((dayName) => (
                <span
                  key={dayName}
                  className="text-[10px] font-extrabold uppercase text-ink/55 py-1"
                >
                  {dayName}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = buildDateStr(viewYear, viewMonth, dayNum);
                const isSelected = dateStr === value;
                const isToday = dateStr === getTodayDateString();
                const disabled = isAfterMax(dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(dateStr);
                      setIsOpen(false);
                    }}
                    className={`h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${
                      disabled
                        ? 'text-ink/25 cursor-not-allowed'
                        : isSelected
                        ? 'bg-cobalt text-white font-extrabold shadow-sm ring-2 ring-ink/15'
                        : isToday
                        ? 'bg-pastel-yellow text-ink font-extrabold border border-ink/20'
                        : 'text-ink hover:bg-pastel-lavender/60'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Quick Shortcuts */}
            <div className="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => setRelativeDaysAgo(0)}
                className="flex-1 py-1.5 rounded-full bg-ink hover:bg-cobalt text-white text-[11px] font-bold transition"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setRelativeDaysAgo(1)}
                className="flex-1 py-1.5 rounded-full bg-surface hover:bg-pastel-lavender/60 border border-ink/15 text-ink text-[11px] font-bold transition"
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={() => setRelativeDaysAgo(2)}
                className="flex-1 py-1.5 rounded-full bg-surface hover:bg-pastel-lavender/60 border border-ink/15 text-ink text-[11px] font-bold transition"
              >
                2 Hari Lalu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
