import type { Metadata } from 'next'

const SITE_URL = 'https://joy-fund.com'
const LOCALES = ['en', 'fr'] as const

type Locale = (typeof LOCALES)[number]

interface PageSEO {
  title: string
  description: string
  path: string
  ogImage?: string
  /** Set true for the homepage to avoid double-branding from the title template */
  isHomepage?: boolean
}

function buildAlternates(path: string, locale: Locale) {
  const languages: Record<string, string> = {}
  for (const loc of LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${path}`
  }
  languages['x-default'] = `${SITE_URL}/en${path}`

  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages,
  }
}

export function generatePageMetadata(
  page: PageSEO,
  locale: Locale,
): Metadata {
  const ogImage = page.ogImage || `${SITE_URL}/og-image.png`

  // For the homepage, use absolute title to avoid "JoyFund | JoyFund"
  // For subpages, use the title string which gets the "%s | JoyFund" template
  const title = page.isHomepage
    ? { absolute: page.title }
    : page.title

  return {
    title,
    description: page.description,
    alternates: buildAlternates(page.path, locale),
    openGraph: {
      title: page.isHomepage ? page.title : `${page.title} | JoyFund`,
      description: page.description,
      url: `${SITE_URL}/${locale}${page.path}`,
      siteName: 'JoyFund',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `JoyFund - ${page.title}`,
        },
      ],
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: page.isHomepage ? page.title : `${page.title} | JoyFund`,
      description: page.description,
      images: [ogImage],
    },
  }
}
