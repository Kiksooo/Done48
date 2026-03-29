import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({ value, className }: { value: number; className?: string }) {
  const v = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <div className={cn("flex items-center gap-0.5 text-amber-500", className)} aria-label={`Рейтинг ${v} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < v ? "fill-current" : "fill-none opacity-30")} aria-hidden />
      ))}
    </div>
  );
}
