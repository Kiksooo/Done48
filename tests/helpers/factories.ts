import {
  BudgetType,
  ExecutorAccountStatus,
  OrderStatus,
  PaymentStatus,
  Role,
  VisibilityType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export function hasTestDatabase() {
  return Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
}

function suffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function ensureTestCategory() {
  const slug = `vitest-${suffix()}`;
  return prisma.category.create({
    data: { name: "Vitest", slug, sortOrder: 9999 },
  });
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } }).catch(() => undefined);
}

export async function createCustomerUser(balanceCents: number) {
  const hash = await bcrypt.hash("vitest-pass", 12);
  return prisma.user.create({
    data: {
      email: `vitest-cust-${suffix()}@test.local`,
      passwordHash: hash,
      role: Role.CUSTOMER,
      onboardingDone: true,
      isActive: true,
      customerProfile: {
        create: { displayName: "Vitest customer", balanceCents },
      },
    },
    include: { customerProfile: true },
  });
}

export async function createExecutorUser(heldCents: number, balanceCents: number) {
  const hash = await bcrypt.hash("vitest-pass", 12);
  return prisma.user.create({
    data: {
      email: `vitest-exec-${suffix()}@test.local`,
      passwordHash: hash,
      role: Role.EXECUTOR,
      onboardingDone: true,
      isActive: true,
      executorProfile: {
        create: {
          displayName: "Vitest executor",
          accountStatus: ExecutorAccountStatus.ACTIVE,
          heldCents,
          balanceCents,
        },
      },
    },
    include: { executorProfile: true },
  });
}

export async function createAdminUser() {
  const hash = await bcrypt.hash("vitest-pass", 12);
  return prisma.user.create({
    data: {
      email: `vitest-admin-${suffix()}@test.local`,
      passwordHash: hash,
      role: Role.ADMIN,
      onboardingDone: true,
      isActive: true,
      adminProfile: { create: { displayName: "Vitest admin" } },
    },
  });
}

export async function createUnpaidOrder(params: {
  customerId: string;
  categoryId: string;
  budgetCents: number;
  status?: OrderStatus;
}) {
  const order = await prisma.order.create({
    data: {
      customerId: params.customerId,
      title: "Vitest order",
      description: "Vitest",
      categoryId: params.categoryId,
      budgetCents: params.budgetCents,
      budgetType: BudgetType.FIXED,
      status: params.status ?? OrderStatus.PUBLISHED,
      visibilityType: VisibilityType.OPEN_FOR_RESPONSES,
      paymentStatus: PaymentStatus.UNPAID,
    },
  });
  const chat = await prisma.chat.create({ data: { orderId: order.id } });
  await prisma.chatMember.create({
    data: { chatId: chat.id, userId: params.customerId },
  });
  return order;
}

export async function deleteUserCascade(userId: string) {
  const orders = await prisma.order.findMany({
    where: { OR: [{ customerId: userId }, { executorId: userId }] },
    select: { id: true },
  });
  for (const o of orders) {
    await prisma.order.delete({ where: { id: o.id } });
  }
  await prisma.payout.deleteMany({ where: { executorId: userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

export async function ensurePlatformSettings() {
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", minPayoutCents: 100 },
    update: { minPayoutCents: 100 },
  });
}
