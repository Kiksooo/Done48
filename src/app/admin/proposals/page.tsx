import {
  AdminProposalsPanel,
  type AdminProposalListRow,
} from "@/components/admin/admin-proposals-panel";
import {
  listPendingProposalsForAdmin,
  listRecentResolvedProposalsForAdmin,
} from "@/server/queries/proposals";

function toRow(
  p: Awaited<ReturnType<typeof listPendingProposalsForAdmin>>[number],
): AdminProposalListRow {
  return {
    id: p.id,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    offeredCents: p.offeredCents,
    offeredDays: p.offeredDays,
    message: p.message,
    executorEmail: p.executor.email,
    orderId: p.order.id,
    orderTitle: p.order.title,
    orderStatus: p.order.status,
    visibilityType: p.order.visibilityType,
    orderExecutorId: p.order.executorId,
    customerEmail: p.order.customer.email,
  };
}

export default async function AdminProposalsPage() {
  const [pending, resolved] = await Promise.all([
    listPendingProposalsForAdmin(),
    listRecentResolvedProposalsForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Отклики исполнителей</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Принятие отклика доступно только для заказов в статусе «Опубликован» с открытыми откликами и без
          назначенного исполнителя — как на карточке заказа.
        </p>
      </div>
      <AdminProposalsPanel
        pending={pending.map(toRow)}
        resolved={resolved.map(toRow)}
      />
    </div>
  );
}
