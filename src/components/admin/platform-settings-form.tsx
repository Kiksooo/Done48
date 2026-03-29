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
  moderateAllNewOrders: boolean;
  requireExecutorVerificationForProposals: boolean;
  maxExecutorProposalsPerDay: number;
};

export function PlatformSettingsForm({
  platformFeePercent,
  minPayoutRubles,
  moderateAllNewOrders: initialModerate,
  requireExecutorVerificationForProposals: initialReqVer,
  maxExecutorProposalsPerDay: initialMaxProp,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [fee, setFee] = useState(String(platformFeePercent));
  const [minPayout, setMinPayout] = useState(String(minPayoutRubles));
  const [moderateAllNewOrders, setModerateAllNewOrders] = useState(initialModerate);
  const [requireExecutorVerification, setRequireExecutorVerification] = useState(initialReqVer);
  const [maxProposalsDay, setMaxProposalsDay] = useState(String(initialMaxProp));

  return (
    <form
      className="max-w-lg space-y-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const r = await adminUpdatePlatformSettingsAction({
            platformFeePercent: Number(fee),
            minPayoutRubles: Number(minPayout),
            moderateAllNewOrders,
            requireExecutorVerificationForProposals: requireExecutorVerification,
            maxExecutorProposalsPerDay: Number(maxProposalsDay),
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

      <div className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold">Антифрод и модерация</h2>
        <p className="text-xs text-neutral-500">
          Снижает риск мошенничества и массового спама; настройте под свою политику.
        </p>
        <div className="flex items-start gap-2">
          <input
            id="moderateAll"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-neutral-300"
            checked={moderateAllNewOrders}
            onChange={(e) => setModerateAllNewOrders(e.target.checked)}
            disabled={pending}
          />
          <div>
            <Label htmlFor="moderateAll" className="font-medium">
              Все новые заказы — только «На модерации»
            </Label>
            <p className="mt-0.5 text-xs text-neutral-500">
              Заказ не попадёт к исполнителям, пока админ не опубликует его. Рекомендуется для старта.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <input
            id="reqVer"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-neutral-300"
            checked={requireExecutorVerification}
            onChange={(e) => setRequireExecutorVerification(e.target.checked)}
            disabled={pending}
          />
          <div>
            <Label htmlFor="reqVer" className="font-medium">
              Отклики только после верификации исполнителя
            </Label>
            <p className="mt-0.5 text-xs text-neutral-500">
              Статус документов в профиле должен быть «Одобрено». Иначе отклик заблокирован.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxProp">Лимит откликов с одного аккаунта за сутки</Label>
          <Input
            id="maxProp"
            type="number"
            min={0}
            max={500}
            step={1}
            value={maxProposalsDay}
            onChange={(e) => setMaxProposalsDay(e.target.value)}
            disabled={pending}
          />
          <p className="text-xs text-neutral-500">0 — без лимита (не рекомендуется при открытой витрине).</p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Финансы</h2>
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
          <p className="text-xs text-neutral-500">Используется при проверке заявок исполнителей.</p>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        Сохранить
      </Button>
    </form>
  );
}
