import Link from "next/link";
import {
  AdminModerationPanel,
  type BlocklistRow,
  type ModerationReportRow,
} from "@/components/admin/admin-moderation-panel";
import { listContactBlocklistForAdmin, listUserReportsForAdmin } from "@/server/queries/trust";

export default async function AdminModerationPage() {
  const [reportsRaw, blockRaw] = await Promise.all([
    listUserReportsForAdmin(),
    listContactBlocklistForAdmin(),
  ]);

  const sorted = [...reportsRaw].sort((a, b) => {
    const w = (s: (typeof a)["status"]) => (s === "OPEN" ? 0 : s === "IN_REVIEW" ? 1 : 2);
    const d = w(a.status) - w(b.status);
    if (d !== 0) return d;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const reports: ModerationReportRow[] = sorted.map((r) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    status: r.status,
    adminNote: r.adminNote,
    createdAt: r.createdAt.toISOString(),
    reporterEmail: r.reporter.email,
    targetUserId: r.targetUser.id,
    targetEmail: r.targetUser.email,
    targetActive: r.targetUser.isActive,
    orderId: r.order?.id ?? null,
    orderTitle: r.order?.title ?? null,
  }));

  const blocklist: BlocklistRow[] = blockRaw.map((b) => ({
    id: b.id,
    kind: b.kind,
    valueNorm: b.valueNorm,
    reason: b.reason,
    createdAt: b.createdAt.toISOString(),
    createdByEmail: b.createdBy?.email ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Модерация и блоклист</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Жалобы пользователей по заказам, смена статуса обращения, блокировка контрагента и запрет контактов (email /
          телефон / Telegram) при регистрации и в профиле. Управление статусом анкеты исполнителя (в т. ч. «Активен» для
          откликов) — в разделе{" "}
          <Link href="/admin/executors" className="font-medium text-primary underline underline-offset-2">
            Исполнители
          </Link>
          .
        </p>
      </div>
      <AdminModerationPanel reports={reports} blocklist={blocklist} />
    </div>
  );
}
