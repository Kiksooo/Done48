import type { CustomerOrderFilter } from "@/server/queries/orders";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CabinetEmptyState } from "@/components/cabinet/dashboard-ui";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { listOrdersForCustomer } from "@/server/queries/orders";
import { cn } from "@/lib/utils";
import { OrderBudgetOneLine, OrderBudgetTableCell } from "@/components/orders/order-budget-display";
import { getPlatformFeePercent } from "@/server/finance/split";

const FILTERS: { key: CustomerOrderFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "active", label: "В работе" },
  { key: "review", label: "На проверке" },
  { key: "done", label: "Завершённые" },
  { key: "disputed", label: "Спорные" },
  { key: "canceled", label: "Отменённые" },
];

type SearchParams = { filter?: string | string[] };

export default async function CustomerOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const raw = searchParams.filter;
  const f = Array.isArray(raw) ? raw[0] : raw;
  const filter = (FILTERS.some((x) => x.key === f) ? f : "all") as CustomerOrderFilter;

  const [rows, platformFeePercent] = await Promise.all([
    listOrdersForCustomer(user.id, filter),
    getPlatformFeePercent(),
  ]);

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/customer" },
          { label: "Мои заказы" },
        ]}
        title="Мои заказы"
        description="Карточка заказа открывается для всех ролей участников — статусы, чат и оплата в одном месте."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/customer/orders/new">Создать заказ</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/customer/orders" : `/customer/orders?filter=${f.key}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-medium">Номер</th>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Исполнитель</th>
              <th className="px-4 py-3 font-medium">Сумма заказа</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Дедлайн</th>
              <th className="px-4 py-3 font-medium">Обновлён</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-border/80 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/orders/${o.id}`} className="text-primary underline-offset-2 hover:underline">
                    {o.publicId}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.id}`} className="font-medium text-foreground hover:underline">
                    {o.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.executor?.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <OrderBudgetTableCell
                    budgetCents={o.budgetCents}
                    currency={o.currency}
                    feePercent={platformFeePercent}
                  />
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(o.deadlineAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(o.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-4">
            {filter === "all" ? (
              <CabinetEmptyState
                icon={ClipboardList}
                title="У вас ещё нет заказов"
                description="Создайте задачу с описанием и бюджетом — после модерации её увидят исполнители."
              >
                <Button size="sm" asChild>
                  <Link href="/customer/orders/new">Создать заказ</Link>
                </Button>
              </CabinetEmptyState>
            ) : (
              <p className="text-sm text-muted-foreground">В этой выборке пока нет заказов. Смените фильтр выше.</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium text-foreground">{o.title}</h2>
              <OrderStatusBadge status={o.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <OrderBudgetOneLine
                budgetCents={o.budgetCents}
                currency={o.currency}
                feePercent={platformFeePercent}
              />{" "}
              · {formatDateTime(o.deadlineAt)}
            </p>
          </Link>
        ))}
        {rows.length === 0 ? (
          filter === "all" ? (
            <CabinetEmptyState
              icon={ClipboardList}
              title="У вас ещё нет заказов"
              description="Создайте задачу — после модерации её увидят исполнители."
            >
              <Button size="sm" asChild>
                <Link href="/customer/orders/new">Создать заказ</Link>
              </Button>
            </CabinetEmptyState>
          ) : (
            <p className="text-sm text-muted-foreground">В этой выборке нет заказов.</p>
          )
        ) : null}
      </div>
    </div>
  );
}
