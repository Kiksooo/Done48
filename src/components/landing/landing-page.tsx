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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            DONE48
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Основная навигация">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Войти</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Регистрация</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Маркетплейс микро-услуг в духе Fiverr — в одной платформе
              </p>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Находите исполнителей и заказы — без хаоса в переписке и таблицах
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
                DONE48 объединяет заказчиков и фрилансеров: вы публикуете задачу или откликаетесь на неё, общаетесь в
                кабинете, а статусы заказа, баланс и модерация встроены в процесс — как на крупных биржах вроде{" "}
                <span className="font-medium text-foreground">Fiverr</span>, но заточено под ваш внутренний цикл сделки.
              </p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Button size="lg" className="gap-2 shadow-elevated" asChild>
                  <Link href="/register">
                    Начать как заказчик
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 bg-card/80" asChild>
                  <Link href="/register">
                    <Briefcase className="h-4 w-4" aria-hidden />
                    Я исполнитель
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  Войти
                </Link>
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl">
              <div className="rounded-2xl border border-border bg-card/90 p-2 shadow-elevated backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-muted-foreground">
                  <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="text-sm sm:text-base">Например: лендинг за выходные, обложка для подкаста…</span>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                После регистрации вы сможете создавать реальные заказы и просматривать доступные задачи в кабинете.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 bg-muted/30 py-16 sm:py-20" aria-labelledby="for-whom-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 id="for-whom-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Для кого платформа
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Одна среда — две роли. Заказчики покупают результат, исполнители продают время и навыки, а правила и статусы
              одинаково понятны обеим сторонам.
            </p>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <article className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Users className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-xl font-semibold">Заказчикам</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Вам нужен текст, дизайн, правка сайта или другая разовая задача — без долгого поиска по чатам.
                </p>
                <ul className="mt-6 space-y-3">
                  {forCustomers.map((line) => (
                    <li key={line} className="flex gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Briefcase className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-xl font-semibold">Исполнителям</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Вы монетизируете навыки на коротких заказах — по аналогии с витриной услуг на Fiverr, но с прозрачным
                  циклом сделки внутри DONE48.
                </p>
                <ul className="mt-6 space-y-3">
                  {forExecutors.map((line) => (
                    <li key={line} className="flex gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20" aria-labelledby="how-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 id="how-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Как это работает
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              От идеи до закрытого заказа — четыре понятных шага. Администраторы следят за правилами площадки и помогают
              при сложных случаях.
            </p>
            <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <li
                  key={s.step}
                  className="relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {s.step}
                  </span>
                  <h3 className="font-semibold leading-snug">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-border/60 bg-muted/25 py-16 sm:py-20" aria-labelledby="categories-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="categories-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Популярные направления
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Как на крупных биржах, задачи группируются по типам — удобно и заказчику сформулировать запрос, и
                  исполнителю найти свой формат работы.
                </p>
              </div>
              <Layers className="hidden h-10 w-10 text-primary/40 sm:block" aria-hidden />
            </div>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2">
              {categories.map(({ icon: Icon, title, desc }) => (
                <li
                  key={title}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/25"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20" aria-labelledby="trust-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 id="trust-heading" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Прозрачность и контроль
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Платформа не заменяет договорённости сторон, но даёт структуру: статусы, баланс, история и каналы связи в
              одном интерфейсе.
            </p>
            <ul className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
              <li className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <Wallet className="mx-auto h-8 w-8 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">Баланс и платежи</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Учёт операций в кабинете — меньше ручных сверок и недопониманий по суммам.
                </p>
              </li>
              <li className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <MessageSquare className="mx-auto h-8 w-8 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">Коммуникации</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Сообщения и уведомления привязаны к заказам, а не теряются в мессенджерах.
                </p>
              </li>
              <li className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:col-span-1">
                <Shield className="mx-auto h-8 w-8 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">Модерация</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Администрация может подключаться к спорным сценариям и настройкам категорий.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-border/60 bg-gradient-to-b from-primary/8 via-background to-background py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Готовы попробовать?</h2>
            <p className="mt-4 text-muted-foreground">
              Зарегистрируйтесь, выберите роль и откройте кабинет — создание заказа или просмотр доступных задач займёт
              несколько минут.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">Создать аккаунт</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">У меня уже есть логин</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-primary">DONE48</p>
            <p className="mt-1 text-sm text-muted-foreground">Платформа микро-услуг для заказчиков и исполнителей.</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" aria-label="Нижняя навигация">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Вход
            </Link>
            <Link href="/register" className="text-muted-foreground hover:text-foreground">
              Регистрация
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
