import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPwaFab: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [showFallbackGuide, setShowFallbackGuide] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // 1. Cek apakah sedang berjalan di mode standalone (sudah terinstal)
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
    const isReferrerInstalled = document.referrer.startsWith('android-app://');
    const isLocalMarkedInstalled = localStorage.getItem('pwa_installed_pvc5') === 'true';

    if (isStandaloneDisplay || isIosStandalone || isReferrerInstalled || isLocalMarkedInstalled) {
      setIsInstalled(true);
      return;
    }

    // 2. Deteksi perangkat iPhone / iPad / iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIos(isAppleDevice);

    // 3. Listener event beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Listener event saat aplikasi berhasil diinstal
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem('pwa_installed_pvc5', 'true');
      setDeferredPrompt(null);
      setShowIosGuide(false);
      setShowFallbackGuide(false);
    };

    // 5. Listener perubahan display-mode
    const mediaQueryList = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        localStorage.setItem('pwa_installed_pvc5', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQueryList.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQueryList.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Jika sudah terinstal atau ditutup manual pada sesi ini, jangan tampilkan FAB
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    // Jika ada native deferredPrompt (Chrome Android)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          localStorage.setItem('pwa_installed_pvc5', 'true');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error triggering PWA install prompt:', error);
      }
      return;
    }

    // Jika di iOS Safari, tampilkan panduan Add to Home Screen
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    // Jika browser lain di Android tanpa deferred prompt aktif
    setShowFallbackGuide(true);
  };

  return (
    <>
      {/* FAB Container: Pojok kiri bawah, khusus tampilan mobile (< 1024px / lg:hidden) */}
      <div 
        className="fixed bottom-4 left-4 z-[80] lg:hidden flex items-center select-none"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
        }}
      >
        <div className="flex items-center bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700 shadow-xl rounded-full p-1.5 pl-2 backdrop-blur-md transition-transform duration-200 active:scale-95">
          {/* Tombol Utama Install */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-2.5 px-2 py-1 cursor-pointer text-left focus:outline-none"
            title="Install Schedule Start PVC 5"
          >
            <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold tracking-tight text-white pr-1">
              Install Schedule Start PVC 5
            </span>
          </button>

          {/* Tombol Tutup/Dismiss FAB Sementara */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="p-1.5 ml-0.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sembunyikan sementara"
            aria-label="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* --- MODAL PANDUAN UNTUK IPHONE (iOS SAFARI) --- */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 flex items-center justify-center font-black text-white text-sm shadow-inner">
                  PVC 5
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">
                    Install di iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-slate-400">Schedule Start PVC 5</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Langkah demi Langkah iOS */}
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="flex-1 leading-relaxed">
                  Buka website ini di <strong>Safari</strong>, lalu ketuk tombol <strong>Bagikan (Share)</strong>{' '}
                  <span className="inline-flex items-center justify-center p-1 bg-slate-700 rounded text-blue-400 align-middle mx-1">
                    <Share className="w-3.5 h-3.5" />
                  </span>{' '}
                  di bagian bawah layar iPhone.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="flex-1 leading-relaxed">
                  Gulir ke bawah pada menu pop-up, lalu pilih menu{' '}
                  <strong className="text-white">"Tambah ke Layar Utama"</strong>{' '}
                  <span className="inline-flex items-center justify-center p-1 bg-slate-700 rounded text-emerald-400 align-middle mx-1">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </span>{' '}
                  (<em>Add to Home Screen</em>).
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="flex-1 leading-relaxed">
                  Ketuk tombol <strong className="text-white">"Tambah" (Add)</strong> di sudut kanan atas layar.
                  Aplikasi akan langsung terpasang di layar utama iPhone Anda!
                </div>
              </div>
            </div>

            {/* Tombol Selesai */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PANDUAN FALLBACK ANDROID / LAINNYA --- */}
      {showFallbackGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 flex items-center justify-center font-black text-white text-sm shadow-inner">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">
                    Install di Android
                  </h3>
                  <p className="text-[11px] text-slate-400">Schedule Start PVC 5</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFallbackGuide(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Langkah demi Langkah Android */}
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="flex-1 leading-relaxed">
                  Ketuk ikon <strong>menu titik tiga (⋮)</strong> di sudut kanan atas browser Chrome / browser Android Anda.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="flex-1 leading-relaxed">
                  Pilih menu <strong className="text-white">"Instal aplikasi"</strong> atau <strong className="text-white">"Tambahkan ke Layar Utama"</strong>.
                </div>
              </div>
            </div>

            {/* Tombol Selesai */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFallbackGuide(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
