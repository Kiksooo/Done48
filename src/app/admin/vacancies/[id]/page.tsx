import { notFound } from "next/navigation";
import { JobApplicationsTable, type JobApplicationRow } from "@/components/admin/job-applications-table";
import { JobVacancyForm } from "@/components/admin/job-vacancy-form";
import { getJobVacancyForAdmin, listJobApplicationsForVacancy } from "@/server/queries/job-vacancies";

type Props = { params: { id: string } };

export default async function AdminVacancyEditPage({ params }: Props) {
  const vacancy = await getJobVacancyForAdmin(params.id);
  if (!vacancy) notFound();

  const applications = await listJobApplicationsForVacancy(vacancy.id);
  const appRows: JobApplicationRow[] = applications.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    coverLetter: a.coverLetter,
    resumeUrl: a.resumeUrl,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Редактирование вакансии</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {vacancy.published ? "Опубликована" : "Черновик"} · /vacancies/{vacancy.slug} · откликов:{" "}
          {vacancy._count.applications}
        </p>
      </div>
      <JobVacancyForm
        mode="edit"
        vacancyId={vacancy.id}
        initial={{
          title: vacancy.title,
          slug: vacancy.slug,
          summary: vacancy.summary ?? "",
          description: vacancy.description,
          employmentType: vacancy.employmentType ?? "",
          location: vacancy.location ?? "",
          salaryHint: vacancy.salaryHint ?? "",
          published: vacancy.published,
          acceptingApplications: vacancy.acceptingApplications,
        }}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Отклики</h2>
        <JobApplicationsTable applications={appRows} />
      </section>
    </div>
  );
}
