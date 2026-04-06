"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendMarketingCampaignAction } from "@/server/actions/admin-marketing";

export function MarketingCampaignForm({
  subscribersTotal,
  mailerLiteBroadcastReady = false,
  disabled = false,
}: {
  subscribersTotal: number;
  /** Настроены ключ, MAILERLITE_CAMPAIGN_FROM и группы — можно дублировать рассылку в MailerLite. */
  mailerLiteBroadcastReady?: boolean;
  /** Страница не смогла загрузить счётчик (например, нет колонок в БД). */
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState<"ALL" | "CUSTOMER" | "EXECUTOR">("ALL");
  const [alsoMailerLiteEmail, setAlsoMailerLiteEmail] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      className="max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const res = await sendMarketingCampaignAction({
            title,
            body,
            targetRole,
            alsoMailerLiteEmail: mailerLiteBroadcastReady && alsoMailerLiteEmail,
          });
          if (!res.ok) {
            setMsg(res.error ?? "Ошибка отправки");
            return;
          }
          const count = res.data?.sent ?? 0;
          const ml = res.data?.mailerLite;
          let line =
            count > 0 ? `Отправлено: ${count} получателям (уведомления в кабинете)` : "Нет подписчиков по выбранному фильтру";
          if (ml) {
            line +=
              ml.ok === true
                ? ` · MailerLite: кампания ${ml.campaignId} отправлена`
                : ` · MailerLite: ошибка — ${ml.error}`;
          }
          setMsg(line);
          if (count > 0) {
            setTitle("");
            setBody("");
            setAlsoMailerLiteEmail(false);
          }
        });
      }}
    >
      <div>
        <h2 className="text-base font-semibold text-foreground">Маркетинговая рассылка</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Отправляется только пользователям с включённой подпиской. Сейчас подписчиков: {subscribersTotal}.
        </p>
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="mk-target">Кому отправить</Label>
        <select
          id="mk-target"
          className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value as "ALL" | "CUSTOMER" | "EXECUTOR")}
          disabled={pending || disabled}
        >
          <option value="ALL">Всем подписанным</option>
          <option value="CUSTOMER">Только заказчикам</option>
          <option value="EXECUTOR">Только специалистам</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mk-title">Заголовок</Label>
        <Input
          id="mk-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Новая функция в DONE48"
          disabled={pending || disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mk-body">Текст сообщения</Label>
        <Textarea
          id="mk-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Коротко о пользе, ссылке и следующем шаге."
          className="min-h-[140px]"
          disabled={pending || disabled}
        />
      </div>

      {mailerLiteBroadcastReady ? (
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={alsoMailerLiteEmail}
            onChange={(e) => setAlsoMailerLiteEmail(e.target.checked)}
            disabled={pending || disabled}
          />
          <span className="text-muted-foreground">
            Дублировать email-кампанией MailerLite (группы из <code className="text-xs">MAILERLITE_GROUP_ID</code>).
            Уведомления в кабинете отправляются в любом случае.
          </span>
        </label>
      ) : null}

      <Button
        type="submit"
        disabled={disabled || pending || title.trim().length < 3 || body.trim().length < 10}
      >
        {pending ? "Отправка..." : "Отправить рассылку"}
      </Button>
    </form>
  );
}
