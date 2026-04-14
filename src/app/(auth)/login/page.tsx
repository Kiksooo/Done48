import type { Metadata } from "next";
import { Suspense } from "react";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { BREADCRUMB_LOGIN } from "@/lib/public-breadcrumb-presets";
import { AUTH_LOGIN_ABSOLUTE_TITLE, AUTH_LOGIN_DESCRIPTION, SITE_SEO_BRAND } from "@/lib/site-seo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: { absolute: AUTH_LOGIN_ABSOLUTE_TITLE },
  description: AUTH_LOGIN_DESCRIPTION,
  alternates: { canonical: "/login" },
  openGraph: {
    title: AUTH_LOGIN_ABSOLUTE_TITLE,
    description: AUTH_LOGIN_DESCRIPTION,
    url: "/login",
    siteName: SITE_SEO_BRAND,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary",
    title: AUTH_LOGIN_ABSOLUTE_TITLE,
    description: AUTH_LOGIN_DESCRIPTION,
  },
};

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <BreadcrumbJsonLd items={BREADCRUMB_LOGIN} />
      <PublicBreadcrumbs items={BREADCRUMB_LOGIN} />
      <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Загрузка…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
