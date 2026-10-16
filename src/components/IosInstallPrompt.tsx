import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';

const STORAGE_KEY = 'revelation_ios_prompt_dismissed_v1';

export const IosInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already added to home screen)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS Safari specific property
      Boolean(window.navigator.standalone);

    setIsStandalone(isStandaloneMode);

    // Detect if device is iOS (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    setIsIosDevice(isIos);

    // Show prompt if on iOS and not yet in standalone mode, unless dismissed previously
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (isIos && !isStandaloneMode && !isDismissed) {
      // Delay slightly so user sees the page first
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-ink text-white rounded-2xl p-4 shadow-2xl border-2 border-pastel-yellow relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
          aria-label="Tutup panduan"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-cobalt flex items-center justify-center shrink-0 border border-pastel-yellow/30 shadow-sm">
            <Smartphone className="w-5 h-5 text-pastel-yellow" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-sm text-pastel-yellow flex items-center gap-1.5">
              <span>Jadikan Aplikasi di Layar Utama iPhone</span>
            </h4>
            <p className="text-xs text-white/80 leading-relaxed">
              Akses cepat satu-sentuhan tanpa browser toolbar seperti aplikasi asli di iPhone Anda.
            </p>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/15 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-5 h-5 rounded-full bg-pastel-yellow text-ink font-extrabold flex items-center justify-center text-[10px] shrink-0">
              1
            </span>
            <span>
              Ketuk tombol <strong>Bagikan (Share)</strong>{' '}
              <Share className="w-3.5 h-3.5 inline-block text-pastel-coral mx-0.5" /> di bilah bawah Safari.
            </span>
          </div>

          <div className="flex items-center gap-2 text-white/90">
            <span className="w-5 h-5 rounded-full bg-pastel-yellow text-ink font-extrabold flex items-center justify-center text-[10px] shrink-0">
              2
            </span>
            <span>
              Gulir ke bawah, lalu pilih{' '}
              <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>{' '}
              <PlusSquare className="w-3.5 h-3.5 inline-block text-pastel-yellow mx-0.5" />.
            </span>
          </div>

          <div className="flex items-center gap-2 text-white/90">
            <span className="w-5 h-5 rounded-full bg-pastel-yellow text-ink font-extrabold flex items-center justify-center text-[10px] shrink-0">
              3
            </span>
            <span>
              Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Selesai!
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 rounded-full bg-pastel-yellow hover:bg-yellow-300 text-ink text-xs font-bold inline-flex items-center gap-1 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mengerti</span>
          </button>
        </div>
      </div>
    </div>
  );
};
