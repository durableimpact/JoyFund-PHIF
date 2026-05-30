import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import ReactQueryProvider from "@/provider/react-query-provider";
import { Toaster } from "@/components/ui/sonner"

const montserrat = localFont({
  src: "../public/font/Montserrat-VariableFont_wght.ttf",
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JoyFund",
  description:
    "A transparent crowdfunding platform turning celebrations into maternal healthcare across Cameroon.",
  url: "https://joy-fund.com",
  logo: "https://joy-fund.com/logo.png",
  sameAs: [
    "https://twitter.com/joyfund",
    "https://facebook.com/joyfund",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "support@joyfund.cm",
  },
};

export const metadata: Metadata = {
  title: {
    default: "JoyFund — Solidarity Health Insurance for Cameroon",
    template: "%s | JoyFund",
  },
  description:
    "JoyFund is a transparent crowdfunding platform that turns celebrations into maternal healthcare for vulnerable women across Cameroon.",
  metadataBase: new URL("https://joy-fund.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "JoyFund",
    title: "JoyFund — Solidarity Health Insurance for Cameroon",
    description:
      "Turn celebrations into maternal healthcare. Donate via MTN MoMo or Orange Money.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "JoyFund" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JoyFund — Solidarity Health Insurance for Cameroon",
    description:
      "Turn celebrations into maternal healthcare. Donate via MTN MoMo or Orange Money.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning suppressContentEditableWarning
      className={cn("h-full", montserrat.variable)}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning suppressContentEditableWarning className={cn("min-h-full flex flex-col antialiased font-sans", geistMono.variable)}>
        <SessionProvider>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
          <Toaster/>
        </SessionProvider>
      </body>
    </html>
  );
}
