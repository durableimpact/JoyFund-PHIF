import type { Metadata } from 'next'
import BlogPageClient from './PageClient'
import { generatePageMetadata } from '@/lib/seo-metadata'
import { getI18n, setStaticParamsLocale } from '@/locales/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  setStaticParamsLocale(locale)
  const t = await getI18n()
  return generatePageMetadata(
    {
      title: t('seo.blog.title'),
      description: t('seo.blog.description'),
      path: '/blog',
    },
    locale as 'en' | 'fr',
  )
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How JoyFund Works',
  description:
    'Learn how JoyFund turns birthdays, weddings, and celebrations into healthcare relief for vulnerable mothers in Cameroon. Six simple steps to launch your campaign.',
  author: {
    '@type': 'Organization',
    name: 'JoyFund',
    url: 'https://joy-fund.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'JoyFund',
    url: 'https://joy-fund.com',
  },
  datePublished: '2026-07-01',
  dateModified: '2026-07-01',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://joy-fund.com/en/blog',
  },
  about: {
    '@type': 'Thing',
    name: 'JoyFund crowdfunding platform',
  },
  keywords: [
    'JoyFund',
    'crowdfunding',
    'maternal healthcare',
    'Cameroon',
    'Njangi',
    'community health fund',
    'safe delivery',
    'Mobile Money',
  ],
}

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPageClient />
    </>
  )
}
