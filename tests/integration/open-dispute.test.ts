import { DisputeStatus, OrderStatus, Role } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createAssignedOrder,
  createCustomerUser,
  createExecutorUser,
  deleteCategory,
  deleteUserCascade,
  ensureTestCategory,
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
import { openDisputeAction } from "@/server/actions/disputes";

describe.skipIf(!hasTestDatabase())("openDisputeAction", () => {
  let categoryId: string;

  beforeAll(async () => {
    const cat = await ensureTestCategory();
    categoryId = cat.id;
  });

  afterAll(async () => {
    await deleteCategory(categoryId);
  });

  afterEach(() => {
    rbac.getSessionUserForAction.mockReset();
  });

  it("переводит заказ в DISPUTED и создаёт спор", async () => {
    const customer = await createCustomerUser(0);
    const executor = await createExecutorUser(0, 0);

    const order = await createAssignedOrder({
      customerId: customer.id,
      executorId: executor.id,
      categoryId,
    });

    rbac.getSessionUserForAction.mockResolvedValue({
      id: customer.id,
      email: customer.email,
      role: Role.CUSTOMER,
      onboardingDone: true,
    });

    const res = await openDisputeAction({
      orderId: order.id,
      reason: "1234567890 описание спора для теста",
    });
    expect(res).toEqual({ ok: true });

    const ord = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(ord.status).toBe(OrderStatus.DISPUTED);

    const d = await prisma.dispute.findFirst({
      where: { orderId: order.id, status: DisputeStatus.OPEN },
    });
    expect(d?.openedById).toBe(customer.id);

    await deleteUserCascade(customer.id);
    await deleteUserCascade(executor.id);
  });
});
