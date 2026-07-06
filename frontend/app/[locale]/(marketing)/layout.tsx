import type { Metadata } from "next";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "JoyFund — Your Joy Saves Lives",
  description:
    "Turn your birthday or wedding into a digital community health fund. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare.",
  openGraph: {
    type: "website",
    siteName: "JoyFund",
    title: "JoyFund — Your Joy Saves Lives",
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
