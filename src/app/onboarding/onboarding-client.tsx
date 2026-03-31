"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeOnboarding } from "@/server/actions/onboarding";

export function OnboardingClient() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Онбординг</CardTitle>
        <CardDescription>
          Краткое знакомство с платформой. Позже здесь можно расширить шаги заполнения профиля.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Нажмите «Продолжить», чтобы перейти в кабинет. Данные профиля можно заполнить в разделе настроек.
        </p>
        <Button type="button" onClick={handleContinue} disabled={loading}>
          {loading ? "Сохранение…" : "Продолжить в кабинет"}
        </Button>
      </CardContent>
    </Card>
  );
}
