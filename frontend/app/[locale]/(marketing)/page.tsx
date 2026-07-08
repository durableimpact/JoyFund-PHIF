import type { Metadata } from 'next'
import HomePageClient from './PageClient'
import { generatePageMetadata } from '@/lib/seo-metadata'
import { getI18n } from '@/locales/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getI18n()
  return generatePageMetadata(
    {
      title: t('seo.home.title'),
      description: t('seo.home.description'),
      path: '',
      isHomepage: true,
    },
    locale as 'en' | 'fr',
  )
}

export default function HomePage() {
  return <HomePageClient />
}
