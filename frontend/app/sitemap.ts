import { MetadataRoute } from 'next'

// Force dynamic rendering so it doesn't try to fetch during the Docker build
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache results for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://joy-fund.com'
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'

  const locales = ['en', 'fr']

  // Standard static pages
  const staticPaths = [
    '',
    '/about',
    '/explore',
    '/trust-and-transparency',
    '/privacy',
    '/terms',
    '/pricing',
    '/countries',
    '/leaderboard',
  ]

  const routes = locales.flatMap((locale) =>
    staticPaths.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    }))
  )

  // Fetch up to 1000 campaigns for dynamic routes
  let campaignsSitemap: MetadataRoute.Sitemap = []
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${apiUrl}/api/campaigns/?page_size=1000&is_active=true&is_public=true&min_progress_percentage=1`, { 
      signal: controller.signal,
      next: { revalidate: 3600 } 
    })
    
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const campaigns = data.results || []
      
      campaignsSitemap = campaigns.flatMap((campaign: any) =>
        locales.map((locale) => ({
          url: `${baseUrl}/${locale}/campaign/${campaign.id}`,
          lastModified: new Date(campaign.updated_at || campaign.created_at || new Date()),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      )
    }
  } catch (error) {
    console.log('Sitemap: API unreachable during generation, using static routes only.')
  }
  
  return [...routes, ...campaignsSitemap]
}
