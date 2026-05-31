import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://joy-fund.com'
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'

  // Standard static pages
  const routes = [
    '',
    '/about',
    '/explore',
    '/campaign',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Fetch up to 1000 campaigns for dynamic routes
  let campaignsSitemap: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${apiUrl}/api/campaigns/?page_size=1000`, { 
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (res.ok) {
      const data = await res.json()
      // The API returns a paginated response with a 'results' array
      const campaigns = data.results || []
      
      campaignsSitemap = campaigns.map((campaign: any) => ({
        url: `${baseUrl}/campaign/${campaign.id}`,
        lastModified: new Date(campaign.updated_at || campaign.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error fetching campaigns for sitemap:', error)
  }
  
  return [...routes, ...campaignsSitemap]
}
