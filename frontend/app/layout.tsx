import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import ReactQueryProvider from "@/provider/react-query-provider";
import AppHelmetProvider from "@/provider/helmet-provider";
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
  "@graph": [
    {
      "@type": "NonprofitOrganization",
      "@id": "https://joy-fund.com/#organization",
      "name": "JoyFund",
      "description": "A digital Njangi and transparent crowdfunding platform funding maternal healthcare and safe deliveries for vulnerable women across Cameroon.",
      "url": "https://joy-fund.com",
      "logo": "https://joy-fund.com/logo.png",
      "foundingLocation": {
        "@type": "Place",
        "name": "Cameroon"
      },
      "sameAs": [
        "https://twitter.com/joyfund",
        "https://facebook.com/joyfund"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://joy-fund.com/#website",
      "url": "https://joy-fund.com",
      "name": "JoyFund",
      "publisher": {
        "@id": "https://joy-fund.com/#organization"
      }
    }
  ]
};

export const metadata: Metadata = {
  title: {
    default: "JoyFund: Maternal Health Crowdfunding in Cameroon",
    template: "%s | JoyFund",
  },
  description:
    "Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare.",
  metadataBase: new URL("https://joy-fund.com"),
  verification: {
    google: "OyspcSNhwrr5zCVrvp1J0iPhdZEvX2iAAl3nuEkiUZo",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "JoyFund",
    title: "JoyFund: Maternal Health Crowdfunding in Cameroon",
    description:
      "Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "JoyFund - Solidarity Health Insurance for Cameroon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JoyFund: Maternal Health Crowdfunding in Cameroon",
    description:
      "Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/assets/favicon_io/joyfund-android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/assets/favicon_io/joyfund-favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/assets/favicon_io/joyfund-apple-touch-icon.png",
    shortcut: "/assets/favicon_io/joyfund-android-chrome-192x192.png",
  },
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
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon_io/joyfund-apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon_io/joyfund-android-chrome-192x192.png" />
        <link rel="shortcut icon" href="/assets/favicon_io/joyfund-android-chrome-192x192.png" />
        <link rel="icon" href="/assets/favicon_io/joyfund-android-chrome-192x192.png" />
        
        {/* Google Analytics - Only in production */}
        {process.env.NODE_ENV === 'production' && (
          <>
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
          </>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning suppressContentEditableWarning className={cn("min-h-full flex flex-col antialiased font-sans", geistMono.variable)}>
        {/* Google Tag Manager (noscript) - Only in production */}
        {process.env.NODE_ENV === 'production' && (
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-PDSWHHB9"
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <SessionProvider>
          <ReactQueryProvider>
            <AppHelmetProvider>
              {children}
            </AppHelmetProvider>
          </ReactQueryProvider>
          <Toaster/>
        </SessionProvider>
      </body>
    </html>
  );
}
