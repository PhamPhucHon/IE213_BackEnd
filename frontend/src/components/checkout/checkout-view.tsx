"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { checkoutSchema } from "@/lib/validators/order";
import { LocalCartError } from "@/lib/api/local-cart";
import { createOrder, getLocalOrderErrorMessage, LocalOrderError } from "@/lib/api/local-orders";
import { cartQueryKey, useCart } from "@/lib/hooks/use-cart";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useAddresses } from "@/lib/hooks/use-orders";
import type { Cart, PaymentMethod } from "@/types/models";
import { formatCurrency } from "@/lib/utils";
import {
  FieldError,
  FormAlert,
  applyZodFieldErrors,
  inputClassName,
  primaryButtonClassName
} from "@/components/auth/form-utils";

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const paymentMethods: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: "COD", label: "COD", description: "Pay when the order arrives." },
  { value: "Momo", label: "Momo", description: "Order is created and awaits payment handling." },
  { value: "BankTransfer", label: "Bank transfer", description: "Order is created and awaits transfer confirmation." }
];

function emptyCartLike(cart?: Cart): Cart | undefined {
  if (!cart) return undefined;

  return {
    ...cart,
    items: [],
    totalPrice: 0
  };
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="h-[540px] rounded-lg bg-surface" />
      <div className="h-[360px] rounded-lg bg-surface" />
    </div>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: cart, isLoading: isLoadingCart, error: cartError } = useCart(Boolean(user));
  const { data: addresses = [], isLoading: isLoadingAddresses, error: addressesError } = useAddresses(Boolean(user));
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      shippingAddress: {
        fullName: "",
        phone: "",
        address: ""
      },
      paymentMethod: "COD"
    }
  });
  const hasHydratedCheckout = useRef(false);

  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? addresses[0],
    [addresses]
  );
  const selectedAddressId = watch("shippingAddress.address");

  useEffect(() => {
    if (!user) return;
    if (hasHydratedCheckout.current && isDirty) return;

    reset({
      shippingAddress: {
        fullName: user.name ?? "",
        phone: user.phone ?? "",
        address: defaultAddress?.address ?? ""
      },
      paymentMethod: "COD"
    });
    hasHydratedCheckout.current = true;
  }, [defaultAddress, isDirty, reset, user]);

  useEffect(() => {
    const error = cartError ?? addressesError;

    if (
      (error instanceof LocalOrderError || error instanceof LocalCartError) &&
      error.status === 401
    ) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [addressesError, cartError, pathname, router]);

  if (isLoadingUser || (user && (isLoadingCart || isLoadingAddresses))) {
    return <CheckoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">Login required</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Please login before checkout.</p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="focus-ring mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">Your cart is empty</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Add products to your cart before checkout.</p>
        <Link
          href="/products"
          className="focus-ring mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const parsed = checkoutSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    try {
      const order = await createOrder(parsed.data);
      queryClient.setQueryData(cartQueryKey, emptyCartLike(cart));
      await queryClient.invalidateQueries({ queryKey: cartQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.push(`/orders/${order._id}`);
    } catch (error) {
      if (error instanceof LocalOrderError && error.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setServerError(getLocalOrderErrorMessage(error));
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form className="grid gap-6" onSubmit={onSubmit}>
        {serverError ? <FormAlert>{serverError}</FormAlert> : null}

        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Shipping address</h2>
          <div className="mt-5 grid gap-4">
            {addresses.length ? (
              <label className="grid gap-1 text-sm font-medium text-ink">
                Saved address
                <select
                  className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
                  value={selectedAddressId ?? ""}
                  onChange={(event) => setValue("shippingAddress.address", event.target.value)}
                >
                  {addresses.map((address) => (
                    <option key={address._id} value={address.address}>
                      {address.label ? `${address.label} - ` : ""}
                      {address.address}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="grid gap-1 text-sm font-medium text-ink">
              Full name
              <input className={inputClassName} {...register("shippingAddress.fullName")} />
              <FieldError message={errors.shippingAddress?.fullName?.message} />
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Phone
              <input
                className={inputClassName}
                placeholder="0901234567"
                type="tel"
                {...register("shippingAddress.phone")}
              />
              <FieldError message={errors.shippingAddress?.phone?.message} />
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Address
              <textarea
                className="focus-ring min-h-28 rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-muted"
                {...register("shippingAddress.address")}
              />
              <FieldError message={errors.shippingAddress?.address?.message} />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Payment method</h2>
          <div className="mt-5 grid gap-3">
            {paymentMethods.map((method) => (
              <label key={method.value} className="flex gap-3 rounded-md border border-line p-3">
                <input
                  type="radio"
                  value={method.value}
                  className="mt-1"
                  {...register("paymentMethod")}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{method.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{method.description}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <button type="submit" className={primaryButtonClassName} disabled={isSubmitting}>
          {isSubmitting ? "Creating order..." : "Place order"}
        </button>
      </form>

      <aside className="self-start rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Order summary</h2>
        <div className="mt-5 grid gap-4">
          {cart.items.map((item) => (
            <div key={item.sku} className="grid grid-cols-[56px_1fr] gap-3">
              <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                {item.image ? (
                  <Image src={item.image} alt={item.name ?? "Checkout item"} fill sizes="56px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{item.name ?? "Selected item"}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.quantity} x {formatCurrency(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-line pt-5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold text-ink">{formatCurrency(cart.totalPrice)}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            Shipping is calculated by the backend when the order is created.
          </p>
        </div>
      </aside>
    </div>
  );
}
