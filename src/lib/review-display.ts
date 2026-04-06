import type { Role } from "@prisma/client";

type MinimalFrom = {
  id: string;
  email: string;
  role: Role;
  customerProfile: { displayName: string | null; avatarUrl: string | null } | null;
  executorProfile: { displayName: string | null; username: string | null; avatarUrl: string | null } | null;
};

export function reviewerDisplayName(u: MinimalFrom, mode: "full" | "anonymous_role"): string {
  if (mode === "anonymous_role") {
    return u.role === "CUSTOMER" ? "Заказчик" : "Специалист";
  }
  if (u.role === "CUSTOMER") {
    return u.customerProfile?.displayName?.trim() || u.email.split("@")[0] || "Заказчик";
  }
  return (
    u.executorProfile?.displayName?.trim() ||
    (u.executorProfile?.username ? `@${u.executorProfile.username}` : null) ||
    u.email.split("@")[0] ||
    "Специалист"
  );
}

export function reviewerAvatarUrl(u: MinimalFrom): string | null {
  if (u.role === "CUSTOMER") {
    return u.customerProfile?.avatarUrl ?? null;
  }
  return u.executorProfile?.avatarUrl ?? null;
}
