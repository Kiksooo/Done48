import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export async function writeAuditLog(params: {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Json;
  newValue?: Json;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId ?? undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      oldValue:
        params.oldValue === undefined ? undefined : (params.oldValue as Prisma.InputJsonValue),
      newValue:
        params.newValue === undefined ? undefined : (params.newValue as Prisma.InputJsonValue),
    },
  });
}
