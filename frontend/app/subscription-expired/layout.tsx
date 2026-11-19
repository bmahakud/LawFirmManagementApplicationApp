import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription Status',
  description: 'Manage or renew your AntLegal law firm subscription.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubscriptionExpiredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

