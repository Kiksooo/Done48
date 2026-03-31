import { prisma } from "@/lib/db";

export async function listCategoriesWithSubcategories() {
  try {
    return await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      },
    });
  } catch {
    return [];
  }
}

export async function listCategoriesForAdmin() {
  try {
    return await prisma.category.findMany({
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
  } catch {
    return [];
  }
}
