"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@/types/models";
import { cancelOrder, getLocalOrderErrorMessage, LocalOrderError } from "@/lib/api/local-orders";
import { ordersQueryKey } from "@/lib/hooks/use-orders";
import { canCancelOrder } from "@/lib/orders/order-utils";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";

type CancelOrderButtonProps = {
  order: Order;
  onError?: (message: string) => void;
  onSuccess?: (order: Order) => void;
};

export function CancelOrderButton({ order, onError, onSuccess }: CancelOrderButtonProps) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (nextOrder) => {
      queryClient.setQueryData([...ordersQueryKey, nextOrder._id], nextOrder);
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      showToast({
        title: "Order cancelled",
        description: `${nextOrder.orderNumber} has been cancelled.`,
        variant: "success"
      });
      onSuccess?.(nextOrder);
    },
    onError: (error) => {
      if (error instanceof LocalOrderError && error.status === 401) {
        const message = "Please login again before cancelling this order.";
        showToast({ title: "Session required", description: message, variant: "error" });
        onError?.(message);
        return;
      }

      const message = getLocalOrderErrorMessage(error);
      showToast({ title: "Could not cancel order", description: message, variant: "error" });
      onError?.(message);
    }
  });

  if (!canCancelOrder(order)) {
    return null;
  }

  return (
    <button
      type="button"
      className="focus-ring rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={mutation.isPending}
      onClick={async () => {
        const confirmed = await confirm({
          title: "Cancel this order?",
          description: "Reserved stock will be released back to inventory.",
          confirmLabel: "Cancel order",
          destructive: true
        });

        if (confirmed) {
          mutation.mutate(order._id);
        }
      }}
    >
      {mutation.isPending ? "Cancelling..." : "Cancel order"}
    </button>
  );
}
