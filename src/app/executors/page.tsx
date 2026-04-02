import type { Metadata } from "next";
import Link from "next/link";
import { listPublicExecutors } from "@/server/queries/public-executor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Исполнители",
  description: "Каталог активных исполнителей DONE48. Просматривайте портфолио и отзывы.",
  alternates: { canonical: "/executors" },
};

export default async function ExecutorsPage() {
  const executors = await listPublicExecutors({ take: 24 });

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
          </p>
        </header>

        {executors.length === 0 ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Пока нет активных исполнителей.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {executors.map((u) => {
              const p = u.executorProfile;
              if (!p?.username) return null;

              const displayName = p.displayName?.trim() || p.username;
              const portfolioPreview = u.portfolioItems[0];

              return (
                <li
                  key={u.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                      {p.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
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
                          alt=""
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
                      Смотреть портфолио →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

