import { VacanciesAdminPanel, type JobVacancyAdminRow } from "@/components/admin/vacancies-admin-panel";
import { listJobVacanciesForAdmin } from "@/server/queries/job-vacancies";

export default async function AdminVacanciesPage() {
  const rows = await listJobVacanciesForAdmin();
  const data: JobVacancyAdminRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    published: r.published,
    acceptingApplications: r.acceptingApplications,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
    applicationsCount: r._count.applications,
  }));

  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Вакансии</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Раздел на сайте: <span className="font-mono text-foreground/90">/vacancies</span>. Опубликованные позиции
          видят кандидаты; отклики сохраняются в карточке каждой вакансии — удобно вести переписку с одного места.
        </p>
      </div>
      <VacanciesAdminPanel rows={data} />
    </div>
  );
}
