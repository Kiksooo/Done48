import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Camera,
  CheckCircle2,
  Clock,
  Code2,
  Gift,
  GraduationCap,
  Hammer,
  Heart,
  Layers,
  Megaphone,
  MessageSquare,
  Palette,
  PenLine,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHeroSearch } from "@/components/landing/landing-hero-search";
import { landingNavLinks } from "@/components/landing/nav-data";
import { LandingJsonLd } from "@/components/seo/landing-json-ld";
import { REGISTER_HREF_CUSTOMER, REGISTER_HREF_EXECUTOR } from "@/lib/register-intent";
import { Button } from "@/components/ui/button";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

const categories = [
  { icon: Palette, title: "Дизайн и визуал", desc: "Логотипы, обложки, презентации, наброски интерфейсов" },
  { icon: PenLine, title: "Тексты и контент", desc: "Копирайт, статьи, сценарии, редактура" },
  { icon: Code2, title: "Разработка и техника", desc: "Скрипты, правки сайта, мелкие задачи по коду" },
  { icon: Megaphone, title: "Маркетинг и соцсети", desc: "Креативы, воронки, настройка рекламы" },
  { icon: Wrench, title: "Бытовые услуги", desc: "Уборка, сантехника, сборка мебели и мелкий ремонт" },
  { icon: Hammer, title: "Строительство и ремонт", desc: "Плиточники, электрики, штукатуры, ремонт под ключ" },
  { icon: GraduationCap, title: "Репетиторы", desc: "Математика, английский, подготовка к ЕГЭ и ОГЭ" },
  { icon: Camera, title: "Фото и видео", desc: "Съёмка, монтаж, обработка, контент для соцсетей" },
  { icon: Heart, title: "Красота и здоровье", desc: "Макияж, маникюр, причёски, массаж, фитнес-тренеры" },
  { icon: Truck, title: "Доставка и перевозки", desc: "Курьеры, грузоперевозки, переезды" },
];

const forCustomers = [
  "Описываете задачу своими словами и сразу указываете бюджет и сроки.",
  "Получаете отклики и выбираете специалиста без бесконечных переписок.",
  "Статус заказа, сообщения и оплата собраны в одном месте.",
  "Можно включить резерв: деньги уйдут специалисту только после приёмки.",
  "Если что-то пошло не так, подключается поддержка.",
];

const forExecutors = [
  "Показываете портфолио и коротко пишете, в чём вы сильны.",
  "Смотрите открытые заказы и откликайтесь только на релевантные задачи.",
  "Получаете отзывы после завершённых работ и повышаете доверие к профилю.",
  "Если заказ с резервом, оплата приходит после подтверждения результата.",
  "Баланс и выплаты всегда под рукой в личном кабинете.",
];

const steps = [
  {
    step: "1",
    title: "Знакомство",
    text: "При регистрации выберите роль заказчика или специалиста; в онбординге — короткая справка по кабинету.",
  },
  {
    step: "2",
    title: "Находите друг друга",
    text: "Кто-то публикует задачу, кто-то откликается с условиями и сроками — всё по делу.",
  },
  {
    step: "3",
    title: "Делаете дело",
    text: "Статусы, сообщения и файлы в одной карточке заказа. Закрыли — и можно двигаться дальше.",
  },
  {
    step: "4",
    title: "Подстраховка",
    text: "Резерв под заказ и выплаты видны в балансе; специалист не получает сумму, пока вы не примете результат. Если что-то неясно — мы на связи по правилам площадки.",
  },
];

const highlights = [
  { icon: Layers, label: "Один заказ — одна история", sub: "статусы и детали не теряются" },
  { icon: MessageSquare, label: "Пишите по делу", sub: "чат привязан к заказу, контекст всегда с вами" },
  {
    icon: Wallet,
    label: "Баланс наглядно",
    sub: "пополнение, резерв под заказ и списания разделены — не путается с личными переводами",
  },
];

/** Короткие опоры доверия в духе маркетплейсов: ясно и без лишней «воды». */
const marketplaceBenefits = [
  {
    icon: MessageSquare,
    title: "Специалисты откликнутся сами",
    text: "Публикуете заказ и получаете отклики с ценой, сроками и комментариями.",
  },
  {
    icon: Banknote,
    title: "Сравните предложения",
    text: "Видно несколько вариантов сразу, поэтому проще выбрать по делу, а не наугад.",
  },
  {
    icon: ShieldCheck,
    title: "Защита сделки",
    text: "Можно зафиксировать оплату в резерве: деньги переводятся после вашей приёмки.",
  },
  {
    icon: Star,
    title: "Отзывы после сделки",
    text: "Отзывы оставляют только после выполненного заказа, поэтому им можно доверять.",
  },
];

