"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Briefcase, Plus } from "lucide-react";
import {
  deleteJobVacancyAction,
  toggleJobVacancyAcceptingAction,
  toggleJobVacancyPublishedAction,
} from "@/server/actions/job-vacancies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function vacancyCountLabel(n: number): string {
  const m = n % 100;
  if (m >= 11 && m <= 14) return `${n} вакансий`;
  const k = n % 10;
  if (k === 1) return `${n} вакансия`;
  if (k >= 2 && k <= 4) return `${n} вакансии`;
  return `${n} вакансий`;
}

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
    <div className="space-y-6">
      {msg ? (
        <p className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-950 dark:border-red-900/45 dark:bg-red-950/35 dark:text-red-50" role="alert">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? "Пока нет ни одной записи — создайте первую вакансию."
            : `${vacancyCountLabel(rows.length)} в списке`}
        </p>
        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/vacancies/new">
            <Plus className="size-4" aria-hidden />
            Новая вакансия
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="overflow-hidden rounded-2xl border-dashed border-border/90 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Briefcase className="size-7" strokeWidth={1.5} aria-hidden />
            </div>
            <div className="max-w-md space-y-2">
              <p className="font-medium text-foreground">Список пуст</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Создайте вакансию — заполните описание, при желании оставьте черновиком и опубликуйте, когда будете
                готовы показать её на сайте.
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/vacancies/new">Создать вакансию</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-border/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Название</th>
                  <th className="px-5 py-3.5">Slug</th>
                  <th className="px-5 py-3.5">Статус</th>
                  <th className="px-5 py-3.5">Отклики</th>
                  <th className="px-5 py-3.5">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {rows.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-muted/25">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/vacancies/${v.id}`}
                        className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {v.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{v.slug}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge variant={v.published ? "success" : "warning"} className="w-fit font-normal">
                          {v.published ? "На сайте" : "Черновик"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Отклики: {v.acceptingApplications ? "открыты" : "закрыты"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-foreground">{v.applicationsCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => run(() => toggleJobVacancyPublishedAction(v.id))}
                        >
                          {v.published ? "Снять с сайта" : "Опубликовать"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => run(() => toggleJobVacancyAcceptingAction(v.id))}
                        >
                          {v.acceptingApplications ? "Закрыть отклики" : "Открыть отклики"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            if (!confirm("Удалить вакансию и все отклики? Это действие нельзя отменить.")) return;
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
        </div>
      )}
    </div>
  );
}
