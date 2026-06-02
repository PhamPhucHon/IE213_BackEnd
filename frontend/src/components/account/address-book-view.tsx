"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  FieldError,
  FieldHelp,
  FormAlert,
  applyZodFieldErrors,
  getFieldDescribedBy,
  inputClassName,
  primaryButtonClassName
} from "@/components/auth/form-utils";
import { addressSchema } from "@/lib/validators/user";
import {
  addAddress,
  getLocalUserErrorMessage,
  LocalUserError,
  removeAddress,
  setDefaultAddress,
  updateAddress
} from "@/lib/api/local-users";
import {
  accountAddressesQueryKey,
  useAccountAddresses
} from "@/lib/hooks/use-account";
import { addressesQueryKey } from "@/lib/hooks/use-orders";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import type { Address } from "@/types/models";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  badgeClassName,
  checkboxClassName,
  getButtonClassName,
  textareaClassName
} from "@/components/ui/style-primitives";

type AddressFormValues = z.infer<typeof addressSchema>;

function AddressSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-64" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function AddressBookView() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: addresses = [], isLoading, error } = useAccountAddresses(Boolean(user));
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<AddressFormValues>({
    defaultValues: {
      label: "",
      address: "",
      isDefault: false
    }
  });

  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoadingUser, pathname, router, user]);

  useEffect(() => {
    if (error instanceof LocalUserError && error.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [error, pathname, router]);

  function syncAddresses(nextAddresses: Address[]) {
    queryClient.setQueryData(accountAddressesQueryKey, nextAddresses);
    queryClient.setQueryData(addressesQueryKey, nextAddresses);
  }

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: (nextAddresses) => {
      syncAddresses(nextAddresses);
      setMessage("Default address updated.");
      setServerError(null);
    },
    onError: (error) => setServerError(getLocalUserErrorMessage(error))
  });

  const removeMutation = useMutation({
    mutationFn: removeAddress,
    onSuccess: (nextAddresses) => {
      syncAddresses(nextAddresses);
      setMessage("Address deleted.");
      setServerError(null);
    },
    onError: (error) => setServerError(getLocalUserErrorMessage(error))
  });

  if (isLoadingUser || (user && isLoading)) {
    return <AddressSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalUserErrorMessage(error)}
      </StatusAlert>
    );
  }

  function startEdit(address: Address) {
    setEditingAddress(address);
    setMessage(null);
    setServerError(null);
    reset({
      label: address.label ?? "",
      address: address.address,
      isDefault: Boolean(address.isDefault)
    });
  }

  function clearForm() {
    setEditingAddress(null);
    reset({
      label: "",
      address: "",
      isDefault: false
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    setServerError(null);
    const parsed = addressSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    const isEditingDefaultAddress = Boolean(editingAddress?.isDefault);
    const payload = {
      label: parsed.data.label?.trim() || undefined,
      address: parsed.data.address.trim(),
      isDefault: isEditingDefaultAddress ? true : Boolean(parsed.data.isDefault)
    };

    try {
      const nextAddresses = editingAddress
        ? await updateAddress(editingAddress._id, payload)
        : await addAddress(payload);
      syncAddresses(nextAddresses);
      setMessage(editingAddress ? "Address updated." : "Address added.");
      clearForm();
    } catch (error) {
      if (error instanceof LocalUserError && error.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setServerError(getLocalUserErrorMessage(error));
    }
  });

  return (
    <div className="grid gap-6">
      <form className="rounded-lg border border-line bg-white p-5 shadow-subtle" onSubmit={onSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {editingAddress ? "Edit address" : "Add address"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              The default address is prefilled during checkout.
            </p>
          </div>
          {editingAddress ? (
            <button
              type="button"
              className={getButtonClassName("secondary", "h-9 px-3")}
              onClick={clearForm}
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          {message ? <FormAlert tone="success">{message}</FormAlert> : null}
          {serverError ? <FormAlert>{serverError}</FormAlert> : null}

          <label className="grid gap-1 text-sm font-medium text-ink">
            Label
            <input
              className={inputClassName}
              placeholder="Home, office..."
              aria-invalid={errors.label ? "true" : undefined}
              aria-describedby={getFieldDescribedBy(
                "address-label-help",
                errors.label && "address-label-error"
              )}
              {...register("label")}
            />
            <FieldHelp id="address-label-help">Optional label shown in your saved address list.</FieldHelp>
            <FieldError id="address-label-error" message={errors.label?.message} />
          </label>

          <label className="grid gap-1 text-sm font-medium text-ink">
            Address
            <textarea
              className={textareaClassName}
              placeholder="123 Nguyen Trai, Q1"
              aria-invalid={errors.address ? "true" : undefined}
              aria-describedby={getFieldDescribedBy(errors.address && "address-address-error")}
              {...register("address")}
            />
            <FieldError id="address-address-error" message={errors.address?.message} />
          </label>

          <label className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              className={checkboxClassName}
              disabled={Boolean(editingAddress?.isDefault)}
              aria-describedby={editingAddress?.isDefault ? "address-default-help" : undefined}
              {...register("isDefault")}
            />
            {editingAddress?.isDefault ? "Default address" : "Set as default"}
          </label>
          {editingAddress?.isDefault ? (
            <p id="address-default-help" className="text-xs text-muted">
              Choose another address as default before removing this default state.
            </p>
          ) : null}

          <button type="submit" className={primaryButtonClassName} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "Saving..." : editingAddress ? "Save address" : "Add address"}
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
        <h2 className="text-lg font-semibold text-ink">Saved addresses</h2>
        {!addresses.length ? (
          <EmptyState
            title="No saved addresses yet"
            description="Add a delivery address so checkout can prefill it later."
            className="mt-5 p-6"
          />
        ) : (
          <div className="mt-5 grid gap-3">
            {addresses.map((address) => (
              <article key={address._id} className="rounded-md border border-line bg-white p-4 shadow-subtle">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{address.label || "Address"}</h3>
                      {address.isDefault ? (
                        <span className={badgeClassName}>
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{address.address}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!address.isDefault ? (
                      <button
                        type="button"
                        className={getButtonClassName("secondary", "h-9 px-3")}
                        disabled={setDefaultMutation.isPending}
                        onClick={() => setDefaultMutation.mutate(address._id)}
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={getButtonClassName("secondary", "h-9 px-3")}
                      onClick={() => startEdit(address)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={getButtonClassName("danger", "h-9 px-3")}
                      disabled={removeMutation.isPending}
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Delete address?",
                          description: "This saved address will be removed from your account.",
                          confirmLabel: "Delete",
                          destructive: true
                        });

                        if (confirmed) {
                          removeMutation.mutate(address._id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
