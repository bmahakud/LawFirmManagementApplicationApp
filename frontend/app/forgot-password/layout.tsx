import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your AntLegal account password securely.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

