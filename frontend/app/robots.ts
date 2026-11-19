import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_LAWFIRM_APP_URL || 'https://antlegal.anthemgt.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register'],
        disallow: [
          '/api/',
          '/advocate/',
          '/client/',
          '/firm-admin/',
          '/paralegal/',
          '/partner-manager/',
          '/platform-owner/',
          '/super-admin/',
          '/forgot-password/',
          '/subscription-expired/',
          '/join/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

