import { redirect } from "next/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { dashboardPath } from "@/lib/routes";

export default async function HomePage() {
  const user = await getSessionUserForAction();
  if (!user) {
    redirect("/login");
  }

  redirect(dashboardPath(user.role, user.onboardingDone));
}
