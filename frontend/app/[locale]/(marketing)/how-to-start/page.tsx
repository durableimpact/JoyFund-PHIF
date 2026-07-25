import type { Metadata } from 'next'
import HowItWorksPageClient from './PageClient'
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
      title: t('seo.howItWorks.title'),
      description: t('seo.howItWorks.description'),
      path: '/how-to-start',
    },
    locale as 'en' | 'fr',
  )
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How JoyFund Works',
  description:
    'Learn how JoyFund turns birthdays, weddings, and celebrations into healthcare relief for vulnerable mothers in Cameroon. Simple steps to launch your campaign.',
  author: {
    '@type': 'Organization',
    name: 'JoyFund',
    url: 'https://joy-fund.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'JoyFund',
    url: 'https://joy-fund.com',
  },
  datePublished: '2026-07-01',
  dateModified: '2026-07-25',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://joy-fund.com/en/how-to-start',
  },
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Select your occasion',
      text: 'Choose what you are celebrating - a birthday, wedding, graduation, promotion, or memorial.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Tell your story',
      text: 'Add a cover photo, name your campaign, and describe why you are fundraising.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Set your goal',
      text: 'Choose your fundraising target and pick an end date for your campaign.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Preview your campaign',
      text: 'Review everything before it goes live - you can still make changes at this stage.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Publish with a starting contribution',
      text: 'To publish your campaign, donate at least 10% of your goal yourself.',
    },
    {
      '@type': 'HowToStep',
      position: 6,
      name: 'Share your campaign',
      text: 'Share your campaign URL with friends, family, and your community.',
    },
  ],
}

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HowItWorksPageClient />
    </>
  )
}
