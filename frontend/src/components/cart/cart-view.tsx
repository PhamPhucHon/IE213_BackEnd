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
import { formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-provider";

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

function CartSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-32 rounded-lg bg-surface" />
      ))}
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
    setDraftQuantities((current) => {
      const next: Record<string, string> = {};

      items.forEach((item) => {
        next[item.sku] = current[item.sku] ?? String(item.quantity);
      });

      return next;
    });
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
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">Login required</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Please login before viewing your cart.</p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="focus-ring mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalCartErrorMessage(error)}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">Your cart is empty</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Add a frame from the catalog to start checkout.</p>
        <Link
          href="/products"
          className="focus-ring mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const isMutating =
    updateMutation.isPending || removeMutation.isPending || clearMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid gap-4">
        {message ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {mutationError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {mutationError}
          </p>
        ) : null}

        {items.map((item) => (
          <article key={item.sku} className="grid gap-4 rounded-lg border border-line bg-white p-4 sm:grid-cols-[112px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
              {item.image ? (
                <Image src={item.image} alt={item.name ?? "Cart item"} fill sizes="112px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted">
                  No image
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-semibold text-ink">{item.name ?? "Selected item"}</h2>
                <p className="mt-3 text-sm font-semibold text-ink">{formatCurrency(item.price)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  aria-label={`Decrease ${item.name ?? "item"}`}
                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-ink"
                  disabled={isMutating}
                  onClick={() => updateMutation.mutate({ sku: item.sku, quantity: item.quantity - 1 })}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  aria-label={`Quantity for ${item.name ?? "item"}`}
                  className="focus-ring h-9 w-16 rounded-md border border-line text-center text-sm"
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
                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-ink"
                  disabled={isMutating}
                  onClick={() => updateMutation.mutate({ sku: item.sku, quantity: item.quantity + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink"
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

      <aside className="self-start rounded-lg border border-line bg-white p-5">
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
            className="focus-ring rounded-md bg-ink px-4 py-2 text-center text-sm font-semibold text-white"
          >
            Checkout
          </Link>
          <button
            type="button"
            className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
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
