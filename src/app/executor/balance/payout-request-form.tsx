"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { executorRequestPayoutAction } from "@/server/actions/finance/executor-finance";

type Form = { amountRubles: number; payoutDetails: string };

export function PayoutRequestForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({
    defaultValues: { amountRubles: 1000, payoutDetails: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        startTransition(async () => {
          const r = await executorRequestPayoutAction(values);
          if (r.ok) {
            form.reset({ amountRubles: 1000, payoutDetails: "" });
            router.refresh();
          } else {
            form.setError("root", { message: r.error });
          }
        });
      })}
    >
      {form.formState.errors.root ? (
        <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="amount">Сумма вывода (₽)</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            step={1}
            disabled={pending}
            {...form.register("amountRubles", { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="details">Реквизиты / комментарий для админа</Label>
        <Textarea
          id="details"
          rows={4}
          disabled={pending}
          {...form.register("payoutDetails", { required: true })}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Отправка…" : "Подать заявку на вывод"}
      </Button>
    </form>
  );
}
