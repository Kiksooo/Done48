import { PaymentStatus, Role, TransactionType } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createCustomerUser,
  createUnpaidOrder,
  deleteUserCascade,
  ensureTestCategory,
  deleteCategory,
  hasTestDatabase,
} from "../helpers/factories";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const rbac = vi.hoisted(() => ({
  getSessionUserForAction: vi.fn(),
}));

vi.mock("@/lib/rbac", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/rbac")>();
  return { ...mod, getSessionUserForAction: rbac.getSessionUserForAction };
});

import { prisma } from "@/lib/db";
import { customerReserveOrderAction } from "@/server/actions/finance/customer-finance";

describe.skipIf(!hasTestDatabase())("customerReserveOrderAction", () => {
  let categoryId: string;

  beforeAll(async () => {
    const cat = await ensureTestCategory();
    categoryId = cat.id;
  });

  afterAll(async () => {
    await deleteCategory(categoryId);
  });

  afterEach(async () => {
    rbac.getSessionUserForAction.mockReset();
  });

  it("резервирует средства и переводит заказ в RESERVED", async () => {
    const customer = await createCustomerUser(50_000);
    rbac.getSessionUserForAction.mockResolvedValue({
      id: customer.id,
      email: customer.email,
      role: Role.CUSTOMER,
      onboardingDone: true,
    });

    const order = await createUnpaidOrder({
      customerId: customer.id,
      categoryId,
      budgetCents: 10_000,
    });

    const before = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customer.id },
    });

    const res = await customerReserveOrderAction({ orderId: order.id });
    expect(res).toEqual({ ok: true });

    const after = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customer.id },
    });
    expect(after.balanceCents).toBe(before.balanceCents - 10_000);

    const ord = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(ord.paymentStatus).toBe(PaymentStatus.RESERVED);

    const txRow = await prisma.transaction.findFirst({
      where: { orderId: order.id, type: TransactionType.RESERVE },
    });
    expect(txRow?.amountCents).toBe(10_000);

    await deleteUserCascade(customer.id);
  });

  it("отклоняет повторный резерв", async () => {
    const customer = await createCustomerUser(50_000);
    rbac.getSessionUserForAction.mockResolvedValue({
      id: customer.id,
      email: customer.email,
      role: Role.CUSTOMER,
      onboardingDone: true,
    });

    const order = await createUnpaidOrder({
      customerId: customer.id,
      categoryId,
      budgetCents: 5_000,
    });

    const first = await customerReserveOrderAction({ orderId: order.id });
    expect(first.ok).toBe(true);

    const second = await customerReserveOrderAction({ orderId: order.id });
    expect(second.ok).toBe(false);

    await deleteUserCascade(customer.id);
  });

  it("отклоняет при недостатке средств", async () => {
    const customer = await createCustomerUser(1_000);
    rbac.getSessionUserForAction.mockResolvedValue({
      id: customer.id,
      email: customer.email,
      role: Role.CUSTOMER,
      onboardingDone: true,
    });

    const order = await createUnpaidOrder({
      customerId: customer.id,
      categoryId,
      budgetCents: 5_000,
    });

    const res = await customerReserveOrderAction({ orderId: order.id });
    expect(res).toEqual({
      ok: false,
      error: "Недостаточно средств на балансе",
    });

    const ord = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(ord.paymentStatus).toBe(PaymentStatus.UNPAID);

    await deleteUserCascade(customer.id);
  });
});
