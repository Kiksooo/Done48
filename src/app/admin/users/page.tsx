import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { listUsersForAdmin } from "@/server/queries/users";

export default async function AdminUsersPage() {
  const users = await listUsersForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Пользователи</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Список учётных записей (управление ролями — следующий шаг)
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Роль</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Онбординг</th>
              <th className="px-3 py-2 font-medium">Регистрация</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{u.role}</Badge>
                </td>
                <td className="px-3 py-2">
                  {u.isActive ? (
                    <Badge variant="success">Активен</Badge>
                  ) : (
                    <Badge variant="danger">Заблокирован</Badge>
                  )}
                </td>
                <td className="px-3 py-2">{u.onboardingDone ? "Да" : "Нет"}</td>
                <td className="px-3 py-2 text-neutral-600">{formatDateTime(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
