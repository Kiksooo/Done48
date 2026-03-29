import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";

const done: OrderStatus[] = ["COMPLETED", "ACCEPTED"];
const risk: OrderStatus[] = ["DISPUTED", "CANCELED"];
const progress: OrderStatus[] = ["IN_PROGRESS", "ASSIGNED", "SUBMITTED", "REVISION"];

function variantFor(status: OrderStatus): "default" | "success" | "warning" | "danger" | "secondary" {
  if (done.includes(status)) return "success";
  if (risk.includes(status)) return "danger";
  if (progress.includes(status)) return "warning";
  if (status === "PUBLISHED" || status === "NEW" || status === "ON_MODERATION") return "secondary";
  return "default";
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={variantFor(status)}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
