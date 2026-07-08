import type { Metadata } from 'next'
import TermsPageClient from './PageClient'
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
      title: t('seo.terms.title'),
      description: t('seo.terms.description'),
      path: '/terms',
    },
    locale as 'en' | 'fr',
  )
}

export default function TermsPage() {
  return <TermsPageClient />
}
