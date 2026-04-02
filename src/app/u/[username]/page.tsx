import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileReviewsSection } from "@/components/reviews/profile-reviews-section";
import { ExecutorProfileJsonLd } from "@/components/seo/executor-profile-json-ld";
import { toAbsoluteSiteUrl } from "@/lib/site-url";
import { getPublicExecutorByUsername } from "@/server/queries/public-executor";
import { getReviewStatsForUser, listReviewsReceivedByUser } from "@/server/queries/reviews";

export const dynamic = "force-dynamic";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getPublicExecutorByUsername(params.username);
  const canonical = `/u/${params.username}`;
  if (!row?.executorProfile) {
    return {
      title: { absolute: "Исполнитель не найден · DONE48" },
      description: "Такого исполнителя нет в каталоге DONE48.",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }
  const name = row.executorProfile.displayName ?? row.executorProfile.username ?? "Исполнитель";
  const description =
    row.executorProfile.bio?.slice(0, 160) ?? `Портфолио исполнителя ${name} на DONE48.`;
  const titleAbs = `${name} · Портфолио · DONE48`;
  const ogImage = row.executorProfile.avatarUrl ? toAbsoluteSiteUrl(row.executorProfile.avatarUrl) : undefined;
  return {
    title: { absolute: titleAbs },
    description,
    alternates: { canonical },
    openGraph: {
      title: titleAbs,
      description,
      url: canonical,
      type: "profile",
      ...(ogImage ? { images: [{ url: ogImage, alt: `${name} — фото профиля` }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: titleAbs,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function PublicExecutorPortfolioPage({ params }: Props) {
  const user = await getPublicExecutorByUsername(params.username);
  if (!user || !user.executorProfile) notFound();

  const p = user.executorProfile;
  const name = p.displayName ?? p.username ?? user.email;

  const [stats, reviews] = await Promise.all([
    getReviewStatsForUser(user.id),
    listReviewsReceivedByUser(user.id, 30),
  ]);

  const slug = p.username ?? params.username;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 dark:bg-neutral-950 sm:px-6">
      <ExecutorProfileJsonLd
        name={name}
        username={slug}
        description={p.bio}
        imageUrl={p.avatarUrl}
      />
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
            <Link href="/executors" className="underline hover:text-neutral-800 dark:hover:text-neutral-200">
              Все исполнители
            </Link>
            <Link href="/login" className="underline hover:text-neutral-800 dark:hover:text-neutral-200">
              Войти в DONE48
            </Link>
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-xl font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={`${name} — фото профиля`}
                  className="h-full w-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {name}
              </h1>
            </div>
          </div>
          {p.username ? (
            <p className="font-mono text-sm text-neutral-500">@{p.username}</p>
          ) : null}
          {p.city ? <p className="text-sm text-neutral-600 dark:text-neutral-400">{p.city}</p> : null}
          {p.bio ? (
            <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{p.bio}</p>
          ) : null}
        </header>

        <ProfileReviewsSection
          stats={stats}
          reviews={reviews}
          mode="anonymous_role"
          title="Отзывы заказчиков"
        />

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
                        alt={
                          item.title ? `Работа «${item.title}», ${name}` : `Пример работы из портфолио, ${name}`
                        }
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
