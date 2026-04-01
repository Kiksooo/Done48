"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setMarketingOptInAction } from "@/server/actions/marketing";

export function MarketingSubscriptionCard({
  initialEnabled,
  initialEnabledAtIso,
}: {
  initialEnabled: boolean;
  initialEnabledAtIso: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">Рекламная рассылка продукта</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Новости платформы, новые функции и специальные предложения.
      </p>

      <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-border"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={pending}
        />
        <span className="text-sm text-foreground">Хочу получать рекламные и продуктовые рассылки</span>
      </label>

      {initialEnabledAtIso ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Подключено:{" "}
          {new Date(initialEnabledAtIso).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await setMarketingOptInAction(enabled);
              if (!res.ok) {
                setNote(res.error ?? "Не удалось сохранить");
                return;
              }
              setNote("Настройки рассылки обновлены");
            })
          }
        >
          {pending ? "Сохранение..." : "Сохранить"}
        </Button>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      </div>
    </div>
  );
}
