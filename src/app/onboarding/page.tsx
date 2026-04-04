import { redirect } from "next/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { dashboardPath } from "@/lib/routes";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const user = await getSessionUserForAction();
  if (!user) {
    redirect("/login");
  }
  if (user.onboardingDone) {
    redirect(dashboardPath(user.role, true));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-lg">
        <OnboardingClient role={user.role} />
      </div>
    </div>
  );
}
