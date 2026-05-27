"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderStatus } from "@/types/models";
import { getNextAdminOrderStatuses } from "@/lib/admin/admin-utils";
import { getLocalAdminErrorMessage, updateAdminOrderStatus } from "@/lib/api/local-admin";
import { adminOrderQueryKey, adminOrdersQueryKey } from "@/lib/hooks/use-admin";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";

type AdminOrderStatusActionsProps = {
  order: Order;
  className?: string;
  showEmpty?: boolean;
  onError?: (message: string) => void;
  onSuccess?: (order: Order) => void;
};

function actionLabel(status: OrderStatus) {
  if (status === "Cancelled") return "Cancel";
  if (status === "Delivered") return "Mark delivered";
  return `Mark ${status.toLowerCase()}`;
}

function actionClassName(status: OrderStatus) {
  if (status === "Cancelled") {
    return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
  }

  if (status === "Delivered") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  }

  return "border-line bg-white text-ink hover:bg-surface";
}

export function AdminOrderStatusActions({
  order,
  className,
  showEmpty = false,
  onError,
  onSuccess
}: AdminOrderStatusActionsProps) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const nextStatuses = getNextAdminOrderStatuses(order.status);
  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateAdminOrderStatus(order._id, status),
    onSuccess: (nextOrder) => {
      queryClient.setQueryData(adminOrderQueryKey(nextOrder._id), nextOrder);
      queryClient.invalidateQueries({ queryKey: adminOrdersQueryKey });
      showToast({
        title: "Order status updated",
        description: `${nextOrder.orderNumber} moved to ${nextOrder.status}.`,
        variant: "success"
      });
      onSuccess?.(nextOrder);
    },
    onError: (error) => {
      const message = getLocalAdminErrorMessage(error);
      showToast({ title: "Could not update order", description: message, variant: "error" });
      onError?.(message);
    }
  });

  if (!nextStatuses.length) {
    return showEmpty ? <span className="text-sm text-muted">No valid actions</span> : null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {nextStatuses.map((status) => (
        <button
          key={status}
          type="button"
          className={cn(
            "focus-ring inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
            actionClassName(status)
          )}
          disabled={mutation.isPending}
          onClick={async () => {
            const confirmed = await confirm({
              title: `Move order to ${status}?`,
              description: `${order.orderNumber} will move from ${order.status} to ${status}.`,
              confirmLabel: actionLabel(status),
              destructive: status === "Cancelled"
            });

            if (confirmed) {
              mutation.mutate(status);
            }
          }}
        >
          {mutation.isPending && mutation.variables === status ? "Saving..." : actionLabel(status)}
        </button>
      ))}
    </div>
  );
}
