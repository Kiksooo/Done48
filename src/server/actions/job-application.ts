"use server";

import { revalidatePath } from "next/cache";
import { JobApplicationStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserForAction, type SessionUser } from "@/lib/rbac";
import { jobApplicationPublicSchema, type JobApplicationPublicInput } from "@/schemas/job-application";

function ensureAdmin(user: SessionUser | null): SessionUser {
  if (!user || user.role !== Role.ADMIN) {
    throw new Error("Доступ запрещён");
  }
  return user;
}

export async function submitJobApplicationAction(vacancySlug: string, input: JobApplicationPublicInput) {
  const parsed = jobApplicationPublicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }
  const data = parsed.data;
  const vacancy = await prisma.jobVacancy.findFirst({
    where: {
      slug: vacancySlug,
      published: true,
      publishedAt: { not: null },
      acceptingApplications: true,
    },
  });
  if (!vacancy) {
    return { ok: false as const, error: "Вакансия недоступна для откликов" };
  }

  await prisma.jobApplication.create({
    data: {
      vacancyId: vacancy.id,
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      coverLetter: data.coverLetter.trim(),
      resumeUrl: data.resumeUrl?.trim() || null,
      status: JobApplicationStatus.NEW,
    },
  });

  revalidatePath("/admin/vacancies");
  revalidatePath(`/admin/vacancies/${vacancy.id}`);
  revalidatePath(`/vacancies/${vacancy.slug}`);
  return { ok: true as const };
}

export async function updateJobApplicationStatusAction(
  applicationId: string,
  status: JobApplicationStatus,
) {
  ensureAdmin(await getSessionUserForAction());
  const allowed = new Set<JobApplicationStatus>([
    JobApplicationStatus.NEW,
    JobApplicationStatus.REVIEWED,
    JobApplicationStatus.REJECTED,
    JobApplicationStatus.INVITED,
  ]);
  if (!allowed.has(status)) {
    return { ok: false as const, error: "Недопустимый статус" };
  }
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { vacancy: { select: { id: true, slug: true } } },
  });
  if (!app) return { ok: false as const, error: "Отклик не найден" };

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });

  revalidatePath(`/admin/vacancies/${app.vacancyId}`);
  revalidatePath(`/vacancies/${app.vacancy.slug}`);
  return { ok: true as const };
}
