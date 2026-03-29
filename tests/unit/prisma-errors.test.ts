import { describe, expect, it } from "vitest";
import { isPrismaTransactionConflict } from "@/lib/prisma-errors";

describe("isPrismaTransactionConflict", () => {
  it("распознаёт Prisma P2034", () => {
    expect(isPrismaTransactionConflict({ code: "P2034" })).toBe(true);
  });

  it("возвращает false для прочих ошибок", () => {
    expect(isPrismaTransactionConflict(new Error("fail"))).toBe(false);
    expect(isPrismaTransactionConflict({ code: "P2002" })).toBe(false);
    expect(isPrismaTransactionConflict(null)).toBe(false);
  });
});
