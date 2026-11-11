'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

type SubscriptionExpiredBannerProps = {
  firmName?: string;
  expiredDate?: string;
  daysExpired?: number;
  message?: string;
  showContactButton?: boolean;
};

export default function SubscriptionExpiredBanner({
  firmName = 'Your firm',
  expiredDate,
  daysExpired,
  message,
  showContactButton = true
}: SubscriptionExpiredBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const defaultMessage = daysExpired
    ? `${firmName}'s subscription expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago${expiredDate ? ` (on ${expiredDate})` : ''}`
    : `${firmName}'s subscription has expired`;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">
            Subscription Expired
          </h3>
          <p className="text-sm text-red-700 leading-relaxed">
            {message || defaultMessage}. Please contact your administrator or support to renew your subscription and regain access to all features.
          </p>
          {showContactButton && (
            <div className="mt-3">
              <a
                href="mailto:support@antlegal.com?subject=Subscription Renewal Request"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/super-admin/finance/subscriptions"
                className="ml-3 inline-flex items-center px-4 py-2 bg-white text-red-700 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                Refill / Renew Subscription
              </a>
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
