import type { Metadata } from "next";
import Link from "next/link";
import { SITE_SEO_BRAND, SITE_SEO_TITLE_TEMPLATE } from "@/lib/site-seo";
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

type PortfolioThumb = { id: string; imageUrl: string | null };

function GalleryMosaic({ items }: { items: PortfolioThumb[] }) {
  const withUrl = items.filter((i): i is { id: string; imageUrl: string } => Boolean(i.imageUrl));
  if (withUrl.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-100 px-2 text-center text-xs leading-snug text-neutral-500 dark:bg-neutral-900">
        Нет фото в галерее
      </div>
    );
  }
  if (withUrl.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={withUrl[0].imageUrl} alt="" className="h-full w-full object-cover" />
    );
  }
  if (withUrl.length === 2) {
    return (
      <div className="grid h-full grid-cols-2 gap-px bg-neutral-200 dark:bg-neutral-800">
        {withUrl.map((x) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.id} src={x.imageUrl} alt="" className="h-full min-h-0 w-full object-cover" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-px bg-neutral-200 dark:bg-neutral-800">
      {withUrl.slice(0, 4).map((x) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={x.id} src={x.imageUrl} alt="" className="h-full min-h-0 w-full object-cover" />
      ))}
      {withUrl.length === 3 ? (
        <span className="min-h-0 bg-neutral-100 dark:bg-neutral-950" aria-hidden />
      ) : null}
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 dark:bg-neutral-950 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Исполнители
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            В сетке — только фото, которые прошли модерацию, и <span className="font-medium">@ник</span> в системе. Пока
            работа не одобрена в разделе «Модерация», она не появляется здесь и на публичной странице исполнителя.
            Профили с жалобами <span className="font-medium">OPEN</span> / <span className="font-medium">IN_REVIEW</span>{" "}
            скрыты.
          </p>

          <form
            method="get"
            className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-end"
            action="/executors"
            role="search"
            aria-label="Поиск исполнителей"
          >
            <label className="block min-w-0 flex-1 sm:max-w-md">
              <span className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Поиск</span>
              <input
                type="search"
                name="q"
                defaultValue={qValue}
                placeholder="@ник, имя, город…"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-primary/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
            <label className="block w-full sm:w-52">
              <span className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Город</span>
              <select
                name="city"
                defaultValue={cityValue}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-primary/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">Все</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Найти
              </button>
              {qValue || cityValue ? (
                <Link
                  href="/executors"
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Сбросить
                </Link>
              ) : null}
            </div>
          </form>

          {total > 0 ? (
            <p className="text-xs text-neutral-500">
              Показано {executorsPaged.length} из {total}
              {totalPages > 1 ? ` · страница ${page} из ${totalPages}` : null}
            </p>
          ) : null}
        </header>

        <section id="gallery" aria-label="Галерея работ" className="scroll-mt-24 space-y-4">
          {executorsPaged.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {qValue || cityValue
                ? "Никого не нашли — попробуйте другой запрос или сбросьте фильтры."
                : "Пока нет активных исполнителей."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {executorsPaged.map((u) => {
                const username = u.executorProfile?.username;
                if (!username) return null;

                return (
                  <li key={u.id}>
                    <Link
                      href={`/u/${username}`}
                      className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-[box-shadow,transform] hover:shadow-md active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-950"
                      aria-label={`Галерея @${username}`}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                        <GalleryMosaic items={u.portfolioItems} />
                      </div>
                      <p className="border-t border-neutral-100 px-2 py-2.5 text-center font-mono text-sm font-medium text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
                        @{username}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {totalPages > 1 ? (
          <nav
            className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            aria-label="Страницы каталога"
          >
            {page > 1 ? (
              <Link
                href={buildExecutorsHref(page - 1, listFilters)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                ← Назад
              </Link>
            ) : (
              <span className="text-sm text-neutral-400">← Назад</span>
            )}
            {page < totalPages ? (
              <Link
                href={buildExecutorsHref(page + 1, listFilters)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Вперёд →
              </Link>
            ) : (
              <span className="text-sm text-neutral-400">Вперёд →</span>
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
