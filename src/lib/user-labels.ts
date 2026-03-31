import type { ContactBlocklistKind, Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Администратор",
  CUSTOMER: "Заказчик",
  EXECUTOR: "Исполнитель",
};

export function roleRu(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

export const CONTACT_BLOCKLIST_KIND_LABELS: Record<ContactBlocklistKind, string> = {
  EMAIL: "Эл. почта",
  PHONE: "Телефон",
  TELEGRAM: "Telegram",
};

export function contactBlocklistKindRu(kind: string): string {
  return CONTACT_BLOCKLIST_KIND_LABELS[kind as ContactBlocklistKind] ?? kind;
}
