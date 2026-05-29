import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Campaigns",
  description:
    "Browse and support active fundraising campaigns for maternal healthcare across Cameroon. Filter by status and cause.",
  openGraph: {
    title: "Explore Campaigns | JoyFund",
    description:
      "Browse and support active fundraising campaigns for maternal healthcare across Cameroon.",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
