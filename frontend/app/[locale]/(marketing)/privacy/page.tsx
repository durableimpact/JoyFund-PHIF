import type { Metadata } from 'next'
import PrivacyPageClient from './PageClient'
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
      title: t('seo.privacy.title'),
      description: t('seo.privacy.description'),
      path: '/privacy',
    },
    locale as 'en' | 'fr',
  )
}

export default function PrivacyPage() {
  return <PrivacyPageClient />
}
