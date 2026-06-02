import type { OrderStatus } from "@/types/models";
import { cn } from "@/lib/utils";
import { orderStatuses } from "@/lib/orders/order-utils";

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const visibleStatuses =
    status === "Cancelled"
      ? ["Pending", "Cancelled"]
      : orderStatuses.filter((item) => item !== "Cancelled");
  const activeIndex = visibleStatuses.indexOf(status);

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {visibleStatuses.map((item, index) => {
        const isActive = item === status;
        const isComplete = activeIndex >= index && status !== "Cancelled";
        const hasConnector = index < visibleStatuses.length - 1;

        return (
          <li key={item} className="relative flex items-center gap-3 rounded-md bg-surface px-3 py-2">
            {hasConnector ? (
              <span
                className={cn(
                  "absolute left-7 top-full block h-3 w-px bg-line sm:left-full sm:top-1/2 sm:h-px sm:w-3",
                  isComplete && "bg-ink"
                )}
                aria-hidden="true"
              />
            ) : null}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isActive || isComplete
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-muted",
                item === "Cancelled" && "border-danger-600 bg-danger-600 text-white"
              )}
            >
              {index + 1}
            </span>
            <span className={cn("text-sm font-medium", isActive ? "text-ink" : "text-muted")}>
              {item}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
