"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserForAction, type SessionUser } from "@/lib/rbac";
import { jobVacancySchema, type JobVacancyInput } from "@/schemas/job-vacancy";

function ensureAdmin(user: SessionUser | null): SessionUser {
  if (!user || user.role !== Role.ADMIN) {
    throw new Error("Доступ запрещён");
  }
  return user;
}

export async function createJobVacancyAction(input: JobVacancyInput) {
  ensureAdmin(await getSessionUserForAction());
  const parsed = jobVacancySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }
  const data = parsed.data;
  const existing = await prisma.jobVacancy.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { ok: false as const, error: "Slug уже занят — выберите другой" };
  }

  const row = await prisma.jobVacancy.create({
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary || null,
      description: data.description,
      employmentType: data.employmentType || null,
      location: data.location || null,
      salaryHint: data.salaryHint || null,
      published: data.published,
      publishedAt: data.published ? new Date() : null,
      acceptingApplications: data.acceptingApplications,
    },
  });

  revalidatePath("/admin/vacancies");
  revalidatePath("/vacancies");
  revalidatePath(`/vacancies/${row.slug}`);
  return { ok: true as const, id: row.id };
}

export async function updateJobVacancyAction(id: string, input: JobVacancyInput) {
  ensureAdmin(await getSessionUserForAction());
  const parsed = jobVacancySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }
  const data = parsed.data;
  const existing = await prisma.jobVacancy.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, error: "Вакансия не найдена" };
  }
  const slugConflict = await prisma.jobVacancy.findFirst({
    where: { slug: data.slug, id: { not: id } },
  });
  if (slugConflict) {
    return { ok: false as const, error: "Slug уже занят другой вакансией" };
  }

  const wasPublished = existing.published;
  await prisma.jobVacancy.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary || null,
      description: data.description,
      employmentType: data.employmentType || null,
      location: data.location || null,
      salaryHint: data.salaryHint || null,
      published: data.published,
      publishedAt: data.published && !wasPublished ? new Date() : existing.publishedAt,
      acceptingApplications: data.acceptingApplications,
    },
  });

  revalidatePath("/admin/vacancies");
  revalidatePath("/vacancies");
  revalidatePath(`/vacancies/${existing.slug}`);
  revalidatePath(`/vacancies/${data.slug}`);
  return { ok: true as const };
}

export async function deleteJobVacancyAction(id: string) {
  ensureAdmin(await getSessionUserForAction());
  const row = await prisma.jobVacancy.findUnique({ where: { id } });
  if (!row) return { ok: false as const, error: "Вакансия не найдена" };
  await prisma.jobVacancy.delete({ where: { id } });
  revalidatePath("/admin/vacancies");
  revalidatePath("/vacancies");
  revalidatePath(`/vacancies/${row.slug}`);
  return { ok: true as const };
}

export async function toggleJobVacancyPublishedAction(id: string) {
  ensureAdmin(await getSessionUserForAction());
  const row = await prisma.jobVacancy.findUnique({ where: { id } });
  if (!row) return { ok: false as const, error: "Вакансия не найдена" };
  const newPublished = !row.published;
  await prisma.jobVacancy.update({
    where: { id },
    data: {
      published: newPublished,
      publishedAt: newPublished && !row.publishedAt ? new Date() : row.publishedAt,
    },
  });
  revalidatePath("/admin/vacancies");
  revalidatePath("/vacancies");
  revalidatePath(`/vacancies/${row.slug}`);
  return { ok: true as const };
}

export async function toggleJobVacancyAcceptingAction(id: string) {
  ensureAdmin(await getSessionUserForAction());
  const row = await prisma.jobVacancy.findUnique({ where: { id } });
  if (!row) return { ok: false as const, error: "Вакансия не найдена" };
  await prisma.jobVacancy.update({
    where: { id },
    data: { acceptingApplications: !row.acceptingApplications },
  });
  revalidatePath("/admin/vacancies");
  revalidatePath(`/vacancies/${row.slug}`);
  revalidatePath("/vacancies");
  return { ok: true as const };
}
