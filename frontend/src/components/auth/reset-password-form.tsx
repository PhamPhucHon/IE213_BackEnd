"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { getLocalApiErrorMessage, resetPassword } from "@/lib/api/local-auth";
import {
  FieldError,
  FormAlert,
  applyZodFieldErrors,
  inputClassName,
  primaryButtonClassName
} from "./form-utils";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      token: tokenFromQuery,
      newPassword: ""
    }
  });

  useEffect(() => {
    if (tokenFromQuery) {
      setValue("token", tokenFromQuery);
    }
  }, [setValue, tokenFromQuery]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccessMessage(null);
    const parsed = resetPasswordSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    try {
      const response = await resetPassword(parsed.data.token, parsed.data.newPassword);
      setSuccessMessage(response.message || "Password reset successfully.");
      reset({ token: "", newPassword: "" });
    } catch (error) {
      setServerError(getLocalApiErrorMessage(error));
    }
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}
      {successMessage ? <FormAlert tone="success">{successMessage}</FormAlert> : null}

      <label className="grid gap-1 text-sm font-medium text-ink">
        Token
        <input
          className={inputClassName}
          placeholder="reset_token_from_email"
          autoComplete="one-time-code"
          {...register("token")}
        />
        <FieldError message={errors.token?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        New password
        <input
          className={inputClassName}
          placeholder="Minimum 6 characters"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
        />
        <FieldError message={errors.newPassword?.message} />
      </label>

      <button type="submit" className={primaryButtonClassName} disabled={isSubmitting}>
        {isSubmitting ? "Resetting..." : "Reset password"}
      </button>

      <Link href="/login" className="text-sm font-medium text-brand-600">
        Back to login
      </Link>
    </form>
  );
}
