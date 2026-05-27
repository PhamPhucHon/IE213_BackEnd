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
    return <div className="h-[420px] rounded-lg bg-surface" />;
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
      <form className="rounded-lg border border-line bg-white p-5" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold text-ink">Change password</h2>
        <div className="mt-5 grid gap-4">
          {message ? <FormAlert tone="success">{message}</FormAlert> : null}
          {serverError ? <FormAlert>{serverError}</FormAlert> : null}

          <label className="grid gap-1 text-sm font-medium text-ink">
            Current password
            <input className={inputClassName} type="password" autoComplete="current-password" {...register("currentPassword")} />
            <FieldError message={errors.currentPassword?.message} />
          </label>

          <label className="grid gap-1 text-sm font-medium text-ink">
            New password
            <input className={inputClassName} type="password" autoComplete="new-password" {...register("newPassword")} />
            <FieldError message={errors.newPassword?.message} />
          </label>

          <button type="submit" className={primaryButtonClassName} disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change password"}
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Session</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Logout clears the local HttpOnly auth cookies.</p>
        <div className="mt-4">
          <LogoutButton className="border border-line" />
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="text-lg font-semibold text-red-700">Delete account</h2>
        <p className="mt-2 text-sm leading-6 text-red-700">
          This disables your account. The backend will block deletion while you have Pending or Processing orders.
        </p>
        <label className="mt-4 grid gap-1 text-sm font-medium text-red-700">
          Type your email to confirm
          <input
            className="focus-ring rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-ink"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={userEmail}
          />
        </label>
        {deleteError ? <p className="mt-3 text-sm font-medium text-red-700">{deleteError}</p> : null}
        <button
          type="button"
          className="focus-ring mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDeleting}
          onClick={handleDeleteAccount}
        >
          {isDeleting ? "Deleting..." : "Delete account"}
        </button>
      </section>
    </div>
  );
}
