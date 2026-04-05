import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageNav, publicNavItemClassName } from "@/components/public/public-page-nav";
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
    row.executorProfile.bio?.slice(0, 160) ?? `Галерея работ исполнителя ${name} на DONE48.`;
  const titleAbs = `${name} · Галерея работ · DONE48`;
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
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-12">
      <ExecutorProfileJsonLd
        name={name}
        username={slug}
        description={p.bio}
        imageUrl={p.avatarUrl}
      />
      <div className="mx-auto max-w-3xl space-y-8">
        <PublicPageNav
          extra={
            <Link href="/executors" className={publicNavItemClassName}>
              Все исполнители
            </Link>
          }
        />
        <header className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-elevated">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-xl font-semibold text-muted-foreground ring-2 ring-primary/10">
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
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {name}
              </h1>
            </div>
          </div>
          {p.username ? (
            <p className="font-mono text-sm text-muted-foreground">@{p.username}</p>
          ) : null}
          {p.city ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1 text-sm text-muted-foreground">
              {p.city}
            </p>
          ) : null}
          {p.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{p.bio}</p>
          ) : null}
        </header>

        <ProfileReviewsSection
          stats={stats}
          reviews={reviews}
          mode="anonymous_role"
          title="Отзывы заказчиков"
        />

        <section className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Галерея работ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Показаны только работы, прошедшие модерацию площадки.
          </p>
          {user.portfolioItems.length === 0 ? (
            <p className="mt-4 rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
              Пока нет опубликованных работ — загляните позже.
            </p>
          ) : (
            <ul className="mt-5 space-y-5">
              {user.portfolioItems.map((item) => (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  {item.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border/80 bg-muted/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={
                          item.title ? `Работа «${item.title}», ${name}` : `Пример работы из портфолио, ${name}`
                        }
                        className="max-h-72 w-full object-cover sm:max-h-80"
                      />
                    </div>
                  ) : null}
                  {item.linkUrl ? (
                    <p className="mt-4">
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
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
