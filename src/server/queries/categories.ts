import { prisma } from "@/lib/db";

export async function listCategoriesWithSubcategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });
}

export async function listCategoriesForAdmin() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { orders: true } },
        },
      },
      _count: { select: { orders: true } },
    },
  });
}
