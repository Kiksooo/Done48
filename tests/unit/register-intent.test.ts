import { describe, expect, it } from "vitest";
import { parseRegisterRoleFromSearchParam } from "@/lib/register-intent";

describe("parseRegisterRoleFromSearchParam", () => {
  it("понимает executor и customer", () => {
    expect(parseRegisterRoleFromSearchParam("executor")).toBe("EXECUTOR");
    expect(parseRegisterRoleFromSearchParam("EXECUTOR")).toBe("EXECUTOR");
    expect(parseRegisterRoleFromSearchParam("customer")).toBe("CUSTOMER");
    expect(parseRegisterRoleFromSearchParam("исполнитель")).toBe("EXECUTOR");
    expect(parseRegisterRoleFromSearchParam("заказчик")).toBe("CUSTOMER");
  });

  it("берёт первый элемент массива", () => {
    expect(parseRegisterRoleFromSearchParam(["executor", "customer"])).toBe("EXECUTOR");
  });

  it("возвращает undefined для мусора", () => {
    expect(parseRegisterRoleFromSearchParam(undefined)).toBeUndefined();
    expect(parseRegisterRoleFromSearchParam("")).toBeUndefined();
    expect(parseRegisterRoleFromSearchParam("admin")).toBeUndefined();
  });
});
