import { prisma } from "@/lib/db";

function logVacancyQueryError(context: string, err: unknown) {
  console.error(`[job-vacancies] ${context}`, err);
}

export async function listPublishedJobVacancies() {
  try {
    return await prisma.jobVacancy.findMany({
      where: {
        published: true,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        employmentType: true,
        location: true,
        salaryHint: true,
        publishedAt: true,
        acceptingApplications: true,
      },
    });
  } catch (e) {
    logVacancyQueryError("listPublishedJobVacancies", e);
    return [];
  }
}

export async function getPublishedJobVacancyBySlug(slug: string) {
  try {
    return await prisma.jobVacancy.findFirst({
      where: {
        slug,
        published: true,
        publishedAt: { not: null },
      },
    });
  } catch (e) {
    logVacancyQueryError("getPublishedJobVacancyBySlug", e);
    return null;
  }
}

export async function listJobVacanciesForAdmin() {
  try {
    return await prisma.jobVacancy.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { applications: true } },
      },
    });
  } catch (e) {
    logVacancyQueryError("listJobVacanciesForAdmin", e);
    return [];
  }
}

export async function getJobVacancyForAdmin(id: string) {
  try {
    return await prisma.jobVacancy.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
      },
    });
  } catch (e) {
    logVacancyQueryError("getJobVacancyForAdmin", e);
    return null;
  }
}

export async function listJobApplicationsForVacancy(vacancyId: string) {
  try {
    return await prisma.jobApplication.findMany({
      where: { vacancyId },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    logVacancyQueryError("listJobApplicationsForVacancy", e);
    return [];
  }
}

export async function listPublishedJobVacancySlugs() {
  try {
    return await prisma.jobVacancy.findMany({
      where: { published: true, publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch (e) {
    logVacancyQueryError("listPublishedJobVacancySlugs", e);
    return [];
  }
}
