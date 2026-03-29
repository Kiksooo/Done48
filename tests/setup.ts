import { afterAll } from "vitest";
import { prisma } from "@/lib/db";

afterAll(async () => {
  await prisma.$disconnect();
});
