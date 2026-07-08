import type { Metadata } from 'next'
import PricingPageClient from './PageClient'
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
      title: t('seo.pricing.title'),
      description: t('seo.pricing.description'),
      path: '/pricing',
    },
    locale as 'en' | 'fr',
  )
}

export default function PricingPage() {
  return <PricingPageClient />
}
