import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://joy-fund.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/profile/',
        '/api/',
        '/(protected)/',
        '/unauthorized',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
