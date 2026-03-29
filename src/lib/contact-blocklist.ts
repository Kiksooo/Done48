import { ContactBlocklistKind } from "@prisma/client";
import { prisma } from "@/lib/db";

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Цифры и ведущий + для e.164-подобного ключа */
export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+") && d.length > 0) {
    return `+${d}`;
  }
  return d;
}

export function normalizeTelegram(raw: string): string {
  let s = raw.trim().toLowerCase();
  if (s.startsWith("@")) s = s.slice(1);
  if (s.startsWith("t.me/")) s = s.slice(5);
  return s.replace(/\/$/, "");
}

export function normalizeBlocklistValue(kind: ContactBlocklistKind, raw: string): string {
  switch (kind) {
    case "EMAIL":
      return normalizeEmail(raw);
    case "PHONE":
      return normalizePhone(raw);
    case "TELEGRAM":
      return normalizeTelegram(raw);
    default:
      return raw.trim().toLowerCase();
  }
}

export async function isContactBlocklisted(
  kind: ContactBlocklistKind,
  raw: string,
): Promise<boolean> {
  const valueNorm = normalizeBlocklistValue(kind, raw);
  if (!valueNorm) return false;
  const row = await prisma.contactBlocklist.findUnique({
    where: { kind_valueNorm: { kind, valueNorm } },
  });
  return Boolean(row);
}
