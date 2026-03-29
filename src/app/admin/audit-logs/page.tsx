import { formatDateTime } from "@/lib/format";
import { listAuditLogsForAdmin } from "@/server/queries/audit";

export default async function AdminAuditLogsPage() {
  const rows = await listAuditLogsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Журнал аудита</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Настройки, споры, портфолио, профили, категории, ключевые действия админа с заказами (публикация, назначение,
          смена статуса, принятие отклика).
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2 font-medium">Когда</th>
              <th className="px-3 py-2 font-medium">Действие</th>
              <th className="px-3 py-2 font-medium">Сущность</th>
              <th className="px-3 py-2 font-medium">Кто</th>
              <th className="px-3 py-2 font-medium">Данные</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-neutral-500">
                  Записей пока нет.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-3 py-2">
                    <span className="text-neutral-800 dark:text-neutral-200">{r.entityType}</span>
                    {r.entityId ? (
                      <span className="ml-1 font-mono text-xs text-neutral-500">{r.entityId}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{r.actor?.email ?? "—"}</td>
                  <td className="max-w-md px-3 py-2 font-mono text-xs text-neutral-600">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify({ old: r.oldValue, new: r.newValue }, null, 0)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
