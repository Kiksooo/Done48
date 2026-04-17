import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { PublicPageNav } from "@/components/public/public-page-nav";
import { JobApplyForm } from "@/components/vacancies/job-apply-form";
import { VacancyMetaChips } from "@/components/vacancies/vacancy-meta-chips";
import { breadcrumbJobVacancy } from "@/lib/public-breadcrumb-presets";
import { SITE_SEO_BRAND } from "@/lib/site-seo";
import { getPublishedJobVacancyBySlug } from "@/server/queries/job-vacancies";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-14">
      <BreadcrumbJsonLd items={crumbs} />
      <div className="mx-auto max-w-3xl space-y-10 pb-20">
        <PublicPageNav
          extra={
            <Link
              href="/vacancies"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/90 bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-[transform,box-shadow,background-color] hover:border-primary/35 hover:bg-muted/40 hover:shadow-md"
            >
              Все вакансии
            </Link>
          }
        />

        <PublicBreadcrumbs items={crumbs} />

        <article className="space-y-8">
          <header className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-normal text-muted-foreground">
                Вакансия
              </Badge>
              {canApply ? (
                <Badge variant="success">Открыт приём откликов</Badge>
              ) : (
                <Badge variant="secondary">Отклики закрыты</Badge>
              )}
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{v.title}</h1>
            <VacancyMetaChips
              employmentType={v.employmentType}
              location={v.location}
              salaryHint={v.salaryHint}
              size="lg"
              className="pt-0.5"
            />
            {!canApply ? (
              <div className="flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950 shadow-sm dark:border-amber-900/45 dark:bg-amber-950/35 dark:text-amber-50">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-200" aria-hidden />
                <p>
                  По этой позиции мы временно не принимаем новые отклики. Вы всё ещё можете ознакомиться с описанием —
                  или заглянуть в{" "}
                  <Link href="/vacancies" className="font-medium underline-offset-4 hover:underline">
                    список других вакансий
                  </Link>
                  .
                </p>
              </div>
            ) : null}
          </header>

          <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-muted/25 to-card p-6 shadow-sm ring-1 ring-border/40 sm:p-9">
            <div className="prose prose-neutral max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:text-foreground/90">
              <div className="whitespace-pre-wrap text-base leading-relaxed">{v.description}</div>
            </div>
          </div>
        </article>

        {canApply ? (
          <section className="space-y-3" aria-labelledby="apply-heading">
            <h2 id="apply-heading" className="sr-only">
              Форма отклика
            </h2>
            <JobApplyForm vacancySlug={v.slug} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
