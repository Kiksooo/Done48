import { Briefcase, MapPin, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  employmentType?: string | null;
  location?: string | null;
  salaryHint?: string | null;
  className?: string;
  size?: "default" | "lg";
};

export function VacancyMetaChips({ employmentType, location, salaryHint, className, size = "default" }: Props) {
  const items = [
    employmentType?.trim() ? { key: "emp", label: employmentType.trim(), icon: Briefcase } : null,
    location?.trim() ? { key: "loc", label: location.trim(), icon: MapPin } : null,
    salaryHint?.trim() ? { key: "sal", label: salaryHint.trim(), icon: Wallet } : null,
  ].filter(Boolean) as { key: string; label: string; icon: typeof Briefcase }[];

  if (items.length === 0) return null;

  const pill =
    size === "lg"
      ? "gap-2 rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2 text-sm text-foreground shadow-sm backdrop-blur-sm dark:bg-muted/25"
      : "gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-foreground dark:bg-muted/20";

  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Кратко об условиях">
      {items.map(({ key, label, icon: Icon }) => (
        <li key={key}>
          <Badge
            variant="outline"
            className={cn("h-auto max-w-full items-center font-normal shadow-none", pill)}
          >
            <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="min-w-0 break-words">{label}</span>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
