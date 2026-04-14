import type { Metadata } from "next";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { BREADCRUMB_FORGOT_PASSWORD } from "@/lib/public-breadcrumb-presets";
import {
  AUTH_FORGOT_PASSWORD_DESCRIPTION,
  AUTH_FORGOT_PASSWORD_TITLE,
  SITE_SEO_BRAND,
} from "@/lib/site-seo";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: { absolute: AUTH_FORGOT_PASSWORD_TITLE },
  description: AUTH_FORGOT_PASSWORD_DESCRIPTION,
  alternates: { canonical: "/forgot-password" },
  robots: { index: true, follow: true },
  openGraph: {
    title: AUTH_FORGOT_PASSWORD_TITLE,
    description: AUTH_FORGOT_PASSWORD_DESCRIPTION,
    url: "/forgot-password",
    siteName: SITE_SEO_BRAND,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary",
    title: AUTH_FORGOT_PASSWORD_TITLE,
    description: AUTH_FORGOT_PASSWORD_DESCRIPTION,
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-5">
        <BreadcrumbJsonLd items={BREADCRUMB_FORGOT_PASSWORD} />
        <PublicBreadcrumbs items={BREADCRUMB_FORGOT_PASSWORD} />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
