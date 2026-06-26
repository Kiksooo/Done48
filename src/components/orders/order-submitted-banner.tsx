import { CheckCircle2 } from "lucide-react";
import { ORDER_SUBMITTED_BANNER } from "@/lib/brand-copy";

export function OrderSubmittedBanner() {
  return (
    <div
      className="flex gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-4 text-sm text-foreground dark:bg-primary/15"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <p className="leading-relaxed">{ORDER_SUBMITTED_BANNER}</p>
    </div>
  );
}
