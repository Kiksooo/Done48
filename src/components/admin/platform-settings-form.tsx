"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminUpdatePlatformSettingsAction } from "@/server/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  platformFeePercent: number;
  minPayoutRubles: number;
};

export function PlatformSettingsForm({ platformFeePercent, minPayoutRubles }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [fee, setFee] = useState(String(platformFeePercent));
  const [minPayout, setMinPayout] = useState(String(minPayoutRubles));

  return (
    <form
      className="max-w-md space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const r = await adminUpdatePlatformSettingsAction({
            platformFeePercent: Number(fee),
            minPayoutRubles: Number(minPayout),
          });
          if (!r.ok) {
            setMsg(r.error ?? "Ошибка");
            return;
          }
          router.refresh();
        });
      }}
    >
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="fee">Комиссия платформы, %</Label>
        <Input
          id="fee"
          type="number"
          step="0.01"
          min={0}
          max={100}
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          disabled={pending}
        />
        <p className="text-xs text-neutral-500">Удерживается из бюджета заказа при принятии работы заказчиком.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="minp">Минимальная сумма выплаты, ₽</Label>
        <Input
          id="minp"
          type="number"
          step="0.01"
          min={0}
          value={minPayout}
          onChange={(e) => setMinPayout(e.target.value)}
          disabled={pending}
        />
        <p className="text-xs text-neutral-500">Используется при проверке заявок исполнителей (логика заявок — на карточке баланса).</p>
      </div>
      <Button type="submit" disabled={pending}>
        Сохранить
      </Button>
    </form>
  );
}
