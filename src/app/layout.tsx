import type { Metadata } from "next";
import localFont from "next/font/local";
import { YandexMetrika } from "@/components/analytics/yandex-metrika";
import { AppProviders } from "@/components/providers/app-providers";
import { SITE_SEO_DESCRIPTION, SITE_SEO_KEYWORDS, SITE_SEO_TITLE } from "@/lib/site-seo";
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

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: SITE_SEO_TITLE,
  description: SITE_SEO_DESCRIPTION,
  keywords: SITE_SEO_KEYWORDS,
  authors: [{ name: "DONE48" }],
  creator: "DONE48",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <YandexMetrika />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
