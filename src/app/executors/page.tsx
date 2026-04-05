import type { Metadata } from "next";
import Link from "next/link";
import { MovingGalleryMarquee } from "@/components/executors/moving-gallery-marquee";
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

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const executorsOgTitle = SITE_SEO_TITLE_TEMPLATE.replace("%s", "Галерея работ");
const executorsDescription =
  "Галерея одобренных работ исполнителей DONE48. Откройте профиль по @нику в системе.";

export const metadata: Metadata = {
  title: "Исполнители",
  description: executorsDescription,
  alternates: { canonical: "/executors" },
  openGraph: {
    title: executorsOgTitle,
    description: executorsDescription,
    url: "/executors",
    type: "website",
    siteName: SITE_SEO_BRAND,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: executorsOgTitle,
    description: executorsDescription,
  },
};

type Props = {
  searchParams: { page?: string; q?: string; city?: string };
};

const fieldClass =
  "h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-ring/30";

function buildExecutorsHref(page: number, filters: PublicExecutorListFilters) {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  const city = filters.city?.trim();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/executors?${s}` : "/executors";
}

export default async function ExecutorsPage({ searchParams }: Props) {
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

  const executorsPaged = await listPublicExecutors({
    ...listFilters,
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const qValue = listFilters.q?.trim() ?? "";
  const cityValue = listFilters.city?.trim() ?? "";

  const movingGalleryCards = executorsPaged.flatMap((u) => {
    const username = u.executorProfile?.username;
    if (!username) return [];
    return [
      {
        id: u.id,
        username,
        portfolioItems: u.portfolioItems,
      },
    ];
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-10 pb-16">
        <PublicPageNav />

        <header className="space-y-5">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Исполнители
          </h1>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-elevated sm:p-6">
            <form
              method="get"
              className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
              action="/executors"
              role="search"
              aria-label="Поиск исполнителей"
            >
              <label className="block min-w-0 flex-1 sm:max-w-md">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Поиск</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={qValue}
                  placeholder="@ник, имя или город"
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
              Показано <span className="font-medium text-foreground">{executorsPaged.length}</span> из{" "}
              <span className="font-medium text-foreground">{total}</span>
              {totalPages > 1 ? (
                <>
                  {" "}
                  · страница{" "}
                  <span className="font-medium text-foreground">
                    {page} из {totalPages}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </header>

        <section id="gallery" aria-label="Галерея работ" className="scroll-mt-28">
          {executorsPaged.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <p className="text-lg" aria-hidden>
                🔍
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
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
            <MovingGalleryMarquee cards={movingGalleryCards} fillViewport />
          )}
        </section>

        {totalPages > 1 ? (
          <nav
            className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8"
            aria-label="Страницы каталога"
          >
            {page > 1 ? (
              <Button variant="outline" size="lg" className="rounded-xl" asChild>
                <Link href={buildExecutorsHref(page - 1, listFilters)}>← Предыдущая</Link>
              </Button>
            ) : (
              <span className="min-h-11 inline-flex items-center text-sm text-muted-foreground">← Предыдущая</span>
            )}
            {page < totalPages ? (
              <Button variant="outline" size="lg" className="rounded-xl" asChild>
                <Link href={buildExecutorsHref(page + 1, listFilters)}>Следующая →</Link>
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
