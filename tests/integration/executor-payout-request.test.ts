import { PayoutStatus, Role } from "@prisma/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createExecutorUser,
  deleteUserCascade,
  ensurePlatformSettings,
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
import { executorRequestPayoutAction } from "@/server/actions/finance/executor-finance";

describe.skipIf(!hasTestDatabase())("executorRequestPayoutAction", () => {
  beforeAll(async () => {
    await ensurePlatformSettings();
  });

  afterEach(() => {
    rbac.getSessionUserForAction.mockReset();
  });

  it("учитывает уже поданные заявки PENDING при лимите", async () => {
    const exec = await createExecutorUser(20_000, 10_000);
    rbac.getSessionUserForAction.mockResolvedValue({
      id: exec.id,
      email: exec.email,
      role: Role.EXECUTOR,
      onboardingDone: true,
    });

    const details = "Счёт 40817 тестовый реквизит";
    // 20_000 + 10_000 = 30_000 коп. доступно; по 12_000 коп. две заявки ок, третья — нет.
    const amountRubles = 120;

    const first = await executorRequestPayoutAction({
      amountRubles,
      payoutDetails: details,
    });
    expect(first.ok).toBe(true);

    const second = await executorRequestPayoutAction({
      amountRubles,
      payoutDetails: details,
    });
    expect(second.ok).toBe(true);

    const third = await executorRequestPayoutAction({
      amountRubles,
      payoutDetails: details,
    });
    expect(third.ok).toBe(false);
    expect(third).toMatchObject({ ok: false });
    if (!third.ok) {
      expect(third.error).toContain("Недостаточно");
    }

    const pending = await prisma.payout.count({
      where: { executorId: exec.id, status: PayoutStatus.PENDING },
    });
    expect(pending).toBe(2);

    await deleteUserCascade(exec.id);
  });
});
