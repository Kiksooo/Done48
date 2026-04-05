import type { Metadata } from "next";
import Link from "next/link";
import { SITE_SEO_BRAND, SITE_SEO_TITLE_TEMPLATE } from "@/lib/site-seo";
import {
  countPublicExecutors,
  listPublicExecutorCities,
  listPublicExecutors,
  type PublicExecutorListFilters,
} from "@/server/queries/public-executor";
import { getReviewStatsForUsers } from "@/server/queries/reviews";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const executorsOgTitle = SITE_SEO_TITLE_TEMPLATE.replace("%s", "Исполнители");
const executorsDescription =
  "Каталог активных исполнителей DONE48. Просматривайте портфолио и отзывы.";

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

function ruReviewsPhrase(count: number): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} отзывов`;
  const mod10 = count % 10;
  if (mod10 === 1) return `${count} отзыв`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} отзыва`;
  return `${count} отзывов`;
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

  const statsByUser = await getReviewStatsForUsers(executorsPaged.map((u) => u.id));

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
            Выбирайте исполнителя по портфолио и отзывам. Публичные профили доступны только для аккаунтов со
            статусом <span className="font-medium text-neutral-900 dark:text-neutral-100">ACTIVE</span>.
            Исполнители с жалобами в статусе <span className="font-medium text-neutral-900 dark:text-neutral-100">OPEN</span> или{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">IN_REVIEW</span> временно скрыты из каталога.
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
                placeholder="Имя, @ник, город, описание…"
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

        {executorsPaged.length === 0 ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {qValue || cityValue
              ? "Никого не нашли — попробуйте другой запрос или сбросьте фильтры."
              : "Пока нет активных исполнителей."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {executorsPaged.map((u) => {
              const p = u.executorProfile;
              if (!p?.username) return null;

              const displayName = p.displayName?.trim() || p.username;
              const portfolioPreview = u.portfolioItems[0];
              const review = statsByUser.get(u.id);

              return (
                <li
                  key={u.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                      {p.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.avatarUrl}
                          alt={`${displayName} — фото профиля`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/u/${p.username}`}
                        className="block truncate text-base font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
                      >
                        {displayName}
                      </Link>
                      {review && review.count > 0 ? (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Оценка {review.avg != null ? review.avg.toFixed(1) : "—"} · {ruReviewsPhrase(review.count)}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Отзывов пока нет</p>
                      )}
                      {p.city ? <p className="text-xs text-neutral-500">{p.city}</p> : null}
                      {p.bio ? <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{p.bio}</p> : null}
                    </div>
                  </div>

                  {portfolioPreview ? (
                    <div className="mt-4">
                      {portfolioPreview.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={portfolioPreview.imageUrl}
                          alt={
                            portfolioPreview.title
                              ? `Работа «${portfolioPreview.title}», ${displayName}`
                              : `Пример работы, ${displayName}`
                          }
                          className="h-24 w-full rounded-md border border-neutral-100 object-cover dark:border-neutral-900"
                        />
                      ) : null}
                      <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {portfolioPreview.title}
                      </p>
                      {portfolioPreview.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                          {portfolioPreview.description}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Link
                      href={`/u/${p.username}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Смотреть галерею →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

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
