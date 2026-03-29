import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Юридическая информация — DONE48",
  description: "Документы и правила сервиса DONE48.",
  alternates: { canonical: "/legal" },
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
      </ul>
    </div>
  );
}
