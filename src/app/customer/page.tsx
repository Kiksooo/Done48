import Link from "next/link";
import { Role } from "@prisma/client";
import { ClipboardList, Eye, FolderOpen, Hourglass, MessageSquare, Plus, Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import {
  CabinetFancyDivider,
  DashboardQuickLink,
  DashboardSectionTitle,
  DashboardStatTile,
} from "@/components/cabinet/dashboard-ui";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { Button } from "@/components/ui/button";
import { formatMoneyFromCents } from "@/lib/format";
import { getSessionUserForAction } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { countCustomerOrdersByBucket, sumCustomerSpend } from "@/server/queries/orders";

function greetingName(displayName: string | null | undefined, email: string): string {
  const d = displayName?.trim();
  if (d) return d.split(/\s+/)[0] ?? d;
  return email.split("@")[0] || "заказчик";
}

export default async function CustomerHomePage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const [buckets, spendCents, profile] = await Promise.all([
    countCustomerOrdersByBucket(user.id),
    sumCustomerSpend(user.id),
    prisma.customerProfile.findUnique({
      where: { userId: user.id },
      select: { displayName: true },
    }),
  ]);

  const name = greetingName(profile?.displayName, user.email);

  return (
    <div className="space-y-10">
      <CabinetPageHeader
        breadcrumbs={[{ label: "Дашборд" }]}
        title={`Здравствуйте, ${name}`}
        description="Сводка по заказам и быстрый доступ к разделам. Ведите сделки в статусах карточки заказа — так проще отслеживать оплату и работу."
        action={
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/customer/orders/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Новый заказ
            </Link>
          </Button>
        }
      />

      <CabinetFancyDivider />

      <section className="space-y-4">
        <DashboardSectionTitle>Сводка</DashboardSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatTile
            icon={ClipboardList}
            label="В работе"
            value={buckets.active}
            sublabel="Назначен исполнитель, идёт выполнение"
          />
          <DashboardStatTile
            icon={Hourglass}
            label="Ожидание и модерация"
            value={buckets.waiting}
            sublabel="Новые и на проверке площадки"
          />
          <DashboardStatTile
            icon={Eye}
            label="На вашей проверке"
            value={buckets.review}
            sublabel="Исполнитель сдал результат"
          />
          <DashboardStatTile
            icon={Wallet}
            label="Принятые расходы"
            value={formatMoneyFromCents(spendCents)}
            sublabel="По завершённым сделкам"
          />
        </div>
      </section>

      <CabinetFancyDivider />

      <section className="space-y-4">
        <DashboardSectionTitle>Быстрые действия</DashboardSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <DashboardQuickLink
            href="/customer/orders/new"
            title="Создать заказ"
            description="Опишите задачу, бюджет и срок — после модерации заказ появится для исполнителей."
            icon={Plus}
          />
          <DashboardQuickLink
            href="/customer/orders"
            title="Мои заказы"
            description="Фильтры по стадиям: новые, в работе, на проверке и архив."
            icon={FolderOpen}
          />
          <DashboardQuickLink
            href="/customer/messages"
            title="Сообщения"
            description="Чаты по заказам, где вы участник."
            icon={MessageSquare}
          />
          <DashboardQuickLink
            href="/customer/balance"
            title="Баланс"
            description="Пополнение и безопасная сделка по заказам."
            icon={Wallet}
          />
        </div>
      </section>
    </div>
  );
}
