import { AdminUserActionsCell } from "@/components/admin/admin-user-actions-cell";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/user-labels";
import { listUsersForAdmin } from "@/server/queries/users";

export default async function AdminUsersPage() {
  const users = await listUsersForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Пользователи</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Роль «Заказчик» / «Исполнитель» можно сменить, если нет незавершённых заказов и активных откликов в ожидании. После смены роли пользователю обычно нужно{" "}
          <span className="font-medium text-foreground">выйти и войти снова</span>, чтобы открылся нужный кабинет. Блокировка отключает вход. Удаление необратимо: снимаются заказы, где пользователь заказчик, и отклики исполнителя. Учётки администраторов не меняем и не удаляем.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2 font-medium">Почта</th>
              <th className="px-3 py-2 font-medium">Роль</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Онбординг</th>
              <th className="px-3 py-2 font-medium">Регистрация</th>
              <th className="px-3 py-2 font-medium min-w-[10rem]">Реферал</th>
              <th className="px-3 py-2 font-medium">Действие</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
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
                <td className="px-3 py-2 align-top text-neutral-700 dark:text-neutral-300">
                  {u.referredBySignup ? (
                    <div className="space-y-1">
                      <Badge variant="outline" className="border-primary/35 text-primary">
                        По ссылке
                      </Badge>
                      <p className="max-w-[14rem] text-xs leading-snug">
                        <span className="text-neutral-500 dark:text-neutral-500">от </span>
                        <span className="break-all font-medium text-foreground" title={u.referredBySignup.referrer.email}>
                          {u.referredBySignup.referrer.email}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <span className="text-neutral-400 dark:text-neutral-600">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <AdminUserActionsCell userId={u.id} email={u.email} role={u.role} isActive={u.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
