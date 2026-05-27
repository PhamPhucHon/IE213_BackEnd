import type { OrderStatus } from "@/types/models";
import { cn } from "@/lib/utils";
import { statusBadgeClassName } from "@/lib/orders/order-utils";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusBadgeClassName(status)
      )}
    >
      {status}
    </span>
  );
}
