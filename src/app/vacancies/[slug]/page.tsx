import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { PublicPageNav } from "@/components/public/public-page-nav";
import { JobApplyForm } from "@/components/vacancies/job-apply-form";
import { breadcrumbJobVacancy } from "@/lib/public-breadcrumb-presets";
import { SITE_SEO_BRAND } from "@/lib/site-seo";
import { getPublishedJobVacancyBySlug } from "@/server/queries/job-vacancies";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getPublishedJobVacancyBySlug(params.slug);
  const canonical = `/vacancies/${params.slug}`;
  if (!v) {
    return {
      title: { absolute: "Вакансия не найдена · DONE48" },
      robots: { index: false, follow: true },
      alternates: { canonical },
    };
  }
  const title = `${v.title} · Вакансии · DONE48`;
  const description = v.summary?.slice(0, 160) ?? `${v.title} — вакансия на ${SITE_SEO_BRAND}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title: v.title,
      description,
      url: canonical,
      type: "article",
      siteName: SITE_SEO_BRAND,
      locale: "ru_RU",
    },
    twitter: {
      card: "summary",
      title: v.title,
      description,
    },
  };
}

export default async function VacancyDetailPage({ params }: Props) {
  const v = await getPublishedJobVacancyBySlug(params.slug);
  if (!v) notFound();

  const crumbs = breadcrumbJobVacancy(v.slug, v.title);
  const canApply = v.acceptingApplications;

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-12">
      <BreadcrumbJsonLd items={crumbs} />
      <div className="mx-auto max-w-3xl space-y-8 pb-16">
        <PublicPageNav
          extra={
            <Link
              href="/vacancies"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-[transform,box-shadow] hover:border-primary/35 hover:bg-muted/50"
            >
              Все вакансии
            </Link>
          }
        />

        <PublicBreadcrumbs items={crumbs} />

        <article>
          <header className="space-y-3">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{v.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {v.employmentType ? <span>{v.employmentType}</span> : null}
              {v.location ? <span>{v.location}</span> : null}
              {v.salaryHint ? <span>{v.salaryHint}</span> : null}
            </div>
            {!canApply ? (
              <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                Отклики на эту вакансию временно закрыты.
              </p>
            ) : null}
          </header>

          <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:text-foreground/90">
            <div className="whitespace-pre-wrap text-base">{v.description}</div>
          </div>
        </article>

        {canApply ? <JobApplyForm vacancySlug={v.slug} /> : null}
      </div>
    </div>
  );
}
