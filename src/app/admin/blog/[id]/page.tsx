import { notFound } from "next/navigation";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getBlogPostForAdmin } from "@/server/queries/blog";

type Props = { params: { id: string } };

export default async function AdminBlogEditPage({ params }: Props) {
  const post = await getBlogPostForAdmin(params.id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Редактирование статьи</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {post.published ? "Статья опубликована" : "Черновик"} · /blog/{post.slug}
        </p>
      </div>
      <BlogPostForm
        mode="edit"
        postId={post.id}
        initial={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          coverImageUrl: post.coverImageUrl ?? "",
          published: post.published,
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
        }}
      />
    </div>
  );
}
