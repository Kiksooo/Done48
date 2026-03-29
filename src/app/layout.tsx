import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import localFont from "next/font/local";
import { YandexMetrika } from "@/components/analytics/yandex-metrika";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

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
  title: "DONE48 — маркетплейс микро-услуг для заказчиков и исполнителей",
  description:
    "DONE48: публикуйте задачи или находите заказы, ведите сделки в кабинете с балансом и статусами — единый цикл сделки на одной платформе.",
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
