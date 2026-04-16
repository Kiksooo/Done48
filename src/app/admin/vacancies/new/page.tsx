import { JobVacancyForm } from "@/components/admin/job-vacancy-form";

export default function AdminVacancyNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Новая вакансия</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Заполните описание и при необходимости опубликуйте. Slug формирует URL на сайте.
        </p>
      </div>
      <JobVacancyForm mode="create" />
    </div>
  );
}
