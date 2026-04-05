import { describe, expect, it } from "vitest";
import { isPrismaTableDoesNotExist, isPrismaTransactionConflict } from "@/lib/prisma-errors";

describe("isPrismaTableDoesNotExist", () => {
  it("распознаёт P2021", () => {
    expect(isPrismaTableDoesNotExist({ code: "P2021" })).toBe(true);
  });

  it("распознаёт текст PostgreSQL про relation", () => {
    expect(
      isPrismaTableDoesNotExist({
        message: 'relation "OrderCustomerPartner" does not exist',
      }),
    ).toBe(true);
  });

  it("false для прочих ошибок", () => {
    expect(isPrismaTableDoesNotExist({ code: "P2002" })).toBe(false);
    expect(isPrismaTableDoesNotExist(new Error("fail"))).toBe(false);
  });
});

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
