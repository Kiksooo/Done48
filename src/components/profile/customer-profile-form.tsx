"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateCustomerProfileAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RussianCityInput } from "@/components/profile/russian-city-input";

type Props = {
  initial: {
    displayName: string | null;
    phone: string | null;
    telegram: string | null;
    company: string | null;
    city: string | null;
  };
};

export function CustomerProfileForm({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [telegram, setTelegram] = useState(initial.telegram ?? "");
  const [company, setCompany] = useState(initial.company ?? "");
  const [city, setCity] = useState(initial.city ?? "");

  return (
    <form
      className="max-w-lg space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const r = await updateCustomerProfileAction({
            displayName,
            phone,
            telegram,
            company,
            city,
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
        <Label htmlFor="dp">Отображаемое имя</Label>
        <Input id="dp" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ph">Телефон</Label>
        <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tg">Telegram</Label>
        <Input id="tg" value={telegram} onChange={(e) => setTelegram(e.target.value)} disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="co">Компания</Label>
        <Input id="co" value={company} onChange={(e) => setCompany(e.target.value)} disabled={pending} />
      </div>
      <RussianCityInput
        label="Город"
        value={city}
        onChange={setCity}
        disabled={pending}
        hint="Справочник городов России (~1100). Можно ввести свой вариант, если населённого пункта нет в списке."
      />
      <Button type="submit" disabled={pending}>
        Сохранить
      </Button>
    </form>
  );
}
