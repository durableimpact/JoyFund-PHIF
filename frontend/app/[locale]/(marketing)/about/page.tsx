import type { Metadata } from 'next'
import AboutPageClient from './PageClient'
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
      title: t('seo.about.title'),
      description: t('seo.about.description'),
      path: '/about',
    },
    locale as 'en' | 'fr',
  )
}

export default function AboutPage() {
  return <AboutPageClient />
}
