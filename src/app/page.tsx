import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { dashboardPath, isAppRole } from "@/lib/routes";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAppRole(session.user.role)) {
    redirect("/login");
  }

  redirect(dashboardPath(session.user.role, session.user.onboardingDone));
}
