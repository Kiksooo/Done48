import Link from "next/link";
import { Search } from "lucide-react";
import { CabinetEmptyState } from "@/components/cabinet/dashboard-ui";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { Button } from "@/components/ui/button";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";
import { listAvailableOrdersForExecutor } from "@/server/queries/orders";
import { OrderBudgetOneLine } from "@/components/orders/order-budget-display";
import { getPlatformFeePercent } from "@/server/finance/split";

export default async function ExecutorAvailableOrdersPage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const [rows, prefs, platformFeePercent] = await Promise.all([
    listAvailableOrdersForExecutor(user.id),
    prisma.executorProfile.findUnique({
      where: { userId: user.id },
      select: { orderCities: true },
    }),
    getPlatformFeePercent(),
  ]);
  const filterCities = (prefs?.orderCities ?? []).map((c) => c.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Доступные заказы" },
        ]}
        title="Доступные заказы"
        description="Опубликованные задачи с открытыми откликами — откройте карточку, чтобы предложить условия."
      />

      {filterCities.length > 0 ? (
        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Показаны заказы, где город заказчика совпадает с вашим списком:{" "}
          <span className="font-medium text-foreground">{filterCities.join(", ")}</span>
          , либо город у заказчика не указан. Настроить список можно в{" "}
          <Link href="/executor/profile" className="font-medium text-primary underline-offset-2 hover:underline">
            профиле
          </Link>
          .
        </p>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Сейчас отображаются заказы по всем городам. Чтобы сузить выбор, укажите{" "}
          <span className="font-medium text-foreground">города исполнения</span> в{" "}
          <Link href="/executor/profile" className="font-medium text-primary underline-offset-2 hover:underline">
            профиле
          </Link>
          .
        </p>
      )}

      <div className="space-y-3">
        {rows.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link href={`/orders/${o.id}`} className="text-base font-medium text-foreground hover:underline">
                {o.title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
                <span>
                  {o.category.name}
                  {o.subcategory ? ` · ${o.subcategory.name}` : ""} ·{" "}
                  <OrderBudgetOneLine
                    budgetCents={o.budgetCents}
                    currency={o.currency}
                    feePercent={platformFeePercent}
                  />{" "}
                  · дедлайн {formatDateTime(o.deadlineAt)}
                  {o.customer.customerProfile?.city
                    ? ` · город: ${o.customer.customerProfile.city}`
                    : ""}
                </span>
                {o.isOfflineWork ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                    Выезд
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button size="sm" asChild>
                <Link href={`/orders/${o.id}#executor-respond`}>Откликнуться</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/orders/${o.id}`}>Подробнее</Link>
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <CabinetEmptyState
            icon={Search}
            title="Сейчас нет открытых задач"
            description="Когда заказчики опубликуют новые заказы с открытыми откликами, они появятся здесь. Проверьте города в профиле — при фильтре показываются только подходящие города."
          >
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/executor/profile">Настроить профиль</Link>
            </Button>
          </CabinetEmptyState>
        ) : null}
      </div>
    </div>
  );
}
