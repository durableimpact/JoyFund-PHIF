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
    default: "JoyFund - Solidarity Health Insurance for Cameroon",
    template: "%s | JoyFund",
  },
  description:
    "JoyFund is a transparent crowdfunding platform that turns celebrations into maternal healthcare for vulnerable women across Cameroon.",
  metadataBase: new URL("https://joy-fund.com"),
  verification: {
    google: "OyspcSNhwrr5zCVrvp1J0iPhdZEvX2iAAl3nuEkiUZo",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "JoyFund",
    title: "JoyFund - Solidarity Health Insurance for Cameroon",
    description:
      "Turn celebrations into maternal healthcare. Donate via MTN MoMo or Orange Money.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "JoyFund" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JoyFund - Solidarity Health Insurance for Cameroon",
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
        <meta name="google-site-verification" content="3Td7-qGUvMTtrrQ-0rVom8KwPSNikh9eLKgGzZMpCdk" />
        
        {/* Google tag (gtag.js) - GA4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XYBNHE5J4B"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XYBNHE5J4B');
            `,
          }}
        />

        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PDSWHHB9');`,
          }}
        />
        {/* End Google Tag Manager */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning suppressContentEditableWarning className={cn("min-h-full flex flex-col antialiased font-sans", geistMono.variable)}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PDSWHHB9"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
