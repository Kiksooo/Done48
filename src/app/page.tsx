import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getSessionUserForAction } from "@/lib/rbac";
import { dashboardPath } from "@/lib/routes";

export default async function HomePage() {
  const user = await getSessionUserForAction();
  if (user) {
    redirect(dashboardPath(user.role, user.onboardingDone));
  }

  return <LandingPage />;
}
