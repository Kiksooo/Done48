import { z } from "zod";

function trimOrNull(s: string, max: number) {
  const t = s.trim();
  if (t.length === 0) return null;
  return t.slice(0, max);
}

const avatarUrlField = z
  .string()
  .max(2048)
  .transform((s) => s.trim())
  .refine(
    (s) => s.length === 0 || s.startsWith("/uploads/") || /^https?:\/\//i.test(s),
    "Аватар: укажите https:// ссылку или загрузите файл",
  )
  .transform((s) => (s.length === 0 ? null : s.slice(0, 2048)));

export const customerProfileUpdateSchema = z.object({
  displayName: z.string().max(120).transform((s) => trimOrNull(s, 120)),
  phone: z.string().max(64).transform((s) => trimOrNull(s, 64)),
  telegram: z.string().max(64).transform((s) => trimOrNull(s, 64)),
  company: z.string().max(200).transform((s) => trimOrNull(s, 200)),
  city: z.string().max(120).transform((s) => trimOrNull(s, 120)),
  avatarUrl: avatarUrlField,
});

/** Города для фильтра «доступные заказы»: строки из textarea / через запятую. */
function parseOrderCities(raw: string): string[] {
  const parts = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const uniq = Array.from(new Set(parts));
  return uniq.slice(0, 25).map((s) => s.slice(0, 120));
}

export const executorProfileUpdateSchema = z.object({
  displayName: z.string().max(120).transform((s) => trimOrNull(s, 120)),
  username: z
    .string()
    .max(64)
    .transform((s) => {
      const t = s.trim().toLowerCase();
      return t === "" ? null : t;
    })
    .refine((v) => v === null || /^[a-z0-9_]+$/.test(v), {
      message: "Username: только латиница, цифры и подчёркивание",
    }),
  phone: z.string().max(64).transform((s) => trimOrNull(s, 64)),
  telegram: z.string().max(64).transform((s) => trimOrNull(s, 64)),
  city: z.string().max(120).transform((s) => trimOrNull(s, 120)),
  orderCities: z
    .string()
    .max(4000)
    .transform((s) => parseOrderCities(s)),
  bio: z.string().max(2000).transform((s) => trimOrNull(s, 2000)),
  avatarUrl: avatarUrlField,
});
