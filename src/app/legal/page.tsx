import type { Metadata } from "next";
import Link from "next/link";
import { SITE_EMAIL_INFO } from "@/lib/site-contact";

export const metadata: Metadata = {
  title: "Юридическая информация",
  description: "Документы и правила сервиса DONE48.",
  alternates: { canonical: "/legal" },
  openGraph: {
    title: "Юридическая информация",
    description: "Документы и правила сервиса DONE48.",
    url: "/legal",
  },
};

export default function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Юридическая информация</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Документы, регулирующие использование сервиса DONE48. Тексты носят информационный характер; при запуске в
        продакшене их следует согласовать с юристом под вашу модель и юрисдикцию.
      </p>
      <ul className="mt-8 space-y-4 text-base">
        <li>
          <Link href="/legal/terms" className="font-medium text-primary underline-offset-4 hover:underline">
            Пользовательское соглашение и правила площадки
          </Link>
        </li>
        <li>
          <Link href="/legal/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            Политика конфиденциальности и обработка персональных данных
          </Link>
        </li>
        <li>
          <Link href="/legal/unsubscribe" className="font-medium text-primary underline-offset-4 hover:underline">
            Управление рекламной рассылкой (подписка/отписка)
          </Link>
        </li>
      </ul>

      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Помощь и документы</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          По вопросам работы сервиса, документов, споров и технических проблем напишите в поддержку:
        </p>
        <p className="mt-2">
          <a href={`mailto:${SITE_EMAIL_INFO}`} className="font-medium text-primary underline-offset-4 hover:underline">
            {SITE_EMAIL_INFO}
          </a>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Чтобы ускорить ответ, укажите ID заказа/пользователя и коротко опишите ситуацию.
        </p>
      </section>
    </div>
  );
}
