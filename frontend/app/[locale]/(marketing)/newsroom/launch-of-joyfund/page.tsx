import type { Metadata } from 'next'
import LaunchOfJoyFundClient from './PageClient'
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
      title: t('newsroom.launch.title'),
      description: t('newsroom.launch.description'),
      path: '/newsroom/launch-of-joyfund',
      ogImage: '/assets/images/joyfund-launch/joyfund-launch-1.jpg',
    },
    locale as 'en' | 'fr',
  )
}

export default function LaunchOfJoyFundPage() {
  return <LaunchOfJoyFundClient />
}
