import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { PublicPageNav } from "@/components/public/public-page-nav";
import { BREADCRUMB_VACANCIES } from "@/lib/public-breadcrumb-presets";
import { REGISTER_HREF_EXECUTOR } from "@/lib/register-intent";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";
import { SITE_SEO_BRAND, SITE_SEO_TITLE_TEMPLATE } from "@/lib/site-seo";
import { listPublishedJobVacancies } from "@/server/queries/job-vacancies";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ogTitle = SITE_SEO_TITLE_TEMPLATE.replace("%s", "Вакансии");
const description =
  "Вакансии команды DONE48: открытые роли, условия и отклик на сайте. Отдельно — работа специалистом на площадке.";

export const metadata: Metadata = {
  title: "Вакансии",
  description,
  alternates: { canonical: "/vacancies" },
  openGraph: {
    title: ogTitle,
    description,
    url: "/vacancies",
    type: "website",
    siteName: SITE_SEO_BRAND,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary",
    title: ogTitle,
    description,
  },
};

export default async function VacanciesPage() {
  const vacancies = await listPublishedJobVacancies();

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-12">
      <BreadcrumbJsonLd items={BREADCRUMB_VACANCIES} />
      <div className="mx-auto max-w-3xl space-y-8 pb-16">
        <PublicPageNav />

        <PublicBreadcrumbs items={BREADCRUMB_VACANCIES} />

        <header className="space-y-3">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Вакансии</h1>
          <p className="text-lg text-muted-foreground">
            Команда {SITE_SEO_BRAND}: открытые роли в продукте и операциях. Ниже — опубликованные вакансии с возможностью
            отклика на сайте.
          </p>
        </header>

        {vacancies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-muted-foreground">
              Сейчас нет опубликованных вакансий в штате. Напишите на{" "}
              <a href={`mailto:${SITE_EMAIL_INFO}`} className="font-medium text-primary underline-offset-4 hover:underline">
                {SITE_EMAIL_INFO}
              </a>
              , если хотите обсудить сотрудничество.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {vacancies.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/vacancies/${v.slug}`}
                  className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">{v.title}</h2>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {v.employmentType ? <span>{v.employmentType}</span> : null}
                        {v.location ? <span>{v.location}</span> : null}
                        {v.salaryHint ? <span>{v.salaryHint}</span> : null}
                      </div>
                      {v.summary ? (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{v.summary}</p>
                      ) : null}
                    </div>
                    <span
                      className={
                        v.acceptingApplications
                          ? "shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300"
                          : "shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {v.acceptingApplications ? "Приём откликов" : "Без откликов"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Ищете заказы как специалист?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Это не штат: регистрируйтесь как исполнитель, оформляйте профиль и откликайтесь на задачи заказчиков на
            площадке.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={REGISTER_HREF_EXECUTOR}>Регистрация как специалист</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/executors">Каталог специалистов</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
