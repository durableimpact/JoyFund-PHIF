import type { Metadata } from 'next'
import GetSupportPageClient from './PageClient'
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
      title: t('seo.getSupport.title'),
      description: t('seo.getSupport.description'),
      path: '/get-support',
    },
    locale as 'en' | 'fr',
  )
}

export default function GetSupportPage() {
  return <GetSupportPageClient />
}
