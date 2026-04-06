import { AdminDisputesPanel, type AdminDisputeRow } from "@/components/admin/admin-disputes-panel";
import { listDisputesForAdmin } from "@/server/queries/disputes";

export default async function AdminDisputesPage() {
  const raw = await listDisputesForAdmin();
  const rows: AdminDisputeRow[] = raw.map((d) => ({
    id: d.id,
    status: d.status,
    reason: d.reason,
    resolution: d.resolution,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    orderId: d.order.id,
    orderTitle: d.order.title,
    orderStatus: d.order.status,
    openedByEmail: d.openedBy.email,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Споры</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Заказчик и специалист могут открыть спор с карточки заказа. Статус заказа переходит в «Спор». Если вы
          ставите исход спора «В пользу заказчика», «В пользу специалиста», «Частичное» или «Закрыт», заказ в статусе
          «Спор» автоматически возвращается в «В работе» (история и чат пополняются записью).
        </p>
      </div>
      <AdminDisputesPanel rows={rows} />
    </div>
  );
}