const heroTrust = [
  { icon: Gift, text: "Регистрация бесплатно" },
  { icon: Clock, text: "Около минуты до старта" },
  { icon: Users, text: "Заказчик или специалист" },
] as const;

const trustVisuals = [
  {
    src: "/images/blog/blog-bezopasnost-sdelok-online.jpg",
    title: "Безопасные расчёты",
    text: "Показываем прозрачную схему: резерв, приёмка и перевод оплаты.",
  },
  {
    src: "/images/blog/blog-otzyvy-na-marketpleise-zachem-vazhny.jpg",
    title: "Отзывы после работ",
    text: "Оценки появляются по итогам завершённых заказов, а не «из воздуха».",
  },
  {
    src: "/images/blog/blog-kak-nayti-khoroshego-specialista.jpg",
    title: "Проверка исполнителя",
    text: "Портфолио, описание опыта и репутация помогают выбрать спокойнее.",
  },
] as const;

const specialistVisuals = [
  {
    src: "/images/blog/blog-portfolio-specialista-kak-oformit.jpg",
    badge: "Проверенный профиль",
  },
  {
    src: "/images/blog/blog-otzyvy-na-marketpleise-zachem-vazhny.jpg",
    badge: "Реальные отзывы",
  },
  {
    src: "/images/blog/blog-kak-specialistu-poluchat-bolshe-zakazov.jpg",
    badge: "Прозрачные выплаты",
  },
] as const;

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
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              В работе ✓
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 rounded-2xl border border-border/50 bg-background/80 p-3 shadow-sm">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60">
                <Image
                  src="/images/blog/blog-kak-vybrat-dizaynera-dlya-logotipa.jpg"
                  alt="Фото специалиста"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">Отклик специалиста</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  готов за 1 день, приложу ссылки на прошлые работы.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/80 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">Последние активные специалисты</p>
              <div className="flex -space-x-2">
                {[
                  "/images/blog/blog-kak-nayti-khoroshego-specialista.jpg",
                  "/images/blog/blog-portfolio-specialista-kak-oformit.jpg",
                  "/images/blog/blog-kak-specialistu-poluchat-bolshe-zakazov.jpg",
                ].map((src, i) => (
                  <div
                    key={src}
                    className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-card"
                    style={{ zIndex: 10 - i }}
                  >
                    <Image src={src} alt="Аватар специалиста" fill className="object-cover" sizes="28px" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Проверенный профиль</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Модерация пройдена</span>
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
        <p className="text-[11px] text-muted-foreground">идеально для небольших задач</p>
      </div>
    </div>
  );
}

function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex justify-center", className)}>
      <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/15">
        {children}
      </span>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page-theme min-h-screen bg-background text-foreground">
      <LandingJsonLd />
      <LandingHeader />

      <main>
        <section className="relative isolate overflow-hidden border-b border-border/50 bg-background">
          <div className="landing-mesh absolute inset-0 opacity-[0.55] dark:opacity-40" aria-hidden />
          <div className="landing-grid absolute inset-0 opacity-50 dark:opacity-25" aria-hidden />
          <div
            className="pointer-events-none absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-primary/15 blur-[100px] dark:bg-primary/20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-primary/8 blur-[90px] dark:bg-primary/12"
            aria-hidden
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-10 lg:pb-28 lg:pt-20">
            <div className="lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-14 xl:gap-16">
              <div>
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary opacity-0 animate-fade-up [animation-delay:40ms] sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                  Для заказчиков: разместить заказ и найти специалиста
                </p>
                <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[2.75rem] xl:text-[3.15rem] opacity-0 animate-fade-up [animation-delay:80ms]">
                  Найдите специалиста без лишней суеты
                </h1>
                <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl opacity-0 animate-fade-up [animation-delay:140ms]">
                  Разместите задачу, получите отклики и выберите исполнителя, который вам подходит по цене и подходу. Вся работа по заказу ведётся в одном кабинете: статусы, чат и оплата.
                </p>

                <ul className="mt-6 flex flex-wrap gap-2 opacity-0 animate-fade-up [animation-delay:180ms] sm:gap-3">
                  {heroTrust.map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm sm:text-sm"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" aria-hidden />
                      {text}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center opacity-0 animate-fade-up [animation-delay:220ms]">
                  <Button size="lg" className="h-12 gap-2 rounded-full px-8 text-base shadow-glow" asChild>
                    <Link href={REGISTER_HREF_CUSTOMER}>
                      Разместить первую задачу
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-border/80 bg-card/80 px-8 text-base shadow-glow-sm"
                    asChild
                  >
                    <Link href={REGISTER_HREF_EXECUTOR}>
                      <Briefcase className="h-4 w-4" aria-hidden />
                      Стать специалистом
                    </Link>
                  </Button>
                </div>

                <div className="mt-8 opacity-0 animate-fade-up [animation-delay:260ms]">
                  <LandingHeroSearch />
                </div>

                <p className="mt-4 text-sm text-muted-foreground opacity-0 animate-fade-up [animation-delay:300ms]">
                  Уже с нами?{" "}
                  <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Войти в кабинет
                  </Link>
                </p>

                <div
                  id="benefits"
                  className="scroll-mt-24 mt-10 opacity-0 animate-fade-up [animation-delay:340ms] sm:scroll-mt-28"
                >
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-5 xl:grid-cols-4">
                    {marketplaceBenefits.map(({ icon: Icon, title, text }) => (
                      <li
                        key={title}
                        className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-md"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <h2 className="mt-3 text-sm font-semibold leading-snug text-foreground">{title}</h2>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 opacity-0 animate-fade-up [animation-delay:380ms]">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Популярные типы задач</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <a
                        key={c.title}
                        href="#categories"
                        className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
                      >
                        {c.title}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative mt-14 opacity-0 animate-fade-up [animation-delay:420ms] lg:mt-4">
                <HeroPreview />
                <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground lg:mx-0 lg:text-left">
                  Так выглядит карточка заказа: отклики, статус и следующий шаг — на одном экране.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="product"
          className="scroll-mt-20 border-b border-border/50 py-16 sm:scroll-mt-24 sm:py-20"
          aria-labelledby="product-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Удобство</SectionEyebrow>
            <h2 id="product-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Всё под рукой — без лишних вкладок
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              Всё, что относится к заказу, находится рядом: переписка, статус и деньги.
            </p>
            <ul className="mt-12 grid gap-6 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, label, sub }) => (
                <li
                  key={label}
                  className="group relative overflow-hidden rounded-[1.35rem] border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md"
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
          className="relative scroll-mt-20 border-b border-border/50 bg-muted/20 py-20 sm:scroll-mt-24 sm:py-24"
          aria-labelledby="for-whom-heading"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Кому мы рады</SectionEyebrow>
            <h2 id="for-whom-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              И тем, кто заказывает, и тем, кто помогает
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              Сервис одинаково удобен и для заказчиков, и для специалистов: без сложного входа и долгого обучения.
            </p>
            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              {[
                {
                  title: "Если вам нужна помощь",
                  icon: Users,
                  intro: "Разовая задача — текст, дизайн, правка сайта — без бесконечных «а кто свободен?» в чатах.",
                  items: forCustomers,
                },
                {
                  title: "Если вы — профессионал своего дела",
                  icon: Briefcase,
                  intro: "Заполняете профиль, показываете работы и получаете заказы без ручного поиска клиентов по чатам.",
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

        <section id="how" className="scroll-mt-20 py-20 sm:scroll-mt-24 sm:py-24" aria-labelledby="how-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>По шагам</SectionEyebrow>
            <h2 id="how-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Всего четыре шага — без запутанных схем
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              От регистрации до завершения заказа весь процесс прозрачен и понятен.
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
                    className="relative rounded-[1.35rem] border border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md lg:text-center"
                  >
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md lg:mx-auto">
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
          className="scroll-mt-20 border-y border-border/50 bg-muted/15 py-20 sm:scroll-mt-24 sm:py-24"
          aria-labelledby="categories-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionEyebrow className="justify-start">Направления</SectionEyebrow>
                <h2 id="categories-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Чем обычно занимаются на площадке
                </h2>
                <p className="mt-3 max-w-xl text-lg text-muted-foreground">
                  Подсказки по типам задач — проще описать, что вам нужно, или найти «своё» среди заказов.
                </p>
              </div>
              <Layers className="h-12 w-12 text-primary/30 lg:shrink-0" aria-hidden />
            </div>
            <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
              {categories.map(({ icon: Icon, title, desc }) => (
                <li
                  key={title}
                  className={cn(
                    "group flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300",
                    "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
                  )}
                >
                  <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="specialists"
          className="scroll-mt-20 py-20 sm:scroll-mt-24 sm:py-24"
          aria-labelledby="specialists-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Специалисты</SectionEyebrow>
            <h2 id="specialists-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Профессионалы с портфолио и отзывами
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              Каждый специалист создаёт профиль с примерами работ, описанием опыта и контактами.
              Отзывы оставляют только реальные заказчики после завершённой сделки.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Briefcase,
                  title: "Портфолио работ",
                  text: "Специалисты загружают примеры выполненных проектов — фото, описания и ссылки. Всё проходит модерацию.",
                },
                {
                  icon: Star,
                  title: "Рейтинг и отзывы",
                  text: "Оценки ставятся по итогам реальных заказов. Чем больше положительных отзывов — тем выше доверие.",
                },
                {
                  icon: CheckCircle2,
                  title: "Проверенные профили",
                  text: "Анкеты проходят модерацию администраторами. Только подтверждённые специалисты видны в каталоге.",
                },
              ].map((item) => {
                const ItemIcon = item.icon;
                const visual = specialistVisuals[
                  item.title === "Портфолио работ" ? 0 : item.title === "Рейтинг и отзывы" ? 1 : 2
                ];
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative -mx-2 -mt-2 mb-4 aspect-[16/9] overflow-hidden rounded-xl border border-border/60">
                      <Image src={visual.src} alt={item.title} fill className="object-cover" sizes="(min-width: 640px) 33vw, 100vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground">
                        {visual.badge}
                      </span>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ItemIcon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <Button size="lg" variant="outline" className="h-12 gap-2 rounded-xl px-8 text-base" asChild>
                <Link href="/executors">
                  Смотреть каталог специалистов
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="trust" className="scroll-mt-20 py-20 sm:scroll-mt-24 sm:py-24" aria-labelledby="trust-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionEyebrow>Спокойствие</SectionEyebrow>
            <h2 id="trust-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Чтобы было понятно, где что лежит
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              Мы не заменяем договорённости между людьми, но помогаем держать порядок: статусы, резерв под заказ при
              необходимости, баланс и переписка рядом.
            </p>
            <ul className="mt-14 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Wallet,
                  title: "Баланс наглядно",
                  text: "Пополнение, резерв под заказ и списания видны в кабинете — понятно, что привязано к какой задаче.",
                },
                {
                  icon: MessageSquare,
                  title: "Переписка по делу",
                  text: "Сообщения и уведомления живут рядом с заказом, а не теряются в личке.",
                },
                {
                  icon: Shield,
                  title: "Кто-то на страже правил",
                  text: "Если случился спор или нужна настройка категорий — администрация на связи.",
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
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {trustVisuals.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                  <div className="relative aspect-[16/10]">
                    <Image src={item.src} alt={item.title} fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-border/50 py-20 sm:py-28">
          <div className="landing-mesh absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-10">
            <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.06] p-10 shadow-elevated sm:p-14 dark:to-primary/[0.09]">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Начните за пару минут</h2>
                <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground sm:text-lg">
                  Регистрация бесплатная. Выбираете роль, заполняете профиль и можете сразу начать работу.
                </p>
                <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" className="h-12 gap-2 rounded-xl px-10 text-base shadow-glow" asChild>
                    <Link href="/register">
                      Зарегистрироваться
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/80 bg-background/50 px-10 text-base" asChild>
                    <Link href="/login">Уже есть аккаунт — войти</Link>
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
              Маркетплейс услуг: заказчики и специалисты в одной экосистеме — портфолио, чат, статусы, опциональный резерв
              суммы под заказ до приёмки работы.
            </p>
            <p className="mt-3 text-sm">
              <a
                href={`mailto:${SITE_EMAIL_INFO}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {SITE_EMAIL_INFO}
              </a>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Обратная связь доступна в личном кабинете после входа: раздел{" "}
              <span className="font-medium text-foreground">«Обратная связь»</span> в меню слева.
            </p>
          </div>
          <div className="flex flex-col gap-6 sm:items-end sm:text-right">
            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium" aria-label="Нижняя навигация">
              <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
                Вход
              </Link>
              <Link href="/register" className="text-muted-foreground transition-colors hover:text-foreground">
                Начать бесплатно
              </Link>
              {landingNavLinks.map((l) =>
                l.href.startsWith("/") ? (
                  <Link
                    key={l.href}
                    href={l.href}
                    title={l.hint}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    title={l.hint}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ),
              )}
              <Link href="/legal" className="text-muted-foreground transition-colors hover:text-foreground">
                Документы
              </Link>
              <Link href="/legal/terms" className="text-muted-foreground transition-colors hover:text-foreground">
                Условия
              </Link>
              <Link href="/legal/fees" className="text-muted-foreground transition-colors hover:text-foreground">
                Комиссии
              </Link>
              <Link href="/legal/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                Конфиденциальность
              </Link>
            </nav>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DONE48</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
