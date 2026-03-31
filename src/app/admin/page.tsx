import Link from "next/link";
import {
  Banknote,
  Briefcase,
  ClipboardList,
  CreditCard,
  Flag,
  FolderTree,
  LayoutDashboard,
  Scale,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashboardQuickLink,
  DashboardSectionTitle,
  DashboardStatTile,
  DashboardWelcome,
} from "@/components/cabinet/dashboard-ui";
import { formatMoneyFromCents } from "@/lib/format";
import { countAdminOverview } from "@/server/queries/orders";

export default async function AdminHomePage() {
  const o = await countAdminOverview();

  return (
    <div className="space-y-10">
      <DashboardWelcome
        greeting="Админ-панель"
        subtitle="Сводка по пользователям и заказам, быстрый переход к модерации, финансам и настройкам площадки."
        action={
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/orders">Заказы</Link>
          </Button>
        }
      />

      <section className="space-y-4">
        <DashboardSectionTitle>Показатели</DashboardSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardStatTile
            icon={Users}
            label="Пользователи"
            value={o.users}
            sublabel={`Заказчики ${o.customers} · Исполнители ${o.executors}`}
          />
          <DashboardStatTile
            icon={ClipboardList}
            label="Активные заказы"
            value={o.activeOrders}
            sublabel="Не завнесены и не отменены"
          />
          <DashboardStatTile
            icon={LayoutDashboard}
            label="Оборот по бюджетам заказов"
            value={formatMoneyFromCents(o.gmvCents)}
            sublabel="Сумма без черновиков и отменённых"
          />
        </div>
      </section>

      <section className="space-y-4">
        <DashboardSectionTitle>Управление</DashboardSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardQuickLink
            href="/admin/users"
            title="Пользователи"
            description="Роли, блокировка и удаление учётных записей."
            icon={Users}
          />
          <DashboardQuickLink
            href="/admin/executors"
            title="Исполнители"
            description="Модерация анкет: статус «Активен» для откликов."
            icon={Briefcase}
          />
          <DashboardQuickLink
            href="/admin/orders"
            title="Заказы"
            description="Статусы, публикация и назначение."
            icon={ClipboardList}
          />
          <DashboardQuickLink
            href="/admin/moderation"
            title="Жалобы и блоклист"
            description="Обращения пользователей и ограничение контактов."
            icon={Flag}
          />
          <DashboardQuickLink
            href="/admin/categories"
            title="Категории"
            description="Таксономия для публикации заказов."
            icon={FolderTree}
          />
          <DashboardQuickLink
            href="/admin/payments"
            title="Платежи"
            description="Операции и безопасная сделка."
            icon={CreditCard}
          />
          <DashboardQuickLink
            href="/admin/payouts"
            title="Выплаты"
            description="Заявки исполнителей на вывод."
            icon={Banknote}
          />
          <DashboardQuickLink href="/admin/disputes" title="Споры" description="Разбор спорных сделок." icon={Scale} />
          <DashboardQuickLink
            href="/admin/settings"
            title="Настройки"
            description="Комиссия, модерация новых заказов, лимиты откликов."
            icon={Settings}
          />
        </div>
      </section>
    </div>
  );
}
