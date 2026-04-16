"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createJobVacancyAction, updateJobVacancyAction } from "@/server/actions/job-vacancies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  mode: "create" | "edit";
  vacancyId?: string;
  initial?: {
    title: string;
    slug: string;
    summary: string;
    description: string;
    employmentType: string;
    location: string;
    salaryHint: string;
    published: boolean;
    acceptingApplications: boolean;
  };
};

function titleToSlug(title: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
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

export function JobVacancyForm({ mode, vacancyId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [employmentType, setEmploymentType] = useState(initial?.employmentType ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [salaryHint, setSalaryHint] = useState(initial?.salaryHint ?? "");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [acceptingApplications, setAcceptingApplications] = useState(initial?.acceptingApplications ?? true);
  const [autoSlug, setAutoSlug] = useState(!initial?.slug);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (autoSlug) setSlug(titleToSlug(v));
  }

  function handleSubmit() {
    setMsg(null);
    setSuccess(false);
    startTransition(async () => {
      const input = {
        title,
        slug,
        summary,
        description,
        employmentType,
        location,
        salaryHint,
        published,
        acceptingApplications,
      };
      const r =
        mode === "create"
          ? await createJobVacancyAction(input)
          : await updateJobVacancyAction(vacancyId!, input);
      if (!r.ok) {
        setMsg(r.error ?? "Ошибка");
        return;
      }
      setSuccess(true);
      if (mode === "create" && "id" in r) {
        router.push(`/admin/vacancies/${r.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      {success && mode === "edit" ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Сохранено</p>
      ) : null}

      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="jv-title">Название вакансии</Label>
          <Input
            id="jv-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={pending}
            placeholder="Product designer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jv-slug">Slug (URL)</Label>
          <Input
            id="jv-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            disabled={pending}
            className="font-mono"
            placeholder="product-designer"
          />
          <p className="text-xs text-muted-foreground">/vacancies/{slug || "..."}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jv-summary">Кратко (для списка)</Label>
          <Textarea
            id="jv-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={pending}
            rows={3}
            placeholder="1–2 предложения для карточки на странице вакансий"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jv-emp">Формат</Label>
            <Input
              id="jv-emp"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              disabled={pending}
              placeholder="Полная занятость, контракт…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jv-loc">Локация</Label>
            <Input
              id="jv-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={pending}
              placeholder="Удалённо, Москва…"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jv-sal">Оклад / вилка (текстом)</Label>
          <Input
            id="jv-sal"
            value={salaryHint}
            onChange={(e) => setSalaryHint(e.target.value)}
            disabled={pending}
            placeholder="По договорённости, от … ₽"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jv-desc">Полное описание</Label>
          <Textarea
            id="jv-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={pending}
            rows={14}
            placeholder="Задачи, требования, стек, условия"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              disabled={pending}
              className="rounded border-border"
            />
            Опубликовать на сайте
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptingApplications}
              onChange={(e) => setAcceptingApplications(e.target.checked)}
              disabled={pending}
              className="rounded border-border"
            />
            Принимаем отклики
          </label>
        </div>

        <Button type="button" onClick={handleSubmit} disabled={pending}>
          {pending ? "Сохранение…" : mode === "create" ? "Создать вакансию" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
