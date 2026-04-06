"use client";

import type { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeOnboarding } from "@/server/actions/onboarding";

const CUSTOMER_HINTS = [
  "Создавайте заказы с бюджетом и сроком — после модерации их увидят специалисты.",
  "В карточке заказа можно зарезервировать сумму под сделку: специалист получит оплату после вашей приёмки работы.",
  "Переписка и файлы живут в одной карточке заказа — контекст не теряется.",
];

const EXECUTOR_HINTS = [
  "В разделе «Доступные заказы» откликайтесь с условиями и коротким сообщением.",
  "После выбора заказчиком статусы и чат ведутся в карточке заказа.",
  "Баланс и заявки на вывод — в разделе «Баланс и выплаты».",
];

const ADMIN_HINTS = [
  "Заказы, пользователи, модерация и финансы — в разделах меню слева.",
  "Журнал аудита фиксирует важные действия на площадке.",
];

export function OnboardingClient({ role }: { role: Role }) {
  const { update } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setError(null);
    setLoading(true);
    const result = await completeOnboarding();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    await update({ onboardingDone: true });
    router.refresh();
    router.push("/");
    setLoading(false);
  }

  const hints =
    role === "EXECUTOR" ? EXECUTOR_HINTS : role === "ADMIN" ? ADMIN_HINTS : CUSTOMER_HINTS;
  /** После «как» — именительный падеж: «вошли как заказчик», не «как заказчика». */
  const roleLabel =
    role === "EXECUTOR" ? "специалист" : role === "ADMIN" ? "администратор" : "заказчик";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добро пожаловать в DONE48</CardTitle>
        <CardDescription>
          Вы вошли как {roleLabel}. Ниже — коротко, как пользоваться площадкой; профиль можно дополнить в любой момент в
          кабинете.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <ul className="space-y-2.5 text-sm text-neutral-700 dark:text-neutral-300">
          {hints.map((line) => (
            <li key={line} className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Вопросы — через «Чат с админом» в меню или почту поддержки в подвале боковой панели после входа.
        </p>
        <Button type="button" onClick={handleContinue} disabled={loading} className="w-full sm:w-auto">
          {loading ? "Сохранение…" : "Перейти в кабинет"}
        </Button>
      </CardContent>
    </Card>
  );
}
