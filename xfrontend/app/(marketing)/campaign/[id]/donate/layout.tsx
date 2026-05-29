import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Donate to Campaign ${id}`,
    description:
      "Donate via MTN MoMo or Orange Money to support maternal healthcare for vulnerable women in Cameroon.",
    robots: { index: false },
    openGraph: {
      title: `Donate to Campaign ${id} | JoyFund`,
      description:
        "Donate via MTN MoMo or Orange Money to support maternal healthcare for vulnerable women in Cameroon.",
    },
  };
}

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
