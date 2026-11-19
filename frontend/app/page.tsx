import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

const baseUrl = process.env.NEXT_PUBLIC_LAWFIRM_APP_URL || 'https://antlegal.anthemgt.com';

export const metadata: Metadata = {
  title: 'AntLegal | Modern Law Firm Management Suite & AI Operating System',
  description: 'The complete AI-powered operating system for modern law firms. Manage cases, automate OCR legal drafting, track hearings, and streamline client billing.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'AntLegal - Modern Law Firm Management Suite',
    description: 'Transform your law practice with AI document drafting, unified case management, hearing calendars, and seamless client billing.',
    url: baseUrl,
    siteName: 'AntLegal',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AntLegal - Modern Law Firm Management Suite',
    description: 'AI-powered operating system for modern law firms: document automation, case tracking, and secure billing.',
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'AntLegal Inc.',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/courtlogin.png`,
        },
        description: 'AntLegal provides comprehensive AI-driven practice management software for law firms, advocates, and legal professionals.',
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'AntLegal',
        publisher: { '@id': `${baseUrl}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#software`,
        name: 'AntLegal',
        operatingSystem: 'Web Browser, Cloud',
        applicationCategory: 'BusinessApplication, LegalSoftware',
        description: 'Complete operating system for modern law firms. Case management, OCR document drafting, automated filing preparation, and billing.',
        offers: {
          '@type': 'Offer',
          price: '1999',
          priceCurrency: 'INR',
          priceValidUntil: '2028-12-31',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '2400',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${baseUrl}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is AntLegal and who is it designed for?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AntLegal is an AI-powered practice management operating system built specifically for law firms, independent advocates, paralegals, and practice managers. It consolidates case tracking, automated legal document drafting, hearing schedules, and client billing into one intuitive platform.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does AI-powered document drafting and OCR work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "You can upload scanned court papers, PDFs, or client records. AntLegal's OCR extracts case numbers, dates, parties, and statutory references. Our AI then drafts motions, petitions, and notices adhering to your firm's templates, allowing lawyers to review and finalize pleadings in minutes.",
            },
          },
          {
            '@type': 'Question',
            name: 'Is our law firm and client data secure and confidential?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. AntLegal enforces enterprise-grade AES-256 encryption at rest and TLS 1.3 in transit. Strict role-based access control (RBAC) ensures advocates, clients, paralegals, and firm admins only access files and communications they have explicit authorization to view.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the court hearing and calendar tracker work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AntLegal synchronizes hearing schedules, filing deadlines, and client conferences into a unified calendar. Your practice receives automated alerts, daily cause list summaries, and reminder notifications so court appearances and limitation periods are never missed.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can clients access case updates and pay bills online?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Clients receive access to a secure, branded Client Portal where they can view case milestones, review court orders, securely upload documents, and settle invoices online with instant reconciliation.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I get started with a free trial for my firm?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can sign up for a 14-day free trial with no credit card required. You will have full access to case management, AI document drafts, and client intake tools to evaluate AntLegal with your team.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
