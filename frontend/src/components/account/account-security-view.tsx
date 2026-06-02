"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  FieldError,
  FormAlert,
  applyZodFieldErrors,
  getFieldDescribedBy,
  inputClassName,
  primaryButtonClassName
} from "@/components/auth/form-utils";
import { changePasswordSchema } from "@/lib/validators/user";
import {
  changePassword,
  deleteOwnAccount,
  getLocalUserErrorMessage,
  LocalUserError
} from "@/lib/api/local-users";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { clearSessionQueries } from "@/lib/query/session-cache";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  getButtonClassName,
  getFieldClassName
} from "@/components/ui/style-primitives";

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function AccountSecurityView() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ChangePasswordValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: ""
    }
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading) {
    return <Skeleton className="h-[420px]" />;
  }

  if (!user) {
    return null;
  }

  const userEmail = user.email;

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    setServerError(null);
    const parsed = changePasswordSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    try {
      const response = await changePassword(parsed.data.currentPassword, parsed.data.newPassword);
      setMessage(response.message || "Password changed.");
      reset();
    } catch (error) {
      if (error instanceof LocalUserError && error.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setServerError(getLocalUserErrorMessage(error));
    }
  });

  async function handleDeleteAccount() {
    setDeleteError(null);

    if (confirmText !== userEmail) {
      setDeleteError("Type your email exactly to confirm account deletion.");
      return;
    }

    setIsDeleting(true);

    try {
      await deleteOwnAccount();
      await clearSessionQueries(queryClient);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setDeleteError(getLocalUserErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form className="rounded-lg border border-line bg-white p-5 shadow-subtle" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold text-ink">Change password</h2>
        <div className="mt-5 grid gap-4">
          {message ? <FormAlert tone="success">{message}</FormAlert> : null}
          {serverError ? <FormAlert>{serverError}</FormAlert> : null}

          <label className="grid gap-1 text-sm font-medium text-ink">
            Current password
            <input
              className={inputClassName}
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.currentPassword ? "true" : undefined}
              aria-describedby={getFieldDescribedBy(errors.currentPassword && "security-current-password-error")}
              {...register("currentPassword")}
            />
            <FieldError id="security-current-password-error" message={errors.currentPassword?.message} />
          </label>

          <label className="grid gap-1 text-sm font-medium text-ink">
            New password
            <input
              className={inputClassName}
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.newPassword ? "true" : undefined}
              aria-describedby={getFieldDescribedBy(errors.newPassword && "security-new-password-error")}
              {...register("newPassword")}
            />
            <FieldError id="security-new-password-error" message={errors.newPassword?.message} />
          </label>

          <button type="submit" className={primaryButtonClassName} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change password"}
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
        <h2 className="text-lg font-semibold text-ink">Session</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Logout clears the local HttpOnly auth cookies.</p>
        <div className="mt-4">
          <LogoutButton className="border border-line" />
        </div>
      </section>

      <section className="rounded-lg border border-danger-200 bg-danger-50 p-5 shadow-subtle">
        <h2 className="text-lg font-semibold text-danger-700">Delete account</h2>
        <p className="mt-2 text-sm leading-6 text-danger-700">
          This disables your account. Deletion is blocked while you have Pending or Processing orders.
        </p>
        <label className="mt-4 grid gap-1 text-sm font-medium text-danger-700">
          Type your email to confirm
          <input
            className={getFieldClassName(Boolean(deleteError))}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={userEmail}
            aria-invalid={deleteError ? "true" : undefined}
            aria-describedby={getFieldDescribedBy(deleteError && "delete-account-email-error")}
          />
        </label>
        {deleteError ? (
          <StatusAlert id="delete-account-email-error" tone="error" className="mt-3">
            {deleteError}
          </StatusAlert>
        ) : null}
        <button
          type="button"
          className={getButtonClassName("danger", "mt-4")}
          disabled={isDeleting}
          aria-busy={isDeleting}
          onClick={handleDeleteAccount}
        >
          {isDeleting ? "Deleting..." : "Delete account"}
        </button>
      </section>
    </div>
  );
}
