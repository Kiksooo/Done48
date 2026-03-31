import {
  AdminExecutorProfilesPanel,
  type ExecutorProfileAdminRow,
} from "@/components/admin/admin-executor-profiles-panel";
import { listExecutorProfilesForAdmin } from "@/server/queries/admin-executor-profiles";

export default async function AdminExecutorsPage() {
  const profiles = await listExecutorProfilesForAdmin();

  const rows: ExecutorProfileAdminRow[] = profiles.map((p) => ({
    userId: p.userId,
    email: p.user.email,
    isActive: p.user.isActive,
    displayName: p.displayName,
    username: p.username,
    city: p.city,
    accountStatus: p.accountStatus,
    verificationStatus: p.verificationStatus,
    userCreatedAt: p.user.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Исполнители</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Модерация анкет: статус <strong className="font-medium text-neutral-800 dark:text-neutral-200">«Активен»</strong> нужен,
          чтобы исполнитель мог откликаться на заказы (дополнительно может требоваться верификация по документам — см. колонку
          «Верификация» и настройки площадки). Раздел «Модерация» в меню — это жалобы и блоклист контактов, не анкеты.
        </p>
      </div>
      <AdminExecutorProfilesPanel rows={rows} />
    </div>
  );
}
