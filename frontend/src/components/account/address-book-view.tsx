"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  FieldError,
  FormAlert,
  applyZodFieldErrors,
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
import { useConfirm } from "@/components/ui/confirm-provider";

type AddressFormValues = z.infer<typeof addressSchema>;

function AddressSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-64 rounded-lg bg-surface" />
      <div className="h-40 rounded-lg bg-surface" />
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalUserErrorMessage(error)}
      </div>
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
      <form className="rounded-lg border border-line bg-white p-5" onSubmit={onSubmit}>
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
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink"
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
            <input className={inputClassName} placeholder="Home, office..." {...register("label")} />
            <FieldError message={errors.label?.message} />
          </label>

          <label className="grid gap-1 text-sm font-medium text-ink">
            Address
            <textarea
              className="focus-ring min-h-28 rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-muted"
              placeholder="123 Nguyen Trai, Q1"
              {...register("address")}
            />
            <FieldError message={errors.address?.message} />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              disabled={Boolean(editingAddress?.isDefault)}
              {...register("isDefault")}
            />
            {editingAddress?.isDefault ? "Default address" : "Set as default"}
          </label>
          {editingAddress?.isDefault ? (
            <p className="text-xs text-muted">
              Choose another address as default before removing this default state.
            </p>
          ) : null}

          <button type="submit" className={primaryButtonClassName} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingAddress ? "Save address" : "Add address"}
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Saved addresses</h2>
        {!addresses.length ? (
          <div className="mt-5 rounded-md border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">No saved addresses yet.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {addresses.map((address) => (
              <article key={address._id} className="rounded-md border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{address.label || "Address"}</h3>
                      {address.isDefault ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
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
                        className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink"
                        disabled={setDefaultMutation.isPending}
                        onClick={() => setDefaultMutation.mutate(address._id)}
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink"
                      onClick={() => startEdit(address)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
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
