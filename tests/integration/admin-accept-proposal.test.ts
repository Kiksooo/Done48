import { OrderStatus, ProposalStatus, Role, VisibilityType } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createAdminUser,
  createCustomerUser,
  createExecutorUser,
  createPendingProposal,
  createUnpaidOrder,
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
import { adminAcceptProposalAction } from "@/server/actions/orders/admin-orders";

describe.skipIf(!hasTestDatabase())("adminAcceptProposalAction", () => {
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

  it("назначает исполнителя по отклику и закрывает остальные PENDING", async () => {
    const customer = await createCustomerUser(0);
    const executor = await createExecutorUser(0, 0);
    const admin = await createAdminUser();

    const order = await createUnpaidOrder({
      customerId: customer.id,
      categoryId,
      budgetCents: 8000,
    });

    const prop = await createPendingProposal({
      orderId: order.id,
      executorId: executor.id,
    });

    const otherExec = await createExecutorUser(0, 0);
    const otherProp = await createPendingProposal({
      orderId: order.id,
      executorId: otherExec.id,
    });

    rbac.getSessionUserForAction.mockResolvedValue({
      id: admin.id,
      email: admin.email,
      role: Role.ADMIN,
      onboardingDone: true,
    });

    const res = await adminAcceptProposalAction({ proposalId: prop.id });
    expect(res).toEqual({ ok: true });

    const ord = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(ord.status).toBe(OrderStatus.ASSIGNED);
    expect(ord.executorId).toBe(executor.id);
    expect(ord.visibilityType).toBe(VisibilityType.PLATFORM_ASSIGN);

    const accepted = await prisma.proposal.findUniqueOrThrow({ where: { id: prop.id } });
    expect(accepted.status).toBe(ProposalStatus.ACCEPTED);

    const rejected = await prisma.proposal.findUniqueOrThrow({ where: { id: otherProp.id } });
    expect(rejected.status).toBe(ProposalStatus.REJECTED);

    await deleteUserCascade(customer.id);
    await deleteUserCascade(executor.id);
    await deleteUserCascade(otherExec.id);
    await prisma.user.delete({ where: { id: admin.id } });
  });
});
