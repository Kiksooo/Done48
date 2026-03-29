"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Оценка от 1 до 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          className={cn(
            "rounded p-0.5 transition-colors",
            disabled ? "opacity-50" : "hover:bg-amber-500/10",
          )}
          onClick={() => onChange(n)}
          aria-label={`${n} из 5`}
          aria-pressed={value === n}
        >
          <Star
            className={cn(
              "h-8 w-8",
              n <= value ? "fill-amber-400 text-amber-500" : "fill-none text-neutral-300 dark:text-neutral-600",
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">{value}/5</span>
    </div>
  );
}
