"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function LandingHeroSearch({ className }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = query.trim();
    if (t.length > 0) {
      try {
        sessionStorage.setItem("done48.landingTaskHint", t);
      } catch {
        /* ignore */
      }
    }
    router.push("/register");
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("w-full max-w-2xl", className)}
      aria-label="Поиск задачи"
    >
      <div
        className={cn(
          "flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5",
          "ring-offset-background transition-[box-shadow] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        )}
      >
        <label className="flex min-h-12 flex-1 items-center gap-2 px-3 sm:pl-4">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="text"
            name="task"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: лендинг, уборка, замена смесителя"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
          />
        </label>
        <Button type="submit" className="h-12 shrink-0 rounded-xl px-6 font-semibold sm:h-11 sm:self-center sm:rounded-lg">
          Найти
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">После регистрации поможем быстро начать: разместить заказ или откликнуться на задачи.</p>
    </form>
  );
}
