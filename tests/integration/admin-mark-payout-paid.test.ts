import { PayoutStatus, Role, TransactionType } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAdminUser,
  createExecutorUser,
  deleteUserCascade,
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
import { adminMarkPayoutPaidAction } from "@/server/actions/finance/admin-finance";

describe.skipIf(!hasTestDatabase())("adminMarkPayoutPaidAction", () => {
  afterEach(() => {
    rbac.getSessionUserForAction.mockReset();
  });

  it("списывает холд и баланс и переводит заявку в PAID", async () => {
    const admin = await createAdminUser();
    const exec = await createExecutorUser(2000, 2000);

    const payout = await prisma.payout.create({
      data: {
        executorId: exec.id,
        amountCents: 3000,
        currency: "RUB",
        payoutDetails: "Реквизиты для выплаты тестом админа",
        status: PayoutStatus.APPROVED,
      },
    });

    rbac.getSessionUserForAction.mockResolvedValue({
      id: admin.id,
      email: admin.email,
      role: Role.ADMIN,
      onboardingDone: true,
    });

    const res = await adminMarkPayoutPaidAction({ payoutId: payout.id });
    expect(res).toEqual({ ok: true });

    const paid = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(paid.status).toBe(PayoutStatus.PAID);

    const profile = await prisma.executorProfile.findUniqueOrThrow({
      where: { userId: exec.id },
    });
    expect(profile.heldCents).toBe(0);
    expect(profile.balanceCents).toBe(1000);

    const ledger = await prisma.transaction.findFirst({
      where: { type: TransactionType.PAYOUT, fromUserId: exec.id },
    });
    expect(ledger?.amountCents).toBe(3000);

    await prisma.payout.delete({ where: { id: payout.id } });
    await deleteUserCascade(exec.id);
    await prisma.user.delete({ where: { id: admin.id } });
  });
});
