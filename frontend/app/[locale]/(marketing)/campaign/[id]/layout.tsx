import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
const BASE_URL = "https://joy-fund.com";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
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
  const url = `${BASE_URL}/campaign/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "JoyFund",
      type: "website",
      ...(campaign.cover_image && { images: [{ url: campaign.cover_image, width: 1200, height: 630, alt: campaign.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(campaign.cover_image && { images: [campaign.cover_image] }),
    },
    alternates: { canonical: url },
  };
}

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await fetchCampaign(id);

  const jsonLd = campaign
    ? {
        "@context": "https://schema.org",
        "@type": "DonateAction",
        name: campaign.title,
        description: campaign.description || undefined,
        url: `${BASE_URL}/campaign/${id}`,
        image: campaign.cover_image || undefined,
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
          url: `${BASE_URL}/campaign/${id}/donate/`,
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
