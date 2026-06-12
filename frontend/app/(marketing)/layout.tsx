import type { Metadata } from "next";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "JoyFund",
  description:
    "JoyFund is a transparent crowdfunding platform that turns celebrations into maternal healthcare for vulnerable women across Cameroon.",
  openGraph: {
    type: "website",
    siteName: "JoyFund",
    title: "JoyFund",
    description:
      "Turn celebrations into maternal healthcare. Donate via MTN MoMo or Orange Money.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
