"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X } from "lucide-react";
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
import { useToast } from "@/components/ui/toast-provider";

type AdminInventoryStockButtonProps = {
  inventory: Inventory;
  className?: string;
  onError?: (message: string) => void;
  onSuccess?: (inventory: Inventory) => void;
};

function formatSignedNumber(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function AdminInventoryStockButton({
  inventory,
  className,
  onError,
  onSuccess
}: AdminInventoryStockButtonProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const titleId = useId();
  const descriptionId = useId();
  const stockInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(String(inventory.stock));

  const parsedStock = Number(draft);
  const hasNumericDraft = draft.trim() !== "" && Number.isInteger(parsedStock);
  const validationMessage = useMemo(() => {
    if (!hasNumericDraft) return "Stock must be a whole number.";
    if (parsedStock < 0) return "Stock cannot be negative.";
    if (parsedStock < inventory.reserved) {
      return `Stock cannot be lower than reserved quantity (${inventory.reserved}).`;
    }
    return null;
  }, [hasNumericDraft, inventory.reserved, parsedStock]);

  const availableAfter = validationMessage ? null : parsedStock - inventory.reserved;
  const stockDelta = validationMessage ? null : parsedStock - inventory.stock;
  const canSubmit = !validationMessage && parsedStock !== inventory.stock;

  const mutation = useMutation({
    mutationFn: (stock: number) => updateAdminInventoryStock(inventory.sku, stock),
    onSuccess: (nextInventory) => {
      queryClient.setQueryData(adminInventorySkuQueryKey(nextInventory.sku), nextInventory);
      queryClient.invalidateQueries({ queryKey: adminInventoryQueryKey });
      setIsOpen(false);
      setDraft(String(nextInventory.stock));
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

  useEffect(() => {
    if (!isOpen) {
      setDraft(String(inventory.stock));
    }
  }, [inventory.stock, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    stockInputRef.current?.focus();
    stockInputRef.current?.select();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !mutation.isPending) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, mutation.isPending]);

  function closeModal() {
    if (!mutation.isPending) {
      setIsOpen(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate(parsedStock);
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        disabled={mutation.isPending}
        onClick={() => {
          setDraft(String(inventory.stock));
          setIsOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" />
        <span>{mutation.isPending ? "Saving..." : "Update stock"}</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <section
            aria-modal="true"
            role="dialog"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-brand-600">Inventory</p>
                <h2 id={titleId} className="mt-1 break-all text-lg font-semibold text-ink">
                  {inventory.sku}
                </h2>
                <p id={descriptionId} className="mt-1 text-sm text-muted">
                  Warehouse: {inventory.warehouse || "Default"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close stock editor"
                className="focus-ring rounded-md border border-line bg-white p-2 text-ink hover:bg-surface"
                disabled={mutation.isPending}
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md bg-surface p-3">
                <p className="text-muted">Current</p>
                <p className="mt-1 text-xl font-semibold text-ink">{inventory.stock}</p>
              </div>
              <div className="rounded-md bg-surface p-3">
                <p className="text-muted">Reserved</p>
                <p className="mt-1 text-xl font-semibold text-ink">{inventory.reserved}</p>
              </div>
              <div className="rounded-md bg-surface p-3">
                <p className="text-muted">Available</p>
                <p className="mt-1 text-xl font-semibold text-ink">{inventory.available}</p>
              </div>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-ink">
                New stock
                <input
                  ref={stockInputRef}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={draft}
                  className={cn(
                    "focus-ring h-11 rounded-md border px-3 text-base font-semibold text-ink",
                    validationMessage ? "border-red-300 bg-red-50" : "border-line bg-white"
                  )}
                  disabled={mutation.isPending}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>

              <div className="grid gap-2 rounded-md border border-line bg-surface p-3 text-sm sm:grid-cols-2">
                <p className="text-muted">
                  Change{" "}
                  <span className="font-semibold text-ink">
                    {stockDelta === null ? "-" : formatSignedNumber(stockDelta)}
                  </span>
                </p>
                <p className="text-muted sm:text-right">
                  Available after{" "}
                  <span className="font-semibold text-ink">
                    {availableAfter === null ? "-" : availableAfter}
                  </span>
                </p>
              </div>

              {validationMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {validationMessage}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={mutation.isPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSubmit || mutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  <span>{mutation.isPending ? "Saving..." : "Save stock"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
