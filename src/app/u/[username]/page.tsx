import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicExecutorByUsername } from "@/server/queries/public-executor";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getPublicExecutorByUsername(params.username);
  if (!row?.executorProfile) {
    return { title: "Исполнитель не найден · DONE48" };
  }
  const name = row.executorProfile.displayName ?? row.executorProfile.username ?? "Исполнитель";
  return {
    title: `${name} · Портфолио · DONE48`,
    description: row.executorProfile.bio?.slice(0, 160) ?? `Портфолио исполнителя ${name}`,
  };
}

export default async function PublicExecutorPortfolioPage({ params }: Props) {
  const user = await getPublicExecutorByUsername(params.username);
  if (!user || !user.executorProfile) notFound();

  const p = user.executorProfile;
  const name = p.displayName ?? p.username ?? user.email;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 dark:bg-neutral-950 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">
            <Link href="/login" className="underline hover:text-neutral-800 dark:hover:text-neutral-200">
              Войти в DONE48
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {name}
          </h1>
          {p.username ? (
            <p className="font-mono text-sm text-neutral-500">@{p.username}</p>
          ) : null}
          {p.city ? <p className="text-sm text-neutral-600 dark:text-neutral-400">{p.city}</p> : null}
          {p.bio ? (
            <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{p.bio}</p>
          ) : null}
        </header>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Портфолио</h2>
          {user.portfolioItems.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">Пока нет опубликованных работ.</p>
          ) : (
            <ul className="mt-4 space-y-6">
              {user.portfolioItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                      {item.description}
                    </p>
                  ) : null}
                  {item.imageUrl ? (
                    <div className="mt-3 overflow-hidden rounded-md border border-neutral-100 dark:border-neutral-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="max-h-64 w-full object-cover"
                      />
                    </div>
                  ) : null}
                  {item.linkUrl ? (
                    <p className="mt-3">
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-700 underline dark:text-neutral-300"
                      >
                        Открыть работу →
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
