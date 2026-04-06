"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBlogPostAction, toggleBlogPostPublishedAction } from "@/server/actions/blog";
import { Button } from "@/components/ui/button";

export type BlogPostAdminRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
  authorEmail: string;
};

export function BlogAdminPanel({ posts }: { posts: BlogPostAdminRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function togglePublished(id: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await toggleBlogPostPublishedAction(id);
      if (!r.ok) setMsg(r.error ?? "Ошибка");
      router.refresh();
    });
  }

  function deletePost(id: string) {
    if (!confirm("Удалить статью? Действие необратимо.")) return;
    setMsg(null);
    startTransition(async () => {
      const r = await deleteBlogPostAction(id);
      if (!r.ok) setMsg(r.error ?? "Ошибка");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{msg}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {posts.length === 0 ? "Нет статей" : `${posts.length} ${posts.length === 1 ? "статья" : "статей"}`}
        </p>
        <Button asChild>
          <Link href="/admin/blog/new">Новая статья</Link>
        </Button>
      </div>

      {posts.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Заголовок</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/blog/${post.id}`} className="text-primary hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{post.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        post.published
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                      }`}
                    >
                      {post.published ? "Опубликовано" : "Черновик"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("ru-RU")
                      : new Date(post.updatedAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => togglePublished(post.id)}
                      >
                        {post.published ? "Снять" : "Опубликовать"}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/blog/${post.id}`}>Редактировать</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => deletePost(post.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
