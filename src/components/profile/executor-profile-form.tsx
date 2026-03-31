"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateExecutorProfileAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarField } from "@/components/profile/avatar-field";
import { executorAccountStatusRu } from "@/lib/executor-labels";

type Props = {
  initial: {
    displayName: string | null;
    username: string | null;
    phone: string | null;
    telegram: string | null;
    city: string | null;
    bio: string | null;
    accountStatus: string;
    avatarUrl: string | null;
  };
};

export function ExecutorProfileForm({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [telegram, setTelegram] = useState(initial.telegram ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Статус анкеты: <span className="font-medium">{executorAccountStatusRu(initial.accountStatus)}</span>
      </p>
      <form
        className="max-w-lg space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          startTransition(async () => {
            const r = await updateExecutorProfileAction({
              displayName,
              username,
              phone,
              telegram,
              city,
              bio,
              avatarUrl,
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
        <AvatarField idPrefix="ex" value={avatarUrl} onChange={setAvatarUrl} disabled={pending} />
        <div className="space-y-2">
          <Label htmlFor="ex-dp">Отображаемое имя</Label>
          <Input
            id="ex-dp"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex-un">Username (уникальный)</Label>
          <Input
            id="ex-un"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            disabled={pending}
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex-ph">Телефон</Label>
          <Input id="ex-ph" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex-tg">Telegram</Label>
          <Input id="ex-tg" value={telegram} onChange={(e) => setTelegram(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex-city">Город</Label>
          <Input id="ex-city" value={city} onChange={(e) => setCity(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex-bio">О себе</Label>
          <Textarea id="ex-bio" value={bio} onChange={(e) => setBio(e.target.value)} disabled={pending} />
        </div>
        <Button type="submit" disabled={pending}>
          Сохранить
        </Button>
      </form>
    </div>
  );
}
