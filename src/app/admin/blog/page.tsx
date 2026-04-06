import { BlogAdminPanel, type BlogPostAdminRow } from "@/components/admin/blog-admin-panel";
import { listBlogPostsForAdmin } from "@/server/queries/blog";

export default async function AdminBlogPage() {
  const rows = await listBlogPostsForAdmin();

  const posts: BlogPostAdminRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    published: r.published,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
    authorEmail: r.author.email,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Блог</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Статьи для SEO-оптимизации. Опубликованные посты видны на /blog и индексируются поисковиками.
        </p>
      </div>
      <BlogAdminPanel posts={posts} />
    </div>
  );
}
