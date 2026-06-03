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
import { cn, formatCurrency } from "@/lib/utils";
import {
  FieldError,
  FieldHelp,
  FormAlert,
  applyZodFieldErrors,
  getFieldDescribedBy,
  inputClassName,
  primaryButtonClassName
} from "@/components/auth/form-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getButtonClassName,
  radioClassName,
  selectClassName,
  textareaClassName
} from "@/components/ui/style-primitives";

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
      <Skeleton className="h-[540px]" />
      <Skeleton className="h-[360px]" />
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
  const selectedPaymentMethod = watch("paymentMethod");

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
      <EmptyState
        title="Sign in to checkout"
        description="Use your account details and saved addresses to complete the order."
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

  if (!cart?.items.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add frames to your cart before starting checkout."
        action={
          <Link href="/products" className={getButtonClassName("primary")}>
            Browse products
          </Link>
        }
      />
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
      router.push(`/account/orders/${order._id}`);
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

        <section className="rounded-lg border border-line bg-white p-4 shadow-subtle sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white">
              1
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Shipping address</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Confirm the recipient and delivery address for this order.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            {addresses.length ? (
              <label className="grid gap-1 text-sm font-medium text-ink">
                Saved address
                <select
                  className={selectClassName}
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
              <input
                className={inputClassName}
                aria-invalid={errors.shippingAddress?.fullName ? "true" : undefined}
                aria-describedby={getFieldDescribedBy(
                  errors.shippingAddress?.fullName && "checkout-full-name-error"
                )}
                {...register("shippingAddress.fullName")}
              />
              <FieldError id="checkout-full-name-error" message={errors.shippingAddress?.fullName?.message} />
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Phone
              <input
                className={inputClassName}
                placeholder="0901234567"
                type="tel"
                aria-invalid={errors.shippingAddress?.phone ? "true" : undefined}
                aria-describedby={getFieldDescribedBy(
                  "checkout-phone-help",
                  errors.shippingAddress?.phone && "checkout-phone-error"
                )}
                {...register("shippingAddress.phone")}
              />
              <FieldHelp id="checkout-phone-help">Use a reachable phone number for delivery coordination.</FieldHelp>
              <FieldError id="checkout-phone-error" message={errors.shippingAddress?.phone?.message} />
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Address
              <textarea
                className={textareaClassName}
                aria-invalid={errors.shippingAddress?.address ? "true" : undefined}
                aria-describedby={getFieldDescribedBy(
                  errors.shippingAddress?.address && "checkout-address-error"
                )}
                {...register("shippingAddress.address")}
              />
              <FieldError id="checkout-address-error" message={errors.shippingAddress?.address?.message} />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4 shadow-subtle sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white">
              2
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Payment method</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Choose how you want this order to be paid.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {paymentMethods.map((method) => (
              <label
                key={method.value}
                className={cn(
                  "flex min-h-16 cursor-pointer gap-3 rounded-md border p-3 transition duration-200 ease-ui",
                  selectedPaymentMethod === method.value
                    ? "border-ink bg-surface shadow-subtle"
                    : "border-line bg-white hover:border-line-strong hover:bg-surface"
                )}
              >
                <input
                  type="radio"
                  value={method.value}
                  className={cn(radioClassName, "mt-1")}
                  aria-describedby={getFieldDescribedBy(errors.paymentMethod && "checkout-payment-method-error")}
                  {...register("paymentMethod")}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{method.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{method.description}</span>
                </span>
              </label>
            ))}
            <FieldError id="checkout-payment-method-error" message={errors.paymentMethod?.message} />
          </div>
        </section>

        <button type="submit" className={cn(primaryButtonClassName, "h-11")} disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Creating order..." : "Place order"}
        </button>
      </form>

      <aside className="self-start rounded-lg border border-line bg-white p-4 shadow-subtle sm:p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-ink">Order summary</h2>
        <div className="mt-5 grid gap-4">
          {cart.items.map((item) => (
            <div key={item.sku} className="grid grid-cols-[56px_1fr] gap-3">
              <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                {item.image ? (
                  <Image src={item.image} alt={item.name ?? "Checkout item"} fill sizes="56px" className="object-contain p-1" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 break-words text-sm font-medium text-ink">{item.name ?? "Selected item"}</p>
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
            Shipping is confirmed when the order is created.
          </p>
        </div>
      </aside>
    </div>
  );
}
