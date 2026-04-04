import Link from "next/link";
import { Role, ExecutorAccountStatus } from "@prisma/client";
import { Banknote, Briefcase, MessageSquare, Search, UserRound, Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import {
  CabinetFancyDivider,
  DashboardQuickLink,
  DashboardSectionTitle,
  DashboardStatTile,
} from "@/components/cabinet/dashboard-ui";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { Button } from "@/components/ui/button";
import { getSessionUserForAction } from "@/lib/rbac";
import { executorAccountStatusRu } from "@/lib/executor-labels";
import { prisma } from "@/lib/db";

function greetingName(displayName: string | null | undefined, username: string | null | undefined, email: string) {
  const d = displayName?.trim();
  if (d) return d.split(/\s+/)[0] ?? d;
  const u = username?.trim();
  if (u) return u;
  return email.split("@")[0] || "исполнитель";
}

export default async function ExecutorHomePage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const [active, revision, completed, profile] = await Promise.all([
    prisma.order.count({
      where: { executorId: user.id, status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } },
    }),
    prisma.order.count({
      where: { executorId: user.id, status: "REVISION" },
    }),
    prisma.order.count({
      where: { executorId: user.id, status: { in: ["COMPLETED", "ACCEPTED"] } },
    }),
    prisma.executorProfile.findUnique({
      where: { userId: user.id },
      select: { displayName: true, username: true, accountStatus: true },
    }),
  ]);

  const name = greetingName(profile?.displayName, profile?.username, user.email);
  const noAssignedWork = active + revision + completed === 0;

  let statusNote: string | null = null;
  let statusTone: "neutral" | "amber" | "rose" = "neutral";
  if (profile?.accountStatus === ExecutorAccountStatus.PENDING_MODERATION) {
    statusNote =
      "Анкета на проверке у администратора: пока статус не «Активен», отклики на заказы недоступны. Статус меняется в разделе «Исполнители».";
    statusTone = "amber";
  } else if (profile?.accountStatus === ExecutorAccountStatus.BLOCKED) {
    statusNote = "Аккаунт исполнителя заблокирован. Обратитесь в поддержку площадки.";
    statusTone = "rose";
  } else if (profile?.accountStatus === ExecutorAccountStatus.ARCHIVED) {
    statusNote = "Профиль в архиве. Восстановите статус в кабинете или через поддержку.";
    statusTone = "amber";
  }

  return (
    <div className="space-y-10">
      <CabinetPageHeader
        breadcrumbs={[{ label: "Дашборд" }]}
        title={`Привет, ${name}`}
        description="Активные задачи, отклики на заказы и переписка в чате по сделке. Баланс и выплаты — в отдельном разделе."
        action={
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <Link href="/executor/orders/available">
              <Search className="mr-2 h-4 w-4" aria-hidden />
              Найти заказы
            </Link>
          </Button>
        }
      />

      {statusNote ? (
        <div
          className={
            statusTone === "rose"
              ? "rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/35"
              : "rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30"
          }
          role="status"
        >
          <p
            className={
              statusTone === "rose"
                ? "text-sm font-medium text-red-950 dark:text-red-100"
                : "text-sm font-medium text-amber-950 dark:text-amber-100"
            }
          >
            {statusNote}
          </p>
          {profile?.accountStatus === ExecutorAccountStatus.PENDING_MODERATION ? (
            <Link
              href="/executor/profile"
              className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-2"
            >
              Открыть профиль
            </Link>
          ) : null}
        </div>
      ) : null}

      {!statusNote && profile?.accountStatus === ExecutorAccountStatus.ACTIVE && noAssignedWork ? (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Пока нет назначенных задач</p>
          <p className="mt-1 text-sm text-emerald-900/90 dark:text-emerald-200/90">
            Загляните в каталог открытых заказов и откликнитесь на подходящие — заказчик выберет исполнителя по откликам.
          </p>
          <Button asChild className="mt-3" size="sm" variant="secondary">
            <Link href="/executor/orders/available">Смотреть доступные заказы</Link>
          </Button>
        </div>
      ) : null}

      <CabinetFancyDivider />

      <section className="space-y-4">
        <DashboardSectionTitle>Мои задачи</DashboardSectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardStatTile
            icon={Briefcase}
            label="Активные"
            value={active}
            sublabel="Назначены вы, идёт работа или сдача"
          />
          <DashboardStatTile
            icon={Wrench}
            label="На доработке"
            value={revision}
            sublabel="Заказчик запросил правки"
          />
          <DashboardStatTile
            icon={Briefcase}
            label="Завершённые"
            value={completed}
            sublabel="Принято или завершено"
          />
        </div>
      </section>

      <CabinetFancyDivider />

      <section className="space-y-4">
        <DashboardSectionTitle>Разделы</DashboardSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <DashboardQuickLink
            href="/executor/orders/available"
            title="Доступные заказы"
            description="Открытые задачи, на которые можно откликнуться при статусе аккаунта «Активен»."
            icon={Search}
          />
          <DashboardQuickLink
            href="/executor/orders"
            title="Мои заказы"
            description="Всё, где вы назначены исполнителем."
            icon={Briefcase}
          />
          <DashboardQuickLink
            href="/executor/messages"
            title="Сообщения"
            description="Чаты по заказам с вашим участием."
            icon={MessageSquare}
          />
          <DashboardQuickLink
            href="/executor/balance"
            title="Баланс и выплаты"
            description="Заработок, заявки на вывод, история."
            icon={Banknote}
          />
          <DashboardQuickLink
            href="/executor/profile"
            title="Профиль"
            description={`Статус анкеты: ${
              profile?.accountStatus ? executorAccountStatusRu(profile.accountStatus) : "—"
            }`}
            icon={UserRound}
          />
        </div>
      </section>
    </div>
  );
}
