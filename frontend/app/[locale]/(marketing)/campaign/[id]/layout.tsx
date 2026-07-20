import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
const BASE_URL = "https://joy-fund.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

async function fetchCampaign(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/campaigns/${id}/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function resolveImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `${BASE_URL}${image}`;
  return `${BASE_URL}/${image}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const campaign = await fetchCampaign(id);

  if (!campaign) {
    return {
      title: "Campaign Not Found | JoyFund",
      description: "This campaign could not be found or has been removed.",
    };
  }

  const title = `${campaign.title} | JoyFund`;
  const description =
    campaign.description?.slice(0, 160) ||
    `Support "${campaign.title}" on JoyFund — help provide maternal healthcare for vulnerable women in Cameroon.`;
  const url = `${BASE_URL}/${locale}/campaign/${id}`;
  const ogImage = campaign.cover_image
    ? resolveImageUrl(campaign.cover_image)
    : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    openGraph: {
      title,
      description,
      url,
      siteName: "JoyFund",
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: campaign.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/campaign/${id}`,
        fr: `${BASE_URL}/fr/campaign/${id}`,
        "x-default": `${BASE_URL}/en/campaign/${id}`,
      },
    },
  };
}

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const campaign = await fetchCampaign(id);

  const jsonLd = campaign
    ? {
        "@context": "https://schema.org",
        "@type": "DonateAction",
        name: campaign.title,
        description: campaign.description || undefined,
        url: `${BASE_URL}/${locale}/campaign/${id}`,
        image: campaign.cover_image ? resolveImageUrl(campaign.cover_image) : undefined,
        actionPlatform: "https://joy-fund.com",
        organizer: campaign.organizer_name
          ? { "@type": "Person", name: campaign.organizer_name }
          : undefined,
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: campaign.location
          ? { "@type": "Place", name: campaign.location }
          : undefined,
        offers: {
          "@type": "Offer",
          price: campaign.goal_amount,
          priceCurrency: "XAF",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/${locale}/campaign/${id}/donate/`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
