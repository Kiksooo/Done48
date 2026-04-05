import type { OrderStatus, Prisma } from "@prisma/client";
import { isPrismaTableDoesNotExist } from "@/lib/prisma-errors";
import { prisma } from "@/lib/db";

/** Заказы, где пользователь основной заказчик или соучастник. */
export function ordersVisibleToCustomerWhere(customerId: string): Prisma.OrderWhereInput {
  return {
    OR: [
      { customerId },
      { customerPartners: { some: { userId: customerId } } },
    ],
  };
}

const orderListInclude = {
  category: { select: { name: true } },
  subcategory: { select: { name: true } },
  customer: {
    select: {
      id: true,
      email: true,
      customerProfile: { select: { city: true } },
    },
  },
  executor: { select: { id: true, email: true } },
} satisfies Prisma.OrderInclude;

export type OrderListRow = Prisma.OrderGetPayload<{ include: typeof orderListInclude }>;

export async function listOrdersForAdmin(filters?: { status?: OrderStatus | "ALL" }) {
  const where =
    filters?.status && filters.status !== "ALL" ? { status: filters.status } : undefined;
  return prisma.order.findMany({
    where,
    include: orderListInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function listOrdersForCustomer(
  customerId: string,
  filter: CustomerOrderFilter,
) {
  const statusIn = customerFilterToStatuses(filter);
  const where: Prisma.OrderWhereInput = {
    ...ordersVisibleToCustomerWhere(customerId),
    ...(statusIn ? { status: { in: statusIn } } : {}),
  };
  try {
    return await prisma.order.findMany({
      where,
      include: orderListInclude,
      orderBy: { updatedAt: "desc" },
    });
  } catch (e) {
    if (!isPrismaTableDoesNotExist(e)) throw e;
    return prisma.order.findMany({
      where: {
        customerId,
        ...(statusIn ? { status: { in: statusIn } } : {}),
      },
      include: orderListInclude,
      orderBy: { updatedAt: "desc" },
    });
  }
}

export type CustomerOrderFilter =
  | "all"
  | "new"
  | "active"
  | "review"
  | "done"
  | "disputed"
  | "canceled";

function customerFilterToStatuses(filter: CustomerOrderFilter): OrderStatus[] | undefined {
  switch (filter) {
    case "all":
      return undefined;
    case "new":
      return ["NEW", "ON_MODERATION", "PUBLISHED"];
    case "active":
      return ["ASSIGNED", "IN_PROGRESS", "REVISION"];
    case "review":
      return ["SUBMITTED"];
    case "done":
      return ["ACCEPTED", "COMPLETED"];
    case "disputed":
      return ["DISPUTED"];
    case "canceled":
      return ["CANCELED"];
    default:
      return undefined;
  }
}

export async function listMyExecutorOrders(executorId: string) {
  return prisma.order.findMany({
    where: {
      executorId,
      status: { notIn: ["DRAFT"] },
    },
    include: orderListInclude,
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Заказы с открытыми откликами. Если у исполнителя заданы `orderCities`, показываем заказы,
 * где город заказчика совпадает (без учёта регистра) или город не указан / нет профиля.
 */
export async function listAvailableOrdersForExecutor(executorUserId: string) {
  const profile = await prisma.executorProfile.findUnique({
    where: { userId: executorUserId },
    select: { orderCities: true },
  });

  const cities = Array.from(
    new Set((profile?.orderCities ?? []).map((c) => c.trim()).filter(Boolean)),
  );

  const base: Prisma.OrderWhereInput[] = [
    { status: "PUBLISHED" },
    { visibilityType: "OPEN_FOR_RESPONSES" },
    { executorId: null },
  ];

  if (cities.length === 0) {
    return prisma.order.findMany({
      where: { AND: base },
      include: orderListInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  const cityMatch: Prisma.OrderWhereInput[] = [
    { customer: { customerProfile: null } },
    {
      customer: {
        customerProfile: { is: { OR: [{ city: null }, { city: "" }] } },
      },
    },
  ];
  for (const city of cities) {
    cityMatch.push({
      customer: {
        customerProfile: {
          is: { city: { equals: city, mode: "insensitive" } },
        },
      },
    });
  }

  return prisma.order.findMany({
    where: {
      AND: [...base, { OR: cityMatch }],
    },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

const orderDetailIncludeBase = {
  category: true,
  subcategory: true,
  customer: {
    select: {
      id: true,
      email: true,
      customerProfile: { select: { city: true, displayName: true } },
    },
  },
  executor: {
    select: {
      id: true,
      email: true,
      executorProfile: { select: { displayName: true, username: true } },
    },
  },
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  proposals: {
    include: {
      executor: {
        select: {
          id: true,
          email: true,
          executorProfile: { select: { displayName: true, username: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.OrderInclude;

export async function getOrderDetailForPage(orderId: string) {
  const includeWithPartners = {
    ...orderDetailIncludeBase,
    customerPartners: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            customerProfile: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" as const },
    },
  } satisfies Prisma.OrderInclude;

  try {
    const row = await prisma.order.findUnique({
      where: { id: orderId },
      include: includeWithPartners,
    });
    return row;
  } catch (e) {
    if (!isPrismaTableDoesNotExist(e)) throw e;
    const row = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderDetailIncludeBase,
    });
    if (!row) return null;
    return { ...row, customerPartners: [] };
  }
}

export async function listExecutorsForSelect() {
  return prisma.user.findMany({
    where: { role: "EXECUTOR", isActive: true },
    select: {
      id: true,
      email: true,
      executorProfile: { select: { displayName: true, username: true } },
    },
    orderBy: { email: "asc" },
  });
}

export async function countCustomerOrdersByBucket(customerId: string) {
  const base = ordersVisibleToCustomerWhere(customerId);
  try {
    const [active, waiting, review] = await Promise.all([
      prisma.order.count({
        where: { ...base, status: { in: ["ASSIGNED", "IN_PROGRESS", "REVISION"] } },
      }),
      prisma.order.count({
        where: { ...base, status: { in: ["NEW", "ON_MODERATION", "PUBLISHED"] } },
      }),
      prisma.order.count({
        where: { ...base, status: "SUBMITTED" },
      }),
    ]);
    return { active, waiting, review };
  } catch (e) {
    if (!isPrismaTableDoesNotExist(e)) throw e;
    const [active, waiting, review] = await Promise.all([
      prisma.order.count({
        where: { customerId, status: { in: ["ASSIGNED", "IN_PROGRESS", "REVISION"] } },
      }),
      prisma.order.count({
        where: { customerId, status: { in: ["NEW", "ON_MODERATION", "PUBLISHED"] } },
      }),
      prisma.order.count({
        where: { customerId, status: "SUBMITTED" },
      }),
    ]);
    return { active, waiting, review };
  }
}

export async function countAdminOverview() {
  const [users, customers, executors, activeOrders, gmv] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "EXECUTOR" } }),
    prisma.order.count({
      where: {
        status: {
          in: ["NEW", "PUBLISHED", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "REVISION"],
        },
      },
    }),
    prisma.order.aggregate({
      where: { status: { notIn: ["DRAFT", "CANCELED"] } },
      _sum: { budgetCents: true },
    }),
  ]);
  return {
    users,
    customers,
    executors,
    activeOrders,
    gmvCents: gmv._sum.budgetCents ?? 0,
  };
}

export async function sumCustomerSpend(customerId: string) {
  const agg = await prisma.order.aggregate({
    where: {
      customerId,
      status: { in: ["ACCEPTED", "COMPLETED"] },
    },
    _sum: { budgetCents: true },
  });
  return agg._sum.budgetCents ?? 0;
}
