import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your AntLegal dashboard. Access client records, AI document drafts, hearings calendar, and law firm financials.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

