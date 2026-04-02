"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { REFERRAL_REWARD_RUBLES } from "@/lib/referral";

export type ReferralHistoryItem = {
  id: string;
  maskedEmail: string;
  registeredAtIso: string;
  rewardRubles: number;
};

export function ReferralCard({
  link,
  history,
  totalEarnedRubles,
}: {
  link: string;
  history?: ReferralHistoryItem[];
  totalEarnedRubles?: number;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-card p-4 dark:border-neutral-700">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Реферальная ссылка</h3>
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
        Делитесь ссылкой: за каждого приглашённого, кто зарегистрируется по ней, на баланс начисляется{" "}
        {REFERRAL_REWARD_RUBLES}&nbsp;₽, приходит уведомление, а список регистраций — ниже и в разделе «Баланс».
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          className="h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-xs text-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
        />
        <Button type="button" variant="outline" onClick={onCopy} className="shrink-0">
          {copied ? "Скопировано" : "Скопировать"}
        </Button>
      </div>
      {history !== undefined && history.length > 0 ? (
        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
            Приглашённые регистрации
            {typeof totalEarnedRubles === "number" ? (
              <span className="ml-1 font-normal text-neutral-600 dark:text-neutral-400">
                · всего начислено {totalEarnedRubles}&nbsp;₽
              </span>
            ) : null}
          </p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs text-neutral-600 dark:text-neutral-400">
            {history.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-800">
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{row.maskedEmail}</span>
                <span className="shrink-0 text-neutral-500">
                  {new Date(row.registeredAtIso).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  +{row.rewardRubles}&nbsp;₽
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : history !== undefined && history.length === 0 ? (
        <p className="mt-4 border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-neutral-700">
          Пока никто не зарегистрировался по вашей ссылке. Сумма начислений появится здесь после первой регистрации.
        </p>
      ) : null}
    </div>
  );
}

