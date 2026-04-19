import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ChevronRight, Sparkles } from "lucide-react";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { PublicPageNav } from "@/components/public/public-page-nav";
import { VacancyMetaChips } from "@/components/vacancies/vacancy-meta-chips";
import { BREADCRUMB_VACANCIES } from "@/lib/public-breadcrumb-presets";
import { REGISTER_HREF_EXECUTOR } from "@/lib/register-intent";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";
import { SITE_SEO_BRAND, SITE_SEO_TITLE_TEMPLATE } from "@/lib/site-seo";
import { listPublishedJobVacancies } from "@/server/queries/job-vacancies";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background px-4 py-10 sm:px-6 sm:py-14">
      <BreadcrumbJsonLd items={BREADCRUMB_VACANCIES} />
      <div className="mx-auto max-w-3xl space-y-10 pb-20">
        <PublicPageNav />

        <PublicBreadcrumbs items={BREADCRUMB_VACANCIES} />

        <header className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-8 shadow-sm ring-1 ring-border/50 sm:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              <Briefcase className="size-3.5 text-primary" aria-hidden />
              Команда {SITE_SEO_BRAND}
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Вакансии
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Открытые роли в продукте и операциях. Ниже — актуальные позиции: можно почитать условия и откликнуться
              прямо здесь — без лишних шагов.
            </p>
          </div>
        </header>

        {vacancies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/90 bg-muted/15 px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <Sparkles className="size-7" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
              Сейчас у нас нет опубликованных вакансий в штате — но мы всегда рады знакомству. Напишите на{" "}
              <a
                href={`mailto:${SITE_EMAIL_INFO}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {SITE_EMAIL_INFO}
              </a>
              , если хотите обсудить сотрудничество.
            </p>
          </div>
        ) : (
          <section className="space-y-4" aria-labelledby="vacancies-list-heading">
            <div className="flex items-end justify-between gap-4 px-0.5">
              <h2 id="vacancies-list-heading" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Открытые позиции · {vacancies.length}
              </h2>
            </div>
            <ul className="space-y-3">
              {vacancies.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/vacancies/${v.slug}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:ring-primary/10 sm:flex-row sm:items-start sm:justify-between sm:p-6"
                  >
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-start gap-2 gap-y-2">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary sm:text-xl">
                          {v.title}
                        </h3>
                        <Badge variant={v.acceptingApplications ? "success" : "secondary"} className="shrink-0">
                          {v.acceptingApplications ? "Принимаем отклики" : "Без откликов"}
                        </Badge>
                      </div>
                      <VacancyMetaChips
                        employmentType={v.employmentType}
                        location={v.location}
                        salaryHint={v.salaryHint}
                      />
                      {v.summary ? (
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{v.summary}</p>
                      ) : null}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 self-end text-sm font-medium text-primary sm:self-center sm:pl-2">
                      Подробнее
                      <ChevronRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="relative overflow-hidden rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-muted/30 p-8 shadow-sm sm:p-10">
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Ищете проекты как специалист?
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Это другой формат: регистрация как исполнитель, профиль на площадке и отклики на задачи заказчиков — без
              оформления в штат.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link href={REGISTER_HREF_EXECUTOR}>Стать специалистом</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/executors">Каталог специалистов</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
