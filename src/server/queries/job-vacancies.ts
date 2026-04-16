import { prisma } from "@/lib/db";

export async function listPublishedJobVacancies() {
  return prisma.jobVacancy.findMany({
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
}

export async function getPublishedJobVacancyBySlug(slug: string) {
  return prisma.jobVacancy.findFirst({
    where: {
      slug,
      published: true,
      publishedAt: { not: null },
    },
  });
}

export async function listJobVacanciesForAdmin() {
  return prisma.jobVacancy.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  });
}

export async function getJobVacancyForAdmin(id: string) {
  return prisma.jobVacancy.findUnique({
    where: { id },
    include: {
      _count: { select: { applications: true } },
    },
  });
}

export async function listJobApplicationsForVacancy(vacancyId: string) {
  return prisma.jobApplication.findMany({
    where: { vacancyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPublishedJobVacancySlugs() {
  return prisma.jobVacancy.findMany({
    where: { published: true, publishedAt: { not: null } },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });
}
