import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";

export default async function ExecutorFeedbackPage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const profile = await prisma.executorProfile.findUnique({
    where: { userId: user.id },
    select: { displayName: true },
  });

  const defaultName = profile?.displayName?.trim() || undefined;

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Обратная связь" },
        ]}
        title="Обратная связь"
        description="Вопрос по заказу, выплатам, модерации или предложение по платформе — сообщение увидят администраторы."
      />
      <FeedbackForm defaultEmail={user.email} defaultName={defaultName} />
    </div>
  );
}
