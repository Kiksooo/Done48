import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { YandexMetrika } from "@/components/analytics/yandex-metrika";
import { AppProviders } from "@/components/providers/app-providers";
import {
  SITE_SEO_DESCRIPTION,
  SITE_SEO_KEYWORDS,
  SITE_SEO_TITLE,
  SITE_SEO_TITLE_TEMPLATE,
} from "@/lib/site-seo";
import { getMetadataBase } from "@/lib/site-url";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const searchVerification =
  process.env.GOOGLE_SITE_VERIFICATION || process.env.YANDEX_VERIFICATION
    ? {
        verification: {
          ...(process.env.GOOGLE_SITE_VERIFICATION && {
            google: process.env.GOOGLE_SITE_VERIFICATION,
          }),
          ...(process.env.YANDEX_VERIFICATION && { yandex: process.env.YANDEX_VERIFICATION }),
        },
      }
    : {};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_SEO_TITLE,
    template: SITE_SEO_TITLE_TEMPLATE,
  },
  description: SITE_SEO_DESCRIPTION,
  keywords: SITE_SEO_KEYWORDS,
  authors: [{ name: "DONE48" }],
  creator: "DONE48",
  category: "business",
  ...searchVerification,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "DONE48",
    title: SITE_SEO_TITLE,
    description: SITE_SEO_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_SEO_TITLE,
    description: SITE_SEO_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <GoogleAnalytics />
        <YandexMetrika />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
