import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { BreadcrumbJsonLd, PublicBreadcrumbs } from "@/components/public/public-breadcrumbs";
import { PublicPageNav, publicNavItemClassName } from "@/components/public/public-page-nav";
import { breadcrumbBlogPost } from "@/lib/public-breadcrumb-presets";
import { SITE_SEO_BRAND } from "@/lib/site-seo";
import { toAbsoluteSiteUrl } from "@/lib/site-url";
import { getPublishedBlogPost } from "@/server/queries/blog";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPost(params.slug);
  const canonical = `/blog/${params.slug}`;

  if (!post) {
    return {
      title: { absolute: "Статья не найдена · DONE48" },
      robots: { index: false, follow: true },
      alternates: { canonical },
    };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || `${post.title} — блог DONE48`;
  const ogImage = post.coverImageUrl ? toAbsoluteSiteUrl(post.coverImageUrl) : undefined;

  return {
    title: { absolute: `${title} · Блог · DONE48` },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: SITE_SEO_BRAND,
      locale: "ru_RU",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      ...(ogImage ? { images: [{ url: ogImage, alt: post.title }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedBlogPost(params.slug);
  if (!post) notFound();

  const postCrumbs = breadcrumbBlogPost(post.slug, post.title);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImageUrl ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: SITE_SEO_BRAND,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_SEO_BRAND,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toAbsoluteSiteUrl(`/blog/${post.slug}`),
    },
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-12">
      <BreadcrumbJsonLd items={postCrumbs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl space-y-8 pb-16">
        <PublicPageNav
          extra={
            <Link href="/blog" className={publicNavItemClassName}>
              <ArrowLeft className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              Все статьи
            </Link>
          }
        />

        <PublicBreadcrumbs items={postCrumbs} />

        <article>
          {post.coverImageUrl ? (
            <div className="mb-8 overflow-hidden rounded-2xl border border-border shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="aspect-[2/1] w-full object-cover"
              />
            </div>
          ) : null}

          <header className="space-y-4">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>
            {post.publishedAt ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" aria-hidden />
                {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
            {post.excerpt ? (
              <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
            ) : null}
          </header>

          <div
            className="blog-content prose prose-neutral mt-8 max-w-none dark:prose-invert
              prose-headings:tracking-tight prose-headings:scroll-mt-20
              prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-foreground/90
              prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80
              prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm
              prose-li:text-foreground/90
              prose-blockquote:border-primary/30 prose-blockquote:bg-primary/[0.03] prose-blockquote:rounded-r-lg prose-blockquote:py-1
              prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-['']"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <nav className="border-t border-border pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Все статьи
          </Link>
        </nav>
      </div>
    </div>
  );
}
