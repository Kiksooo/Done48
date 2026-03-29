import { z } from "zod";

function trimOrNull(s: string, max: number) {
  const t = s.trim();
  if (t.length === 0) return null;
  return t.slice(0, max);
}

export const customerProfileUpdateSchema = z.object({
  displayName: z.string().max(120).transform((s) => trimOrNull(s, 120)),
  phone: z.string().max(64).transform((s) => trimOrNull(s, 64)),
  telegram: z.string().max(64).transform((s) => trimOrNull(s, 64)),
  company: z.string().max(200).transform((s) => trimOrNull(s, 200)),
  city: z.string().max(120).transform((s) => trimOrNull(s, 120)),
});

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
  bio: z.string().max(2000).transform((s) => trimOrNull(s, 2000)),
});
