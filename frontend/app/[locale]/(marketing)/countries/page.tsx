import type { Metadata } from 'next'
import SupportedCountriesPageClient from './PageClient'
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
      title: t('seo.countries.title'),
      description: t('seo.countries.description'),
      path: '/countries',
    },
    locale as 'en' | 'fr',
  )
}

export default function SupportedCountriesPage() {
  return <SupportedCountriesPageClient />
}
