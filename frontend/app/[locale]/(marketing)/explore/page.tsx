import type { Metadata } from 'next'
import ExplorePageClient from './PageClient'
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
      title: t('seo.explore.title'),
      description: t('seo.explore.description'),
      path: '/explore',
    },
    locale as 'en' | 'fr',
  )
}

export default function ExplorePage() {
  return <ExplorePageClient />
}
