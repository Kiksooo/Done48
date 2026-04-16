"use client";

import { JobApplicationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateJobApplicationStatusAction } from "@/server/actions/job-application";
import { formatDateTime } from "@/lib/format";

export type JobApplicationRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  coverLetter: string;
  resumeUrl: string | null;
  status: JobApplicationStatus;
  createdAt: string;
};

const STATUS_OPTIONS: { value: JobApplicationStatus; label: string }[] = [
  { value: JobApplicationStatus.NEW, label: "Новый" },
  { value: JobApplicationStatus.REVIEWED, label: "Просмотрен" },
  { value: JobApplicationStatus.INVITED, label: "Приглашён" },
  { value: JobApplicationStatus.REJECTED, label: "Отказ" },
];

export function JobApplicationsTable({ applications }: { applications: JobApplicationRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function setStatus(id: string, status: JobApplicationStatus) {
    setMsg(null);
    startTransition(async () => {
      const r = await updateJobApplicationStatusAction(id, status);
      if (!r.ok) setMsg(r.error ?? "Ошибка");
      router.refresh();
    });
  }

  if (applications.length === 0) {
    return <p className="text-sm text-muted-foreground">Пока нет откликов.</p>;
  }

  return (
    <div className="space-y-3">
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Дата</th>
              <th className="px-3 py-2 font-medium">Кандидат</th>
              <th className="px-3 py-2 font-medium">Контакты</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Сопроводительное</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {formatDateTime(new Date(a.createdAt))}
                </td>
                <td className="px-3 py-2 font-medium">{a.fullName}</td>
                <td className="px-3 py-2">
                  <div className="space-y-1 text-xs">
                    <a href={`mailto:${a.email}`} className="text-primary underline-offset-2 hover:underline">
                      {a.email}
                    </a>
                    {a.phone ? <p className="text-muted-foreground">{a.phone}</p> : null}
                    {a.resumeUrl ? (
                      <a
                        href={a.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-primary underline-offset-2 hover:underline"
                      >
                        Резюме / ссылка
                      </a>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={a.status}
                    disabled={pending}
                    onChange={(e) => setStatus(a.id, e.target.value as JobApplicationStatus)}
                    aria-label={`Статус отклика ${a.fullName}`}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 max-w-md">
                  <p className="line-clamp-6 whitespace-pre-wrap text-xs text-muted-foreground">{a.coverLetter}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
