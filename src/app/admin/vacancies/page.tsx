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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Вакансии</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Публичный раздел: /vacancies. Опубликованные вакансии видны на сайте; отклики приходят в карточку вакансии.
        </p>
      </div>
      <VacanciesAdminPanel rows={data} />
    </div>
  );
}
