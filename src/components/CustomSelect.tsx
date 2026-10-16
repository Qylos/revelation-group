import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  accentColor?: string;
  logoUrl?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  size = 'md',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeStyles =
    size === 'sm'
      ? 'px-3.5 py-1.5 text-xs rounded-full'
      : size === 'lg'
      ? 'px-4 py-3 text-sm sm:text-base rounded-xl'
      : 'px-4 py-2.5 text-xs sm:text-sm rounded-xl';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 font-bold transition border focus:outline-none focus:ring-2 focus:ring-cobalt ${sizeStyles} ${
          buttonClassName ||
          'bg-cream/80 hover:bg-surface text-ink border-ink/20 shadow-sm'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.logoUrl ? (
            <img
              src={selectedOption.logoUrl}
              alt=""
              className="w-4 h-4 rounded-full object-cover border border-ink/30 shrink-0"
            />
          ) : selectedOption?.accentColor ? (
            <span
              className="w-3 h-3 rounded-full border border-ink/30 shrink-0"
              style={{ backgroundColor: selectedOption.accentColor }}
            />
          ) : null}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cobalt' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[90] mt-2 min-w-[210px] w-full bg-surface rounded-2xl border-2 border-ink shadow-card overflow-hidden py-1.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
        >
          <div className="max-h-64 overflow-y-auto divide-y divide-ink/5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition ${
                    isSelected
                      ? 'bg-pastel-yellow font-extrabold text-ink'
                      : 'text-ink/80 font-semibold hover:bg-cream'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.logoUrl ? (
                      <img
                        src={opt.logoUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover border border-ink/30 shrink-0"
                      />
                    ) : opt.accentColor ? (
                      <span
                        className="w-3 h-3 rounded-full border border-ink/30 shrink-0"
                        style={{ backgroundColor: opt.accentColor }}
                      />
                    ) : null}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-surface border border-ink/15 text-ink">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-cobalt shrink-0" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
