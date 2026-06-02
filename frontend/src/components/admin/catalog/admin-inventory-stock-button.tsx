"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { StatusAlert } from "@/components/ui/status-alert";
import {
  getButtonClassName,
  getFieldClassName,
  modalOverlayClassName,
  modalPanelClassName
} from "@/components/ui/style-primitives";
import { useToast } from "@/components/ui/toast-provider";

type AdminInventoryStockButtonProps = {
  inventory: Inventory;
  className?: string;
  onError?: (message: string) => void;
  onSuccess?: (inventory: Inventory) => void;
};

type InertElementState = {
  element: HTMLElement;
  ariaHidden: string | null;
  inert: boolean;
};

function makeDialogBackgroundInert(overlay: HTMLElement) {
  const backgroundElements = Array.from(document.body.children).filter(
    (element): element is HTMLElement => element instanceof HTMLElement && element !== overlay
  );
  const previousStates: InertElementState[] = backgroundElements.map((element) => ({
    element,
    ariaHidden: element.getAttribute("aria-hidden"),
    inert: Boolean((element as HTMLElement & { inert?: boolean }).inert)
  }));

  backgroundElements.forEach((element) => {
    (element as HTMLElement & { inert?: boolean }).inert = true;
    element.setAttribute("aria-hidden", "true");
  });

  return () => {
    previousStates.forEach(({ element, ariaHidden, inert }) => {
      (element as HTMLElement & { inert?: boolean }).inert = inert;

      if (ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", ariaHidden);
      }
    });
  };
}

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
  const validationId = useId();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const stockInputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
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

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    stockInputRef.current?.focus();
    stockInputRef.current?.select();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !mutation.isPending) {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isOpen, mutation.isPending]);

  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;
    return makeDialogBackgroundInert(overlayRef.current);
  }, [isOpen]);

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
          getButtonClassName("secondary", "px-3"),
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

      {isOpen && typeof document !== "undefined" ? createPortal(
        <div
          ref={overlayRef}
          className={modalOverlayClassName}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            ref={dialogRef}
            aria-modal="true"
            role="dialog"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={`${modalPanelClassName} max-w-lg p-4 sm:p-5`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-brand-600">Inventory</p>
                <h2 id={titleId} className="mt-1 break-all text-lg font-semibold text-ink">
                  {inventory.sku}
                </h2>
                <p id={descriptionId} className="mt-1 break-words text-sm text-muted">
                  Warehouse: {inventory.warehouse || "Default"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close stock editor"
                className={getButtonClassName("ghost", "h-11 w-11 px-0")}
                disabled={mutation.isPending}
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 text-sm min-[390px]:grid-cols-3">
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
                  className={getFieldClassName(Boolean(validationMessage), "h-11 text-base font-semibold")}
                  aria-invalid={validationMessage ? "true" : undefined}
                  aria-describedby={validationMessage ? validationId : undefined}
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
                <StatusAlert id={validationId} tone="error">
                  {validationMessage}
                </StatusAlert>
              ) : null}

              <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  className={getButtonClassName("secondary", "w-full sm:w-auto")}
                  disabled={mutation.isPending}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={getButtonClassName("primary", "w-full sm:w-auto")}
                  disabled={!canSubmit || mutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  <span>{mutation.isPending ? "Saving..." : "Save stock"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body
      ) : null}
    </>
  );
}
