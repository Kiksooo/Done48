import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { PublicPageNav } from "@/components/public/public-page-nav";
import { Button } from "@/components/ui/button";
import { SITE_SEO_BRAND, SITE_SEO_TITLE_TEMPLATE } from "@/lib/site-seo";
import { cn } from "@/lib/utils";
import {
  countPublicExecutors,
  listPublicExecutorCities,
  listPublicExecutors,
  type PublicExecutorListFilters,
} from "@/server/queries/public-executor";
import { getReviewStatsForUsers } from "@/server/queries/reviews";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const catalogOgTitle = SITE_SEO_TITLE_TEMPLATE.replace("%s", "Каталог специалистов");
const catalogDescription =
  "Каталог проверенных специалистов DONE48 с портфолио и отзывами. Найдите профессионала для любой задачи.";

export const metadata: Metadata = {
  title: "Специалисты",
  description: catalogDescription,
  alternates: { canonical: "/executors" },
  openGraph: {
    title: catalogOgTitle,
    description: catalogDescription,
    url: "/executors",
    type: "website",
    siteName: SITE_SEO_BRAND,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: catalogOgTitle,
    description: catalogDescription,
  },
};

type Props = {
  searchParams: { page?: string; q?: string; city?: string };
};

const fieldClass =
  "h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-ring/30";

function buildCatalogHref(page: number, filters: PublicExecutorListFilters) {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  const city = filters.city?.trim();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/executors?${s}` : "/executors";
}

export default async function SpecialistsPage({ searchParams }: Props) {
  const pageRaw = searchParams.page ?? "1";
  const pageNum = Math.max(1, parseInt(pageRaw, 10) || 1);

  const listFilters: PublicExecutorListFilters = {
    q: searchParams.q,
    city: searchParams.city,
  };

  const [total, cities] = await Promise.all([
    countPublicExecutors(listFilters),
    listPublicExecutorCities(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageNum, totalPages);

  const specialists = await listPublicExecutors({
    ...listFilters,
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const reviewStats = await getReviewStatsForUsers(specialists.map((s) => s.id));

  const qValue = listFilters.q?.trim() ?? "";
  const cityValue = listFilters.city?.trim() ?? "";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-8 pb-16">
        <PublicPageNav />

        <header className="space-y-5">
          <div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Каталог специалистов
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Проверенные профессионалы с портфолио и отзывами
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-elevated sm:p-6">
            <form
              method="get"
              className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
              action="/executors"
              role="search"
              aria-label="Поиск специалистов"
            >
              <label className="block min-w-0 flex-1 sm:max-w-md">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Поиск</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={qValue}
                  placeholder="Имя, @ник, навык или город"
                  className={fieldClass}
                />
              </label>
              <label className="block w-full sm:w-56">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Город</span>
                <select name="city" defaultValue={cityValue} className={cn(fieldClass, "cursor-pointer")}>
                  <option value="">Все города</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 sm:pb-0.5">
                <Button type="submit" size="lg" className="min-w-[7rem] rounded-xl">
                  Найти
                </Button>
                {qValue || cityValue ? (
                  <Button variant="outline" size="lg" className="rounded-xl" asChild>
                    <Link href="/executors">Сбросить</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </div>

          {total > 0 ? (
            <p className="text-sm text-muted-foreground">
              {total === 1
                ? "Найден 1 специалист"
                : `Найдено ${total} специалистов`}
              {totalPages > 1 ? (
                <>
                  {" "}· страница{" "}
                  <span className="font-medium text-foreground">
                    {page} из {totalPages}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </header>

        <section aria-label="Специалисты">
          {specialists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <p className="text-4xl" aria-hidden>
                🔍
              </p>
              <p className="mt-4 text-lg font-medium text-foreground">
                {qValue || cityValue ? "Никого не нашли" : "Пока никого в каталоге"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {qValue || cityValue
                  ? "Попробуйте другие слова или сбросьте фильтры."
                  : "Загляните позже — список обновляется."}
              </p>
              {qValue || cityValue ? (
                <Button variant="secondary" className="mt-6 rounded-xl" asChild>
                  <Link href="/executors">Показать всех</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {specialists.map((specialist) => {
                const p = specialist.executorProfile;
                if (!p?.username) return null;
                const name = p.displayName ?? p.username;
                const stats = reviewStats.get(specialist.id);
                const hasPortfolio = specialist.portfolioItems.length > 0;

                return (
                  <Link
                    key={specialist.id}
                    href={`/u/${p.username}`}
                    className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
                  >
                    {hasPortfolio ? (
                      <div className="relative grid h-40 grid-cols-2 gap-0.5 overflow-hidden bg-muted sm:h-44">
                        {specialist.portfolioItems.slice(0, 4).map((item, idx) => (
                          <div
                            key={item.id}
                            className={cn(
                              "overflow-hidden bg-muted",
                              specialist.portfolioItems.length === 1 && "col-span-2 row-span-2",
                              specialist.portfolioItems.length === 3 && idx === 0 && "row-span-2",
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl!}
                              alt={item.title ?? `Работа ${idx + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        ))}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card/80 to-transparent" />
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 sm:h-36">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}

                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground ring-2 ring-primary/10">
                          {p.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {name}
                          </h2>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            @{p.username}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {stats && stats.count > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            <Star className="h-3 w-3 fill-current" aria-hidden />
                            {stats.avg?.toFixed(1) ?? "—"}
                            <span className="text-amber-600/70 dark:text-amber-400/70">
                              · {stats.count} {stats.count === 1 ? "отзыв" : stats.count < 5 ? "отзыва" : "отзывов"}
                            </span>
                          </span>
                        ) : null}
                        {p.city ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" aria-hidden />
                            {p.city}
                          </span>
                        ) : null}
                        {hasPortfolio ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {specialist.portfolioItems.length} {specialist.portfolioItems.length === 1 ? "работа" : specialist.portfolioItems.length < 5 ? "работы" : "работ"}
                          </span>
                        ) : null}
                      </div>

                      {p.bio ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {p.bio}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {totalPages > 1 ? (
          <nav
            className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8"
            aria-label="Страницы каталога"
          >
            {page > 1 ? (
              <Button variant="outline" size="lg" className="rounded-xl" asChild>
                <Link href={buildCatalogHref(page - 1, listFilters)}>← Предыдущая</Link>
              </Button>
            ) : (
              <span className="min-h-11 inline-flex items-center text-sm text-muted-foreground">← Предыдущая</span>
            )}
            {page < totalPages ? (
              <Button variant="outline" size="lg" className="rounded-xl" asChild>
                <Link href={buildCatalogHref(page + 1, listFilters)}>Следующая →</Link>
              </Button>
            ) : (
              <span className="min-h-11 inline-flex items-center text-sm text-muted-foreground">Следующая →</span>
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
