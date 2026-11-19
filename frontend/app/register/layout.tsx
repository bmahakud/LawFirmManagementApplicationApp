import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Your Law Firm',
  description: 'Create an AntLegal account for your law firm, advocates, clients, or administrators. Start your free trial today.',
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

