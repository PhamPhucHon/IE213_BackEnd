"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { forgotPassword, getLocalApiErrorMessage } from "@/lib/api/local-auth";
import {
  FieldError,
  FormAlert,
  applyZodFieldErrors,
  getFieldDescribedBy,
  inputClassName,
  primaryButtonClassName
} from "./form-utils";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccessMessage(null);
    const parsed = forgotPasswordSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    try {
      const response = await forgotPassword(parsed.data.email);
      setSuccessMessage(response.message || "Reset email sent.");
      reset();
    } catch (error) {
      setServerError(getLocalApiErrorMessage(error));
    }
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}
      {successMessage ? <FormAlert tone="success">{successMessage}</FormAlert> : null}

      <label className="grid gap-1 text-sm font-medium text-ink">
        Email
        <input
          className={inputClassName}
          placeholder="user@example.com"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={getFieldDescribedBy(errors.email && "forgot-password-email-error")}
          {...register("email")}
        />
        <FieldError id="forgot-password-email-error" message={errors.email?.message} />
      </label>

      <button type="submit" className={primaryButtonClassName} disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset email"}
      </button>

      <Link href="/login" className="focus-ring rounded-sm text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to login
      </Link>
    </form>
  );
}
