import { BlogPostForm } from "@/components/admin/blog-post-form";

export default function AdminBlogNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Новая статья</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Заполните поля и нажмите «Создать статью». Можно сохранить как черновик и опубликовать позже.
        </p>
      </div>
      <BlogPostForm mode="create" />
    </div>
  );
}
