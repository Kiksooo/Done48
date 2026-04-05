import type { Role } from "@prisma/client";

export const REGISTER_HREF_EXECUTOR = "/register?role=executor";
export const REGISTER_HREF_CUSTOMER = "/register?role=customer";

/** Роль из query `?role=` на странице регистрации (латиница в URL). */
export function parseRegisterRoleFromSearchParam(
  raw: string | string[] | undefined,
): Extract<Role, "CUSTOMER" | "EXECUTOR"> | undefined {
  if (raw === undefined) return undefined;
  const s = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase() ?? "";
  if (s === "executor" || s === "исполнитель") return "EXECUTOR";
  if (s === "customer" || s === "заказчик") return "CUSTOMER";
  return undefined;
}
