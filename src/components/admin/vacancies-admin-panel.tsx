"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteJobVacancyAction,
  toggleJobVacancyAcceptingAction,
  toggleJobVacancyPublishedAction,
} from "@/server/actions/job-vacancies";
import { Button } from "@/components/ui/button";

export type JobVacancyAdminRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  acceptingApplications: boolean;
  publishedAt: string | null;
  updatedAt: string;
  applicationsCount: number;
};

export function VacanciesAdminPanel({ rows }: { rows: JobVacancyAdminRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMsg(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) setMsg(r.error ?? "Ошибка");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length === 0 ? "Нет вакансий" : `${rows.length} записей`}
        </p>
        <Button asChild>
          <Link href="/admin/vacancies/new">Новая вакансия</Link>
        </Button>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Отклики</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/vacancies/${v.id}`} className="text-primary hover:underline">
                      {v.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={
                          v.published
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-300"
                        }
                      >
                        {v.published ? "Опубликована" : "Черновик"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Приём: {v.acceptingApplications ? "да" : "нет"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{v.applicationsCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => toggleJobVacancyPublishedAction(v.id))}
                      >
                        {v.published ? "Снять" : "Опублик."}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => toggleJobVacancyAcceptingAction(v.id))}
                      >
                        {v.acceptingApplications ? "Стоп отклики" : "Отклики вкл."}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          if (!confirm("Удалить вакансию и все отклики?")) return;
                          run(() => deleteJobVacancyAction(v.id));
                        }}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
