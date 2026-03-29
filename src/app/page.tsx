import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getSessionUserForAction } from "@/lib/rbac";
import { dashboardPath } from "@/lib/routes";
import { SITE_SEO_DESCRIPTION, SITE_SEO_TITLE } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: SITE_SEO_TITLE,
  description: SITE_SEO_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_SEO_TITLE,
    description: SITE_SEO_DESCRIPTION,
    url: "/",
  },
};

export default async function HomePage() {
  const user = await getSessionUserForAction();
  if (user) {
    redirect(dashboardPath(user.role, user.onboardingDone));
  }

  return <LandingPage />;
}
