"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Inventory } from "@/types/models";
import {
  getLocalAdminCatalogErrorMessage,
  updateAdminInventoryStock
} from "@/lib/api/local-admin-catalog";
import {
  adminInventoryQueryKey,
  adminInventorySkuQueryKey
} from "@/lib/hooks/use-admin-catalog";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";

type AdminInventoryStockButtonProps = {
  inventory: Inventory;
  className?: string;
  onError?: (message: string) => void;
  onSuccess?: (inventory: Inventory) => void;
};

export function AdminInventoryStockButton({
  inventory,
  className,
  onError,
  onSuccess
}: AdminInventoryStockButtonProps) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: (stock: number) => updateAdminInventoryStock(inventory.sku, stock),
    onSuccess: (nextInventory) => {
      queryClient.setQueryData(adminInventorySkuQueryKey(nextInventory.sku), nextInventory);
      queryClient.invalidateQueries({ queryKey: adminInventoryQueryKey });
      showToast({
        title: "Stock updated",
        description: `${nextInventory.sku} now has stock ${nextInventory.stock}.`,
        variant: "success"
      });
      onSuccess?.(nextInventory);
    },
    onError: (mutationError) => {
      const message = getLocalAdminCatalogErrorMessage(mutationError);
      showToast({ title: "Could not update stock", description: message, variant: "error" });
      onError?.(message);
    }
  });

  return (
    <button
      type="button"
      className={cn(
        "focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      disabled={mutation.isPending}
      onClick={async () => {
        const value = window.prompt(
          `New stock for ${inventory.sku}. Reserved quantity is ${inventory.reserved}.`,
          String(inventory.stock)
        );

        if (value === null) return;

        const stock = Number(value);
        if (!Number.isInteger(stock) || stock < 0) {
          const message = "Stock must be a non-negative integer.";
          showToast({ title: "Invalid stock", description: message, variant: "error" });
          onError?.(message);
          return;
        }

        if (stock < inventory.reserved) {
          const message = `Stock cannot be lower than reserved quantity (${inventory.reserved}).`;
          showToast({ title: "Invalid stock", description: message, variant: "error" });
          onError?.(message);
          return;
        }

        const confirmed = await confirm({
          title: "Update stock",
          description: `Set ${inventory.sku} stock from ${inventory.stock} to ${stock}.`,
          confirmLabel: "Update stock"
        });

        if (confirmed) {
          mutation.mutate(stock);
        }
      }}
    >
      {mutation.isPending ? "Saving..." : "Update stock"}
    </button>
  );
}
