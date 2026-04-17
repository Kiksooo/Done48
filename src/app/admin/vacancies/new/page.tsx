import { JobVacancyForm } from "@/components/admin/job-vacancy-form";

export default function AdminVacancyNewPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Новая вакансия</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Заполните поля по блокам — можно сохранить черновиком и вернуться позже. Адрес страницы задаётся полем slug;
          его лучше не менять после публикации.
        </p>
      </div>
      <JobVacancyForm mode="create" />
    </div>
  );
}
