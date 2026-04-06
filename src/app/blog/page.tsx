import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { PublicPageNav } from "@/components/public/public-page-nav";
import { SITE_SEO_BRAND, SITE_SEO_TITLE_TEMPLATE } from "@/lib/site-seo";
import { countPublishedBlogPosts, listPublishedBlogPosts } from "@/server/queries/blog";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const blogOgTitle = SITE_SEO_TITLE_TEMPLATE.replace("%s", "Блог");
const blogDescription =
  "Блог DONE48: полезные статьи для заказчиков и специалистов — советы, кейсы и новости платформы.";

export const metadata: Metadata = {
  title: "Блог",
  description: blogDescription,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: blogOgTitle,
    description: blogDescription,
    url: "/blog",
    type: "website",
    siteName: SITE_SEO_BRAND,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: blogOgTitle,
    description: blogDescription,
  },
};

type Props = {
  searchParams: { page?: string };
};

const PAGE_SIZE = 12;

export default async function BlogPage({ searchParams }: Props) {
  const pageRaw = searchParams.page ?? "1";
  const pageNum = Math.max(1, parseInt(pageRaw, 10) || 1);

  const total = await countPublishedBlogPosts();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageNum, totalPages);

  const posts = await listPublishedBlogPosts(PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8 pb-16">
        <PublicPageNav />

        <header>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Блог
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Полезные статьи для заказчиков и специалистов
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <p className="text-4xl" aria-hidden>📝</p>
            <p className="mt-4 text-lg font-medium text-foreground">Пока нет статей</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Скоро здесь появятся полезные материалы — загляните позже.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="group">
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
                >
                  {post.coverImageUrl ? (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-4xl font-bold text-primary/30">
                        {post.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {post.publishedAt ? (
                      <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" aria-hidden />
                        {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    ) : null}
                    <h2 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Читать
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8"
            aria-label="Страницы блога"
          >
            {page > 1 ? (
              <Button variant="outline" size="lg" className="rounded-xl" asChild>
                <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}>← Предыдущая</Link>
              </Button>
            ) : (
              <span className="min-h-11 inline-flex items-center text-sm text-muted-foreground">← Предыдущая</span>
            )}
            <span className="text-sm text-muted-foreground">
              Страница {page} из {totalPages}
            </span>
            {page < totalPages ? (
              <Button variant="outline" size="lg" className="rounded-xl" asChild>
                <Link href={`/blog?page=${page + 1}`}>Следующая →</Link>
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
