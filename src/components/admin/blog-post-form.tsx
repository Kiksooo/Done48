"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBlogPostAction, updateBlogPostAction } from "@/server/actions/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  mode: "create" | "edit";
  postId?: string;
  initial?: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    published: boolean;
    metaTitle: string;
    metaDescription: string;
  };
};

function titleToSlug(title: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return title
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export function BlogPostForm({ mode, postId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [autoSlug, setAutoSlug] = useState(!initial?.slug);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (autoSlug) setSlug(titleToSlug(v));
  }

  function handleSubmit() {
    setMsg(null);
    setSuccess(false);
    startTransition(async () => {
      const input = { title, slug, excerpt, content, coverImageUrl, published, metaTitle, metaDescription };
      const r = mode === "create"
        ? await createBlogPostAction(input)
        : await updateBlogPostAction(postId!, input);
      if (!r.ok) {
        setMsg(r.error ?? "Ошибка");
        return;
      }
      setSuccess(true);
      if (mode === "create") {
        router.push("/admin/blog");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {msg ? <p className="text-sm text-red-600 dark:text-red-400" role="alert">{msg}</p> : null}
      {success && mode === "edit" ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Сохранено</p>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bp-title">Заголовок</Label>
          <Input
            id="bp-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={pending}
            placeholder="Как найти хорошего специалиста"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-slug">Slug (URL)</Label>
          <div className="flex gap-2">
            <Input
              id="bp-slug"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
              disabled={pending}
              className="font-mono"
              placeholder="kak-nayti-khoroshego-specialista"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            /blog/{slug || "..."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-excerpt">Краткое описание (для карточки)</Label>
          <Textarea
            id="bp-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            disabled={pending}
            rows={2}
            placeholder="Короткий анонс статьи для списка и соцсетей"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-cover">Обложка (URL изображения)</Label>
          <Input
            id="bp-cover"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            disabled={pending}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-content">Содержание статьи (HTML или Markdown)</Label>
          <Textarea
            id="bp-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={pending}
            rows={16}
            className="min-h-[20rem] resize-y font-mono text-sm"
            placeholder="<h2>Введение</h2><p>Текст статьи...</p>"
          />
          <p className="text-xs text-muted-foreground">
            Поддерживается HTML. Используйте теги h2, h3, p, ul, ol, img, a и другие.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">SEO-настройки</h3>
        <div className="space-y-2">
          <Label htmlFor="bp-meta-title">Meta Title</Label>
          <Input
            id="bp-meta-title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            disabled={pending}
            placeholder={title || "Заголовок для поисковиков"}
          />
          <p className="text-xs text-muted-foreground">
            Оставьте пустым — подставится заголовок статьи.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bp-meta-desc">Meta Description</Label>
          <Textarea
            id="bp-meta-desc"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            disabled={pending}
            rows={2}
            placeholder={excerpt || "Описание для поисковиков (150-160 символов)"}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            disabled={pending}
            className="h-4 w-4 rounded border-border"
          />
          Опубликовать сразу
        </label>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? "Сохранение…" : mode === "create" ? "Создать статью" : "Сохранить изменения"}
        </Button>
        <Button variant="outline" asChild>
          <a href="/admin/blog">Назад к списку</a>
        </Button>
      </div>
    </div>
  );
}
