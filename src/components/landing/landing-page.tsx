import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Code2,
  Layers,
  Megaphone,
  MessageSquare,
  Palette,
  PenLine,
  Search,
  Shield,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { icon: Palette, title: "Дизайн и визуал", desc: "Логотипы, обложки, презентации, UI-наброски" },
  { icon: PenLine, title: "Тексты и контент", desc: "Копирайт, статьи, сценарии, редактура" },
  { icon: Code2, title: "Разработка и техника", desc: "Скрипты, правки сайта, мелкие задачи по коду" },
  { icon: Megaphone, title: "Маркетинг и SMM", desc: "Креативы, воронки, настройка рекламы" },
];

const forCustomers = [
  "Публикуете задачу с бюджетом и сроками — как краткое ТЗ.",
  "Получаете отклики исполнителей и выбираете подходящего.",
  "Оплата и учёт через баланс платформы, статус заказа виден в кабинете.",
  "Если что-то пошло не так — модерация и разбор спорных ситуаций.",
];

const forExecutors = [
  "Смотрите каталог доступных заказов и откликайтесь с предложением.",
  "Ведёте переписку и сдачу работы в рамках одного заказа.",
  "Баланс и выплаты отображаются прозрачно в вашем кабинете.",
  "Публичное портфолио по желанию — заказчики видят ваш стиль работы.",
];

const steps = [
  {
    step: "1",
    title: "Регистрация и роль",
    text: "Создайте аккаунт как заказчик или исполнитель. Пройдите короткое онбординг-заполнение профиля.",
  },
  {
    step: "2",
    title: "Заказ или отклик",
    text: "Заказчик оформляет заказ. Исполнитель находит подходящую задачу и предлагает условия и сроки.",
  },
  {
    step: "3",
    title: "Работа и приёмка",
    text: "Статусы заказа, сообщения и файлы — в одном месте. После приёмки работа считается завершённой.",
  },
  {
    step: "4",
    title: "Баланс и поддержка",
    text: "Движение средств отражается в балансе. Команда платформы помогает при спорах и вопросах по правилам.",
  },
];

const highlights = [
  { icon: Layers, label: "Заказы и статусы", sub: "единая карточка сделки" },
  { icon: MessageSquare, label: "Чат по заказу", sub: "без потери контекста" },
  { icon: Wallet, label: "Баланс в кабинете", sub: "прозрачный учёт" },
];

const navLinks = [
  { href: "#audience", label: "Для кого" },
  { href: "#how", label: "Как работает" },
  { href: "#categories", label: "Направления" },
  { href: "#trust", label: "Надёжность" },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-primary/15 blur-3xl dark:bg-primary/20"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-1 shadow-elevated backdrop-blur-xl dark:border-border/60">
        <div className="rounded-[1.35rem] bg-gradient-to-b from-muted/40 to-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                D
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">Кабинет заказа</p>
                <p className="text-[11px] text-muted-foreground">Вёрстка лендинга</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              В работе
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 rounded-2xl border border-border/50 bg-background/80 p-3 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                ИП
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">Отклик исполнителя</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Готов за 3 дня, приложу ссылки на прошлые работы.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-3 dark:bg-primary/[0.07]">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span>Следующий шаг: согласовать сроки и перейти к сдаче</span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-2 border-t border-border/50 pt-4">
            <div className="h-8 flex-1 rounded-lg bg-muted/60" />
            <div className="h-8 w-20 rounded-lg bg-primary/20" />
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -right-4 hidden w-44 rounded-2xl border border-border bg-card/95 p-3 shadow-elevated backdrop-blur-md sm:block lg:-right-8">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Сводка</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">48</p>
        <p className="text-[11px] text-muted-foreground">часов на микро-задачи</p>
      </div>
    </div>
  );
}

