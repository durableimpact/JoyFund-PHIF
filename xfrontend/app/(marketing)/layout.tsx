import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JoyFund — Solidarity Health Insurance for Cameroon",
  description:
    "JoyFund is a transparent crowdfunding platform that turns celebrations into maternal healthcare for vulnerable women across Cameroon.",
  openGraph: {
    type: "website",
    siteName: "JoyFund",
    title: "JoyFund — Solidarity Health Insurance for Cameroon",
    description:
      "Turn celebrations into maternal healthcare. Donate via MTN MoMo or Orange Money.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
