"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Cart } from "@/types/models";
import {
  checkInventory,
  clearCart,
  getLocalCartErrorMessage,
  LocalCartError,
  removeCartItem,
  updateCartItem
} from "@/lib/api/local-cart";
import { cartQueryKey, useCart } from "@/lib/hooks/use-cart";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { cn, formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  fieldClassName,
  getButtonClassName
} from "@/components/ui/style-primitives";

type QuantityInput = {
  sku: string;
  quantity: number;
};

function recalculateCart(cart: Cart) {
  return {
    ...cart,
    totalPrice: cart.items.reduce((total, item) => total + item.price * item.quantity, 0)
  };
}

function copyCart(cart: Cart) {
  return {
    ...cart,
    items: cart.items.map((item) => ({ ...item }))
  };
}

function getDraftQuantities(items: Cart["items"]) {
  return items.reduce<Record<string, string>>((next, item) => {
    next[item.sku] = String(item.quantity);
    return next;
  }, {});
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="hidden h-72 lg:block" />
    </div>
  );
}

export function CartView() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: cart, error, isLoading } = useCart(Boolean(user));
  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const [message, setMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error instanceof LocalCartError && error.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [error, pathname, router]);

  useEffect(() => {
    setDraftQuantities(getDraftQuantities(items));
  }, [items]);

  function handleMutationError(error: unknown, previousCart?: Cart) {
    if (previousCart) {
      queryClient.setQueryData(cartQueryKey, previousCart);
    }

    if (error instanceof LocalCartError && error.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setMutationError(getLocalCartErrorMessage(error));
  }

  const updateMutation = useMutation({
    mutationFn: async ({ sku, quantity }: QuantityInput) => {
      if (quantity <= 0) {
        return removeCartItem(sku);
      }

      const inventory = await checkInventory(sku, quantity);

      if (!inventory.available) {
        throw new Error(`Only ${inventory.availableStock} item(s) available.`);
      }

      return updateCartItem(sku, quantity);
    },
    onMutate: async ({ sku, quantity }) => {
      setMessage(null);
      setMutationError(null);
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData<Cart>(cartQueryKey);

      if (previousCart) {
        const nextCart = copyCart(previousCart);
        nextCart.items = nextCart.items
          .map((item) => (item.sku === sku ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0);
        queryClient.setQueryData(cartQueryKey, recalculateCart(nextCart));
      }

      return { previousCart };
    },
    onError: (error, _variables, context) => handleMutationError(error, context?.previousCart),
    onSuccess: (nextCart) => {
      queryClient.setQueryData(cartQueryKey, nextCart);
      setMessage("Cart updated.");
    }
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onMutate: async (sku) => {
      setMessage(null);
      setMutationError(null);
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData<Cart>(cartQueryKey);

      if (previousCart) {
        const nextCart = copyCart(previousCart);
        nextCart.items = nextCart.items.filter((item) => item.sku !== sku);
        queryClient.setQueryData(cartQueryKey, recalculateCart(nextCart));
      }

      return { previousCart };
    },
    onError: (error, _variables, context) => handleMutationError(error, context?.previousCart),
    onSuccess: (nextCart) => {
      queryClient.setQueryData(cartQueryKey, nextCart);
      setMessage("Item removed.");
    }
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onMutate: async () => {
      setMessage(null);
      setMutationError(null);
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousCart = queryClient.getQueryData<Cart>(cartQueryKey);

      if (previousCart) {
        queryClient.setQueryData(cartQueryKey, {
          ...previousCart,
          items: [],
          totalPrice: 0
        });
      }

      return { previousCart };
    },
    onError: (error, _variables, context) => handleMutationError(error, context?.previousCart),
    onSuccess: (nextCart) => {
      queryClient.setQueryData(cartQueryKey, nextCart);
      setMessage("Cart cleared.");
    }
  });

  function commitQuantity(sku: string, fallbackQuantity: number) {
    const rawValue = draftQuantities[sku] ?? String(fallbackQuantity);
    const quantity = Number(rawValue);

    if (!Number.isFinite(quantity) || quantity < 1) {
      setDraftQuantities((current) => ({
        ...current,
        [sku]: String(fallbackQuantity)
      }));
      return;
    }

    const normalizedQuantity = Math.floor(quantity);
    setDraftQuantities((current) => ({
      ...current,
      [sku]: String(normalizedQuantity)
    }));

    if (normalizedQuantity !== fallbackQuantity) {
      updateMutation.mutate({ sku, quantity: normalizedQuantity });
    }
  }

  if (isLoadingUser || (user && isLoading)) {
    return <CartSkeleton />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view your cart"
        description="Your saved frames and quantities are available after signing in."
        action={
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className={getButtonClassName("primary")}
          >
            Sign in
          </Link>
        }
      />
    );
  }

  if (error) {
    return (
      <StatusAlert tone="error">
        {getLocalCartErrorMessage(error)}
      </StatusAlert>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add a frame from the catalog to start checkout."
        action={
          <Link href="/products" className={getButtonClassName("primary")}>
            Browse products
          </Link>
        }
      />
    );
  }

  const isMutating =
    updateMutation.isPending || removeMutation.isPending || clearMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid gap-4">
        {message ? (
          <StatusAlert tone="success">
            {message}
          </StatusAlert>
        ) : null}
        {mutationError ? (
          <StatusAlert tone="error">
            {mutationError}
          </StatusAlert>
        ) : null}

        {items.map((item) => (
          <article key={item.sku} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-lg border border-line bg-white p-4 shadow-subtle min-[390px]:grid-cols-[104px_minmax(0,1fr)] sm:grid-cols-[112px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
              {item.image ? (
                <Image src={item.image} alt={item.name ?? "Cart item"} fill sizes="112px" className="object-contain p-2" />
              ) : (
                <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted">
                  No image
                </div>
              )}
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <h2 className="break-words font-semibold text-ink">{item.name ?? "Selected item"}</h2>
                <p className="mt-1 break-all text-xs text-muted">SKU {item.sku}</p>
                <p className="mt-3 text-base font-semibold text-ink">{formatCurrency(item.price)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  aria-label={`Decrease ${item.name ?? "item"}`}
                  className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-surface active:translate-y-px"
                  disabled={isMutating}
                  onClick={() => updateMutation.mutate({ sku: item.sku, quantity: item.quantity - 1 })}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  aria-label={`Quantity for ${item.name ?? "item"}`}
                  className={cn(fieldClassName, "h-11 w-20 px-2 text-center")}
                  type="number"
                  min={1}
                  value={draftQuantities[item.sku] ?? String(item.quantity)}
                  disabled={isMutating}
                  onChange={(event) => {
                    setDraftQuantities((current) => ({
                      ...current,
                      [item.sku]: event.target.value
                    }));
                  }}
                  onBlur={() => commitQuantity(item.sku, item.quantity)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitQuantity(item.sku, item.quantity);
                    }
                  }}
                />
                <button
                  type="button"
                  aria-label={`Increase ${item.name ?? "item"}`}
                  className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-surface active:translate-y-px"
                  disabled={isMutating}
                  onClick={() => updateMutation.mutate({ sku: item.sku, quantity: item.quantity + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md border border-danger-200 bg-danger-50 px-3 text-sm font-medium text-danger-700 hover:bg-danger-100"
                  disabled={isMutating}
                  onClick={() => removeMutation.mutate(item.sku)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="self-start rounded-lg border border-line bg-white p-5 shadow-subtle lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-ink">Order summary</h2>
        <div className="mt-5 grid gap-3 border-b border-line pb-5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">Items</span>
            <span className="font-medium text-ink">{items.reduce((total, item) => total + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold text-ink">{formatCurrency(cart?.totalPrice ?? 0)}</span>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <Link
            href="/checkout"
            className={getButtonClassName("primary", "w-full")}
          >
            Checkout
          </Link>
          <button
            type="button"
            className={getButtonClassName("secondary", "w-full")}
            disabled={isMutating}
            onClick={async () => {
              const confirmed = await confirm({
                title: "Clear cart?",
                description: "All items will be removed from your cart.",
                confirmLabel: "Clear cart",
                destructive: true
              });

              if (confirmed) {
                clearMutation.mutate();
              }
            }}
          >
            Clear cart
          </button>
        </div>
      </aside>
    </div>
  );
}
