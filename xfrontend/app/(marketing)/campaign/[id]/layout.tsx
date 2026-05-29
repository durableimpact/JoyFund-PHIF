import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = "https://joy-fund.com";

  return {
    title: `Campaign ${id}`,
    description:
      "Support this JoyFund campaign and help provide maternal healthcare for vulnerable women in Cameroon.",
    openGraph: {
      title: `Campaign ${id} | JoyFund`,
      description:
        "Support this JoyFund campaign and help provide maternal healthcare for vulnerable women in Cameroon.",
      url: `${baseUrl}/campaign/${id}`,
    },
    twitter: {
      title: `Campaign ${id} | JoyFund`,
      description:
        "Support this JoyFund campaign and help provide maternal healthcare for vulnerable women in Cameroon.",
    },
  };
}

export default function CampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
