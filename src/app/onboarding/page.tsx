import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dashboardPath, isAppRole } from "@/lib/routes";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAppRole(session.user.role)) {
    redirect("/login");
  }
  if (session.user.onboardingDone) {
    redirect(dashboardPath(session.user.role, true));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-lg">
        <OnboardingClient />
      </div>
    </div>
  );
}