function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary/90",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
              D
            </span>
            <span className="text-lg font-bold tracking-tight">DONE48</span>
          </Link>
          <nav
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex"
            aria-label="По странице"
          >
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Войти</Link>
            </Button>
            <Button size="sm" className="shadow-sm" asChild>
              <Link href="/register">Начать</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-border/50">
          <div className="landing-mesh absolute inset-0" aria-hidden />
          <div className="landing-grid absolute inset-0 opacity-70 dark:opacity-40" aria-hidden />
          <div
            className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-[100px] dark:bg-primary/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-[90px] dark:bg-primary/15"
            aria-hidden
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-10 lg:pb-32 lg:pt-24">
            <div>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm opacity-0 animate-fade-up [animation-delay:80ms]">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Маркетплейс микро-услуг · в духе Fiverr, в вашем процессе
              </p>
              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem] xl:text-[3.65rem] opacity-0 animate-fade-up [animation-delay:140ms]">
                Заказы и исполнители —{" "}
                <span className="bg-gradient-to-r from-primary via-sky-500 to-primary bg-clip-text text-transparent dark:from-sky-400 dark:via-primary dark:to-sky-300">
                  в одном современном кабинете
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl opacity-0 animate-fade-up [animation-delay:200ms]">
                Публикуйте задачи или откликайтесь на них, ведите переписку по заказу и смотрите баланс без таблиц и
                разрозненных чатов — всё структурировано, как на крупных биржах вроде{" "}
                <span className="font-medium text-foreground">Fiverr</span>.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground opacity-0 animate-fade-up [animation-delay:240ms]">
                {["Заказы", "Отклики", "Чат", "Баланс", "Модерация"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium backdrop-blur-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center opacity-0 animate-fade-up [animation-delay:280ms]">
                <Button size="lg" className="h-12 gap-2 rounded-xl px-8 text-base shadow-glow" asChild>
                  <Link href="/register">
                    Начать как заказчик
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/80 bg-card/50 px-8 text-base" asChild>
                  <Link href="/register">
                    <Briefcase className="h-4 w-4" aria-hidden />
                    Я исполнитель
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground opacity-0 animate-fade-up [animation-delay:320ms]">
                Уже с нами?{" "}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Войти в аккаунт
                </Link>
              </p>
            </div>

            <div className="relative mt-16 opacity-0 animate-fade-up [animation-delay:360ms] lg:mt-0">
              <HeroPreview />
              <div className="mx-auto mt-8 max-w-xl lg:mx-0 lg:max-w-md">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-2 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3.5">
                    <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <span className="text-sm text-muted-foreground">
                      Лендинг за выходные, обложка подкаста, правки в Notion…
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground lg:text-left">
                  После регистрации — реальные заказы и витрина задач в вашем кабинете.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="border-b border-border/50 py-16 sm:py-20" aria-labelledby="product-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Возможности</SectionEyebrow>
            <h2 id="product-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Всё, что нужно для сделки
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Один интерфейс для заказчика и исполнителя — статусы, сообщения и деньги не разъезжаются по разным каналам.
            </p>
            <ul className="mt-12 grid gap-6 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, label, sub }) => (
                <li
                  key={label}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold">{label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="audience"
          className="relative border-b border-border/50 bg-muted/20 py-20 sm:py-24"
          aria-labelledby="for-whom-heading"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Аудитория</SectionEyebrow>
            <h2 id="for-whom-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Для кого платформа
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Заказчики покупают результат, исполнители продают навыки — правила и экраны согласованы для обеих ролей.
            </p>
            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              {[
                {
                  title: "Заказчикам",
                  icon: Users,
                  intro: "Разовая задача без бесконечного поиска в чатах — текст, дизайн, правка сайта и другое.",
                  items: forCustomers,
                },
                {
                  title: "Исполнителям",
                  icon: Briefcase,
                  intro: "Короткие заказы и прозрачный цикл сделки — похоже на витрину Fiverr, но внутри DONE48.",
                  items: forExecutors,
                },
              ].map((block) => {
                const BlockIcon = block.icon;
                return (
                  <article
                    key={block.title}
                    className={cn(
                      "relative overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-elevated sm:p-10",
                      "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:p-px before:content-['']",
                      "before:bg-gradient-to-br before:from-primary/25 before:via-transparent before:to-primary/10",
                    )}
                  >
                    <div className="relative">
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner">
                        <BlockIcon className="h-7 w-7" aria-hidden />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">{block.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{block.intro}</p>
                      <ul className="mt-8 space-y-4">
                        {block.items.map((line) => (
                          <li key={line} className="flex gap-3 text-sm leading-relaxed">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how" className="py-20 sm:py-24" aria-labelledby="how-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Процесс</SectionEyebrow>
            <h2 id="how-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Как это работает
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Четыре шага от регистрации до поддержки. Администраторы следят за правилами площадки.
            </p>
            <div className="relative mt-16">
              <div
                className="absolute left-[1.125rem] top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-primary/50 via-border to-transparent lg:left-1/2 lg:block lg:-translate-x-1/2"
                aria-hidden
              />
              <ol className="grid gap-8 lg:grid-cols-4 lg:gap-6">
                {steps.map((s, i) => (
                  <li
                    key={s.step}
                    className="relative rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md lg:text-center"
                  >
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm lg:mx-auto">
                      {s.step}
                    </span>
                    {i < steps.length - 1 ? (
                      <div
                        className="absolute left-5 top-[2.75rem] h-[calc(100%+1.5rem)] w-px bg-border lg:hidden"
                        aria-hidden
                      />
                    ) : null}
                    <h3 className="font-semibold leading-snug">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section
          id="categories"
          className="border-y border-border/50 bg-muted/15 py-20 sm:py-24"
          aria-labelledby="categories-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionEyebrow className="text-left">Категории</SectionEyebrow>
                <h2 id="categories-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Популярные направления
                </h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Сгруппированные типы задач — проще сформулировать запрос и найти свой формат работы.
                </p>
              </div>
              <Layers className="h-12 w-12 text-primary/30 lg:shrink-0" aria-hidden />
            </div>
            <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {categories.map(({ icon: Icon, title, desc }, idx) => (
                <li
                  key={title}
                  className={cn(
                    "group flex flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300",
                    "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
                    idx === 0 && "lg:col-span-2 lg:flex-row lg:items-center lg:gap-6 lg:p-8",
                  )}
                >
                  <div
                    className={cn(
                      "mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105",
                      idx === 0 && "lg:mb-0 lg:h-14 lg:w-14",
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="trust" className="py-20 sm:py-24" aria-labelledby="trust-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Доверие</SectionEyebrow>
            <h2 id="trust-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Прозрачность и контроль
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Платформа задаёт структуру: статусы, баланс и переписка остаются в одном месте.
            </p>
            <ul className="mt-14 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Wallet,
                  title: "Баланс и платежи",
                  text: "Операции в кабинете — меньше ручных сверок и споров о суммах.",
                },
                {
                  icon: MessageSquare,
                  title: "Коммуникации",
                  text: "Сообщения и уведомления привязаны к заказам, а не теряются в мессенджерах.",
                },
                {
                  icon: Shield,
                  title: "Модерация",
                  text: "Администрация подключается к спорным сценариям и настройкам категорий.",
                },
              ].map((item) => {
                const TrustIcon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="rounded-3xl border border-border/60 bg-gradient-to-b from-card to-muted/20 p-8 text-center shadow-sm"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <TrustIcon className="h-7 w-7" aria-hidden />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="relative border-t border-border/50 py-20 sm:py-28">
          <div className="landing-mesh absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
            <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.06] p-10 shadow-elevated sm:p-14 dark:to-primary/[0.09]">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Готовы попробовать DONE48?</h2>
                <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                  Регистрация займёт пару минут — затем кабинет, заказы или витрина задач.
                </p>
                <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" className="h-12 rounded-xl px-10 text-base shadow-glow" asChild>
                    <Link href="/register">Создать аккаунт</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/80 bg-background/50 px-10 text-base" asChild>
                    <Link href="/login">Уже есть логин</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-card/40 py-14 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                D
              </span>
              <span className="text-lg font-bold">DONE48</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Маркетплейс микро-услуг: заказчики и исполнители в одной экосистеме с балансом, чатом и модерацией.
            </p>
          </div>
          <div className="flex flex-col gap-6 sm:items-end sm:text-right">
            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium" aria-label="Нижняя навигация">
              <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
                Вход
              </Link>
              <Link href="/register" className="text-muted-foreground transition-colors hover:text-foreground">
                Регистрация
              </Link>
              <a href="#how" className="text-muted-foreground transition-colors hover:text-foreground">
                Как работает
              </a>
            </nav>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DONE48</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
