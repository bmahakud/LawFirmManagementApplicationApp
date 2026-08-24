'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Check if there is an existing stored subscription error
    const storedError = localStorage.getItem('subscription_error');
    if (storedError) {
      try {
        const parsed = JSON.parse(storedError);
        if (parsed.message && Date.now() - (parsed.timestamp || 0) < 24 * 60 * 60 * 1000) {
          setError(parsed.message);
          setShowError(true);
        }
      } catch (e) {}
    }

    // 2. Listen to real-time subscription errors
    const handleSubscriptionError = (event: any) => {
      const message = event.detail?.message;
      if (message) {
        setError(message);
        setShowError(true);
      }
    };

    window.addEventListener('subscription-error', handleSubscriptionError);

    return () => {
      window.removeEventListener('subscription-error', handleSubscriptionError);
    };
  }, []);

  const handleClose = () => {
    setShowError(false);
    localStorage.removeItem('subscription_error');
  };

  const handleGoToSubscription = () => {
    handleClose();
    router.push('/subscription-expired');
  };

  if (!showError || !error) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-lg w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-red-950/95 backdrop-blur-xl border border-red-500/50 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-900/80 border border-red-700/80 text-red-400 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-red-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-300 mb-1">
              Subscription Expired
            </h4>
            <p className="text-xs text-red-100/90 leading-relaxed font-medium">
              {error}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleGoToSubscription}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Renew Subscription
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-900 text-red-300 text-xs font-semibold border border-red-800/80 transition-all active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-red-400 hover:text-white hover:bg-red-900/60 transition-colors shrink-0"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
