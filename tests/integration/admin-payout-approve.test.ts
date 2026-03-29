import { PayoutStatus, Role } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createExecutorUser, deleteUserCascade, hasTestDatabase } from "../helpers/factories";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const rbac = vi.hoisted(() => ({
  getSessionUserForAction: vi.fn(),
}));

vi.mock("@/lib/rbac", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/rbac")>();
  return { ...mod, getSessionUserForAction: rbac.getSessionUserForAction };
});

import { prisma } from "@/lib/db";
import { adminApprovePayoutAction } from "@/server/actions/finance/admin-finance";

describe.skipIf(!hasTestDatabase())("adminApprovePayoutAction", () => {
  afterEach(() => {
    rbac.getSessionUserForAction.mockReset();
  });

  it("переводит заявку PENDING → APPROVED один раз", async () => {
    const admin = await prisma.user.create({
      data: {
        email: `vitest-admin-apr-${Date.now()}@test.local`,
        passwordHash: "x",
        role: Role.ADMIN,
        onboardingDone: true,
        isActive: true,
        adminProfile: { create: { displayName: "A" } },
      },
    });

    const exec = await createExecutorUser(0, 0);
    rbac.getSessionUserForAction.mockResolvedValue({
      id: admin.id,
      email: admin.email,
      role: Role.ADMIN,
      onboardingDone: true,
    });

    const payout = await prisma.payout.create({
      data: {
        executorId: exec.id,
        amountCents: 500,
        currency: "RUB",
        payoutDetails: "Реквизиты для теста админом",
        status: PayoutStatus.PENDING,
      },
    });

    const ok = await adminApprovePayoutAction({ payoutId: payout.id });
    expect(ok).toEqual({ ok: true });

    const updated = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(updated.status).toBe(PayoutStatus.APPROVED);

    const dup = await adminApprovePayoutAction({ payoutId: payout.id });
    expect(dup.ok).toBe(false);
    if (!dup.ok) {
      expect(dup.error).toContain("уже обработана");
    }

    await prisma.payout.delete({ where: { id: payout.id } });
    await deleteUserCascade(exec.id);
    await prisma.user.delete({ where: { id: admin.id } });
  });
});
