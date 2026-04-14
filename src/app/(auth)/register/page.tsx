import type { Metadata } from "next";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { parseRegisterRoleFromSearchParam } from "@/lib/register-intent";
import { BREADCRUMB_REGISTER } from "@/lib/public-breadcrumb-presets";
import {
  AUTH_REGISTER_ABSOLUTE_TITLE,
  AUTH_REGISTER_DESCRIPTION,
  SITE_SEO_BRAND,
} from "@/lib/site-seo";
import { RegisterForm } from "./register-form";

function pickSearchParamRef(raw: string | string[] | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : undefined;
}

export const metadata: Metadata = {
  title: { absolute: AUTH_REGISTER_ABSOLUTE_TITLE },
  description: AUTH_REGISTER_DESCRIPTION,
  alternates: { canonical: "/register" },
  openGraph: {
    title: AUTH_REGISTER_ABSOLUTE_TITLE,
    description: AUTH_REGISTER_DESCRIPTION,
    url: "/register",
    siteName: SITE_SEO_BRAND,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary",
    title: AUTH_REGISTER_ABSOLUTE_TITLE,
    description: AUTH_REGISTER_DESCRIPTION,
  },
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { ref?: string | string[]; role?: string | string[] };
}) {
  const ref = pickSearchParamRef(searchParams.ref);
  const defaultRole = parseRegisterRoleFromSearchParam(searchParams.role);
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <BreadcrumbJsonLd items={BREADCRUMB_REGISTER} />
      <PublicBreadcrumbs items={BREADCRUMB_REGISTER} />
      <RegisterForm referralCode={ref} defaultRole={defaultRole} />
    </div>
  );
}
