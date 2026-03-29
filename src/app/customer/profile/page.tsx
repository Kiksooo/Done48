import { CustomerProfileForm } from "@/components/profile/customer-profile-form";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function CustomerProfilePage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return <p className="text-sm text-neutral-600">Профиль не найден.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Профиль заказчика</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Контактные данные для исполнителей и администрации.</p>
      </div>
      <CustomerProfileForm
        initial={{
          displayName: profile.displayName,
          phone: profile.phone,
          telegram: profile.telegram,
          company: profile.company,
        }}
      />
    </div>
  );
}
