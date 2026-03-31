import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

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
  const where: Prisma.OrderWhereInput = { customerId };
  const statusIn = customerFilterToStatuses(filter);
  if (statusIn) {
    where.status = { in: statusIn };
  }
  return prisma.order.findMany({
    where,
    include: orderListInclude,
    orderBy: { updatedAt: "desc" },
  });
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

export async function listAvailableOrdersForExecutor() {
  return prisma.order.findMany({
    where: {
      status: "PUBLISHED",
      visibilityType: "OPEN_FOR_RESPONSES",
      executorId: null,
    },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderDetailForPage(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
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
      statusHistory: { orderBy: { createdAt: "asc" } },
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
        orderBy: { createdAt: "desc" },
      },
    },
  });
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
  const [active, waiting, review] = await Promise.all([
    prisma.order.count({
      where: {
        customerId,
        status: { in: ["ASSIGNED", "IN_PROGRESS", "REVISION"] },
      },
    }),
    prisma.order.count({
      where: {
        customerId,
        status: { in: ["NEW", "ON_MODERATION", "PUBLISHED"] },
      },
    }),
    prisma.order.count({
      where: {
        customerId,
        status: "SUBMITTED",
      },
    }),
  ]);
  return { active, waiting, review };
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
