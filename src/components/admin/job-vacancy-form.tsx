"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  AlignLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Lightbulb,
  Link2,
  Rocket,
  Sparkles,
} from "lucide-react";
import { createJobVacancyAction, updateJobVacancyAction } from "@/server/actions/job-vacancies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

const SUMMARY_MAX = 2000;
const DESCRIPTION_MAX = 50000;

const DESCRIPTION_TEMPLATE = `Чем предстоит заниматься
- …

Что ждём от вас
- …

Будет плюсом
- …

Условия и формат
- …
`;

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

function charHint(current: number, max: number) {
  const rest = max - current;
  if (rest < 0) return <span className="text-destructive">Превышен лимит на {-rest}</span>;
  if (rest < max * 0.05) return <span className="text-amber-700 dark:text-amber-300">Осталось {rest}</span>;
  return <span className="text-muted-foreground">{current} / {max}</span>;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  headerRight,
  children,
  contentClassName,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 shadow-md ring-1 ring-border/50">
      <div className="h-1 bg-gradient-to-r from-primary/60 via-primary/25 to-transparent" aria-hidden />
      <CardHeader className="space-y-0 pb-4 pt-6 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pt-7">
        <div className="flex gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed sm:text-[15px]">{description}</CardDescription>
          </div>
        </div>
        {headerRight ? <div className="mt-4 shrink-0 sm:mt-0">{headerRight}</div> : null}
      </CardHeader>
      <CardContent className={cn("space-y-5 pb-7 pt-0 sm:px-8", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function JobVacancyForm({ mode, vacancyId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
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

  const publicPath = slug.trim() ? `/vacancies/${slug.trim()}` : null;

  const summaryLen = summary.length;
  const descLen = description.length;

  function handleTitleChange(v: string) {
    setTitle(v);
    if (autoSlug) setSlug(titleToSlug(v));
  }

  function regenerateSlug() {
    setSlug(titleToSlug(title));
    setAutoSlug(true);
  }

  function insertDescriptionTemplate() {
    if (!description.trim()) {
      setDescription(DESCRIPTION_TEMPLATE);
      return;
    }
    if (typeof window !== "undefined" && window.confirm("Заменить текущий текст описания на шаблон?")) {
      setDescription(DESCRIPTION_TEMPLATE);
    }
  }

  async function copyPublicUrl() {
    if (!publicPath) return;
    const full = typeof window !== "undefined" ? `${window.location.origin}${publicPath}` : publicPath;
    try {
      await navigator.clipboard.writeText(full);
      setCopyHint("Ссылка скопирована");
      setTimeout(() => setCopyHint(null), 2500);
    } catch {
      setCopyHint("Не удалось скопировать — выделите ссылку вручную");
      setTimeout(() => setCopyHint(null), 3500);
    }
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
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      {mode === "create" ? (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-card to-muted/30 px-5 py-4 text-sm leading-relaxed text-muted-foreground shadow-sm sm:px-6">
          <span className="font-medium text-foreground">Добро пожаловать.</span> Заполните поля ниже — можно сохранить
          черновиком и вернуться позже. Пока выключена публикация, вакансию на сайте никто не увидит.
        </div>
      ) : null}

      {msg ? (
        <div
          className="flex gap-3 rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-950 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-50"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{msg}</p>
        </div>
      ) : null}
      {success && mode === "edit" ? (
        <div className="flex gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-950 shadow-sm dark:border-emerald-900/45 dark:bg-emerald-950/35 dark:text-emerald-50">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>Изменения сохранены — публичная страница обновится после обновления кэша у посетителей.</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <SectionCard
            icon={Link2}
            title="Название и ссылка"
            description={
              <>
                Как позиция называется и по какому адресу откроется страница. Slug лучше не менять после публикации —
                так не потеряются внешние ссылки.
              </>
            }
          >
            <div className="space-y-2">
              <Label htmlFor="jv-title">Название вакансии</Label>
              <Input
                id="jv-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={pending}
                placeholder="Например: Middle backend-разработчик (Node.js)"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Label htmlFor="jv-slug">Адрес страницы (slug)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8"
                    disabled={pending || !title.trim()}
                    onClick={regenerateSlug}
                  >
                    Сгенерировать из названия
                  </Button>
                </div>
              </div>
              <Input
                id="jv-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutoSlug(false);
                }}
                disabled={pending}
                className="h-10 font-mono text-sm"
                placeholder="middle-backend-nodejs"
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.checked)}
                  disabled={pending}
                  className="rounded border-border"
                />
                Автоматически обновлять slug, пока вы правите название
              </label>
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Публичный URL:{" "}
                <span className="font-mono text-foreground">{publicPath ?? "/vacancies/…"}</span>
              </p>
            </div>
          </SectionCard>

          <SectionCard
            icon={AlignLeft}
            title="Кратко для списка"
            description="Текст на странице «Вакансии» — без лишних деталей, 1–4 предложения, чтобы кандидату было сразу понятно «про что позиция»."
          >
            <Textarea
              id="jv-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={pending}
              rows={4}
              maxLength={SUMMARY_MAX}
              placeholder="Например: Ищем разработчика для развития API и интеграций. Удалённо, команда из четырёх человек."
              className="min-h-[108px] resize-y leading-relaxed"
            />
            <p className="text-right text-xs">{charHint(summaryLen, SUMMARY_MAX)}</p>
          </SectionCard>

          <SectionCard
            icon={BriefcaseBusiness}
            title="Условия в шапке"
            description="Формат, локация и оплата показываются рядом с заголовком на публичной странице — кандидат видит их до прокрутки."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jv-emp">Формат работы</Label>
                <Input
                  id="jv-emp"
                  list="employment-presets"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  disabled={pending}
                  placeholder="Начните ввод — подскажем варианты"
                  className="h-10"
                />
                <datalist id="employment-presets">
                  <option value="Полная занятость" />
                  <option value="Частичная занятость" />
                  <option value="Проект / контракт" />
                  <option value="Стажировка" />
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jv-loc">Локация</Label>
                <Input
                  id="jv-loc"
                  list="location-presets"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={pending}
                  placeholder="Удалённо, офис, гибрид…"
                  className="h-10"
                />
                <datalist id="location-presets">
                  <option value="Удалённо" />
                  <option value="Гибрид" />
                  <option value="Москва" />
                  <option value="Санкт-Петербург" />
                </datalist>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="jv-sal">Оплата</Label>
                <Input
                  id="jv-sal"
                  value={salaryHint}
                  onChange={(e) => setSalaryHint(e.target.value)}
                  disabled={pending}
                  placeholder="Например: от 180 000 ₽ на руки, вилка, обсуждается…"
                  className="h-10"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={FileText}
            title="Полное описание"
            description="Обычный текст с переносами строк — на сайте отобразится так же. Пустая строка между блоками помогает читать длинный текст."
            headerRight={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                disabled={pending}
                onClick={insertDescriptionTemplate}
              >
                <Sparkles className="size-4" aria-hidden />
                Шаблон
              </Button>
            }
            contentClassName="space-y-3"
          >
            <Textarea
              id="jv-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              rows={16}
              maxLength={DESCRIPTION_MAX}
              placeholder="Задачи, требования, стек, этапы отбора, что предлагаем команде…"
              className="min-h-[280px] resize-y font-mono text-sm leading-relaxed sm:min-h-[320px]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>{charHint(descLen, DESCRIPTION_MAX)}</span>
            </div>
          </SectionCard>

          <SectionCard
            icon={Rocket}
            title="Публикация и отклики"
            description="Черновик скрыт с публичной страницы. Если отключить отклики, описание останется, а форма исчезнет — удобно для закрытых, но ещё видимых позиций."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                role="switch"
                aria-checked={published}
                disabled={pending}
                onClick={() => setPublished((v) => !v)}
                className={cn(
                  "flex min-h-[3.25rem] flex-col gap-0.5 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  published
                    ? "border-primary/45 bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/15"
                    : "border-border bg-muted/25 text-muted-foreground hover:bg-muted/40",
                )}
              >
                <span className="font-semibold text-foreground">Видимость на сайте</span>
                <span className="text-xs">{published ? "Опубликована — видна в разделе вакансий" : "Черновик — только в админке"}</span>
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={acceptingApplications}
                disabled={pending}
                onClick={() => setAcceptingApplications((v) => !v)}
                className={cn(
                  "flex min-h-[3.25rem] flex-col gap-0.5 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  acceptingApplications
                    ? "border-emerald-500/40 bg-emerald-500/10 text-foreground shadow-sm ring-1 ring-emerald-500/15"
                    : "border-border bg-muted/25 text-muted-foreground hover:bg-muted/40",
                )}
              >
                <span className="font-semibold text-foreground">Форма отклика</span>
                <span className="text-xs">
                  {acceptingApplications ? "Открыта — кандидаты могут отправить отклик" : "Закрыта — форма скрыта"}
                </span>
              </button>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden rounded-2xl border-dashed border-primary/25 bg-gradient-to-b from-muted/30 to-card shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" aria-hidden />
                <CardTitle className="text-base font-semibold">С чего начать</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Сначала <span className="font-medium text-foreground">название</span> и{" "}
                <span className="font-medium text-foreground">краткое описание</span>, затем полный текст. Сохранять
                можно в любой момент.
              </p>
              <ul className="space-y-2 border-t border-border/60 pt-3">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
                  Укажите стек, уровень и как проходит отбор — так меньше нерелевантных откликов.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
                  Если оклад гибкий — честно напишите «вилка» или «обсуждается».
                </li>
              </ul>
            </CardContent>
          </Card>

          {mode === "edit" && publicPath ? (
            <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm ring-1 ring-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Как это видит кандидат</CardTitle>
                <CardDescription>Откройте публичную страницу или скопируйте ссылку для коллег.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="default" size="sm" className="justify-center gap-2 sm:justify-start" asChild>
                  <Link href={publicPath} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 shrink-0" aria-hidden />
                    Открыть на сайте
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-center gap-2 sm:justify-start"
                  disabled={!publicPath}
                  onClick={() => void copyPublicUrl()}
                >
                  <Copy className="size-4 shrink-0" aria-hidden />
                  Копировать URL
                </Button>
                {copyHint ? <p className="text-xs text-muted-foreground">{copyHint}</p> : null}
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-3 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.12)] backdrop-blur-md dark:shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.45)]",
          "supports-[backdrop-filter]:bg-background/88",
        )}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="order-2 hidden text-xs text-muted-foreground sm:order-1 sm:block">
            Сохранение вручную — автосохранения пока нет.
          </p>
          <div className="order-1 flex w-full flex-wrap items-center justify-end gap-2 sm:order-2 sm:w-auto">
            {mode === "edit" && publicPath ? (
              <Button variant="outline" size="default" className="gap-2" asChild>
                <Link href={publicPath} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  Просмотр
                </Link>
              </Button>
            ) : null}
            <Button type="button" size="lg" onClick={handleSubmit} disabled={pending} className="min-w-[11rem]">
              {pending ? "Сохранение…" : mode === "create" ? "Создать вакансию" : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
