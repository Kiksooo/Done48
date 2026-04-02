"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const REFERRAL_REWARD_RUBLES = 50;

export function ReferralCard({ link }: { link: string }) {
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
        Делитесь ссылкой: за каждого приглашённого человека, который зарегистрируется по ней, вы получаете{" "}
        {REFERRAL_REWARD_RUBLES}&nbsp;₽, а также уведомление в кабинете.
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
    </div>
  );
}

