"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerDemoTopUpAction } from "@/server/actions/finance/customer-finance";
import { customerOplatumStartTopUpAction } from "@/server/actions/finance/oplatum-topup";

type Form = { rubles: number };

type Props = {
  oplatumConfigured: boolean;
  showDemoTopUp: boolean;
  /** Полный URL для подсказки в кабинете Oplatum */
  webhookEndpointUrl: string;
  oplatumCheckoutButtonLabel: string;
};

export function CustomerTopUpForm({
  oplatumConfigured,
  showDemoTopUp,
  webhookEndpointUrl,
  oplatumCheckoutButtonLabel,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({ defaultValues: { rubles: 1000 } });

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {form.formState.errors.root ? (
        <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="rubles">Сумма (₽)</Label>
          <Input
            id="rubles"
            type="number"
            min={1}
            step={1}
            disabled={pending}
            {...form.register("rubles", { valueAsNumber: true })}
          />
        </div>
        {oplatumConfigured ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              form.handleSubmit((values) => {
                startTransition(async () => {
                  const r = await customerOplatumStartTopUpAction(values);
                  if (r.ok && r.data?.checkoutUrl) {
                    window.location.assign(r.data.checkoutUrl);
                    return;
                  }
                  form.setError("root", { message: r.ok ? "Нет ссылки оплаты" : r.error });
                });
              })();
            }}
          >
            {pending ? "…" : oplatumCheckoutButtonLabel}
          </Button>
        ) : null}
        {showDemoTopUp ? (
          <Button
            type="button"
            variant={oplatumConfigured ? "outline" : "default"}
            disabled={pending}
            onClick={() => {
              form.handleSubmit((values) => {
                startTransition(async () => {
                  const r = await customerDemoTopUpAction(values);
                  if (r.ok) {
                    form.reset({ rubles: 1000 });
                    router.refresh();
                  } else {
                    form.setError("root", { message: r.error });
                  }
                });
              })();
            }}
          >
            {pending ? "…" : "Пополнить (демо)"}
          </Button>
        ) : null}
      </div>
      {oplatumConfigured ? (
        <p className="text-xs text-neutral-500">
          Оплата через кассу Oplatum (СБП или иные методы по настройке). После оплаты баланс обновится по вебхуку. URL
          вебхука в кабинете:{" "}
          <span className="break-all font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
            {webhookEndpointUrl}
          </span>
        </p>
      ) : (
        <p className="text-xs text-neutral-500">
          Реальная оплата не настроена — задайте OPLATUM_SECRET_KEY и OPLATUM_WEBHOOK_SECRET в окружении.
        </p>
      )}
    </form>
  );
}
