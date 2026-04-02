import { describe, expect, it } from "vitest";
import { createCustomerUser, deleteUserCascade, hasTestDatabase } from "../helpers/factories";
import { prisma } from "@/lib/db";
import { registerUser } from "@/server/actions/register";

describe.skipIf(!hasTestDatabase())("registerUser referral ref", () => {
  it("создаёт уведомление пригласившему при валидном ref", async () => {
    const inviter = await createCustomerUser(0);
    const email = `referral-invitee-${Date.now()}@test.local`;
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", "vitest-pass-12");
    fd.set("role", "CUSTOMER");
    fd.set("ref", inviter.id);

    const res = await registerUser(undefined, fd);
    expect(res?.ok).toBe(true);

    const newbie = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    expect(newbie).toBeTruthy();

    const note = await prisma.notification.findFirst({
      where: {
        userId: inviter.id,
        title: "Новая регистрация по вашей ссылке",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(note).toBeTruthy();
    expect(note?.body ?? "").toContain(email);

    if (newbie) await deleteUserCascade(newbie.id);
    await deleteUserCascade(inviter.id);
  });

  it("не падает и не шлёт уведомление при несуществующем ref", async () => {
    const email = `referral-no-inviter-${Date.now()}@test.local`;
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", "vitest-pass-12");
    fd.set("role", "CUSTOMER");
    fd.set("ref", "clxxxxxxxxxxxxxxxxxxxxxxxxx");

    const res = await registerUser(undefined, fd);
    expect(res?.ok).toBe(true);

    const newbie = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    expect(newbie).toBeTruthy();

    const orphanNotes = await prisma.notification.count({
      where: { title: "Новая регистрация по вашей ссылке", body: { contains: email } },
    });
    expect(orphanNotes).toBe(0);

    if (newbie) await deleteUserCascade(newbie.id);
  });
});
