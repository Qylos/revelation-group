import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRangeFilter } from '../types';
import {
  DATE_RANGE_OPTIONS,
  formatIndoDate,
  getTodayDateString,
} from '../utils/calculations';

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

interface DashboardDateFilterBarProps {
  dateRange: DateRangeFilter;
  onSelectPreset: (preset: DateRangeFilter) => void;
  customStartDate: string;
  customEndDate: string;
  isRangeMode: boolean;
  onChangeCustomDates: (start: string, end: string, rangeMode: boolean) => void;
  variant?: 'surface' | 'cream';
}

export const DashboardDateFilterBar: React.FC<DashboardDateFilterBarProps> = ({
  dateRange,
  onSelectPreset,
  customStartDate,
  customEndDate,
  isRangeMode,
  onChangeCustomDates,
  variant = 'surface',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingStep, setSelectingStep] = useState<'start' | 'end'>('start');
  const containerRef = useRef<HTMLDivElement>(null);

  const parseYmd = (str: string) => {
    const [y, m, d] = (str || getTodayDateString()).split('-').map(Number);
    const now = new Date();
    return {
      year: y || now.getFullYear(),
      month: (m || now.getMonth() + 1) - 1,
      day: d || now.getDate(),
    };
  };

  const initial = parseYmd(customStartDate || getTodayDateString());
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

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

  const buildDateStr = (year: number, monthZeroIdx: number, day: number) => {
    const m = String(monthZeroIdx + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

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

  const handleDayClick = (dateStr: string) => {
    if (!isRangeMode) {
      onChangeCustomDates(dateStr, dateStr, false);
      onSelectPreset('custom');
      setIsOpen(false);
      return;
    }

    if (selectingStep === 'start') {
      onChangeCustomDates(dateStr, dateStr, true);
      onSelectPreset('custom');
      setSelectingStep('end');
    } else {
      if (dateStr < customStartDate) {
        onChangeCustomDates(dateStr, customStartDate, true);
      } else {
        onChangeCustomDates(customStartDate, dateStr, true);
      }
      onSelectPreset('custom');
      setSelectingStep('start');
      setIsOpen(false);
    }
  };

  const handleToggleRangeMode = () => {
    const nextMode = !isRangeMode;
    setSelectingStep('start');
    onChangeCustomDates(
      customStartDate || getTodayDateString(),
      nextMode ? customEndDate || customStartDate || getTodayDateString() : customStartDate || getTodayDateString(),
      nextMode
    );
    onSelectPreset('custom');
  };

  const isCustomActive = dateRange === 'custom';

  const getCustomButtonLabel = () => {
    if (!isCustomActive) return 'Pilih Tanggal';
    if (!isRangeMode || customStartDate === customEndDate) {
      return formatIndoDate(customStartDate);
    }
    return `${formatIndoDate(customStartDate)} – ${formatIndoDate(customEndDate)}`;
  };

  const minRangeDate =
    customStartDate <= customEndDate ? customStartDate : customEndDate;
  const maxRangeDate =
    customStartDate <= customEndDate ? customEndDate : customStartDate;

  return (
    <div ref={containerRef} className="relative shrink-0 max-w-full">
      <div
        className={`flex items-center flex-nowrap gap-1 p-1.5 rounded-2xl border border-ink/10 shadow-sm overflow-x-auto no-scrollbar ${
          variant === 'surface' ? 'bg-surface' : 'bg-cream'
        }`}
      >
        {/* Interactive Pilih Tanggal Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen && dateRange !== 'custom') {
              onSelectPreset('custom');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            isCustomActive
              ? 'bg-cobalt text-white shadow-sm'
              : 'bg-pastel-yellow/70 hover:bg-pastel-yellow text-ink border border-ink/15'
          }`}
        >
          <Calendar
            className={`w-3.5 h-3.5 shrink-0 ${
              isCustomActive ? 'text-pastel-yellow' : 'text-cobalt'
            }`}
          />
          <span>{getCustomButtonLabel()}</span>
        </button>

        {/* Single-Line Preset Buttons */}
        {DATE_RANGE_OPTIONS.map((opt) => {
          const active = dateRange === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelectPreset(opt.value);
                setIsOpen(false);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                active
                  ? 'bg-ink text-white shadow-sm'
                  : variant === 'surface'
                  ? 'text-ink/70 hover:bg-cream hover:text-ink'
                  : 'text-ink/70 hover:bg-surface hover:text-ink'
              }`}
            >
              {opt.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Custom Date / Range Picker Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 z-[95] mt-2 w-72 sm:w-80 bg-surface rounded-2xl border-2 border-ink shadow-card overflow-hidden">
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

          <div className="p-3.5 bg-cream/40 space-y-3">
            {/* Helper Status Banner */}
            <div className="px-3 py-1.5 rounded-xl bg-surface border border-ink/10 text-[11px] font-bold text-ink/80 flex items-center justify-between">
              {!isRangeMode ? (
                <>
                  <span>Tanggal Dipilih:</span>
                  <span className="text-cobalt font-extrabold">
                    {formatIndoDate(customStartDate)}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {selectingStep === 'start'
                      ? '1. Pilih Tgl Mulai:'
                      : '2. Pilih Tgl Selesai:'}
                  </span>
                  <span className="text-cobalt font-extrabold">
                    {formatIndoDate(minRangeDate)} – {formatIndoDate(maxRangeDate)}
                  </span>
                </>
              )}
            </div>

            {/* Weekday Headers */}
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                {INDO_DAYS_SHORT.map((dayName) => (
                  <span
                    key={dayName}
                    className="text-[10px] font-extrabold uppercase text-ink/55 py-1"
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-8" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = buildDateStr(viewYear, viewMonth, dayNum);
                  const isStartOrEnd =
                    !isRangeMode
                      ? dateStr === customStartDate
                      : dateStr === minRangeDate || dateStr === maxRangeDate;
                  const isBetween =
                    isRangeMode &&
                    dateStr > minRangeDate &&
                    dateStr < maxRangeDate;
                  const isToday = dateStr === getTodayDateString();

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleDayClick(dateStr)}
                      className={`h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${
                        isStartOrEnd
                          ? 'bg-cobalt text-white font-extrabold shadow-sm ring-2 ring-ink/15'
                          : isBetween
                          ? 'bg-pastel-blue text-cobalt font-extrabold'
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
            </div>

            {/* Bottom Toggle Switch: Rentang Tanggal ON / OFF */}
            <div className="pt-2.5 border-t border-ink/15 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold text-ink block">
                  Rentang Tanggal
                </span>
                <span className="text-[10px] text-ink/60 font-semibold block">
                  {isRangeMode
                    ? 'ON: Pilih 2 tanggal (Mulai & Selesai)'
                    : 'OFF: Statistik 1 tanggal spesifik'}
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isRangeMode}
                onClick={handleToggleRangeMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-ink transition-colors duration-200 ease-in-out ${
                  isRangeMode ? 'bg-cobalt' : 'bg-ink/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface border border-ink shadow transition duration-200 ease-in-out mt-0.5 ${
                    isRangeMode ? 'translate-x-5 bg-pastel-yellow' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
