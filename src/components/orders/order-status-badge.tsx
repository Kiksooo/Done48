import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { getCustomerOrderStatusLabel, ORDER_STATUS_LABELS } from "@/lib/order-labels";

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

export function OrderStatusBadge({
  status,
  audience = "internal",
}: {
  status: OrderStatus;
  /** `customer` — упрощённые 5 статусов для заказчика. */
  audience?: "customer" | "internal";
}) {
  const label =
    audience === "customer" ? getCustomerOrderStatusLabel(status) : ORDER_STATUS_LABELS[status];
  return <Badge variant={variantFor(status)}>{label}</Badge>;
}
