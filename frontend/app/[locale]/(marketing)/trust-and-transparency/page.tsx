import type { Metadata } from 'next'
import TrustAndTransparencyPageClient from './PageClient'
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
      title: t('seo.trust.title'),
      description: t('seo.trust.description'),
      path: '/trust-and-transparency',
    },
    locale as 'en' | 'fr',
  )
}

export default function TrustAndTransparencyPage() {
  return <TrustAndTransparencyPageClient />
}
