"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { registerSchema } from "@/lib/validators/auth";
import { getLocalApiErrorMessage, register } from "@/lib/api/local-auth";
import { currentUserQueryKey } from "@/lib/hooks/use-current-user";
import { removeUserScopedQueries } from "@/lib/query/session-cache";
import {
  FieldError,
  FieldHelp,
  FormAlert,
  applyZodFieldErrors,
  getFieldDescribedBy,
  inputClassName,
  primaryButtonClassName
} from "./form-utils";

type RegisterFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: ""
    }
  });
  const nextPath = safeNextPath(searchParams.get("next"));
  const loginHref = nextPath === "/" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const parsed = registerSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    try {
      const auth = await register({
        ...parsed.data,
        phone: parsed.data.phone || undefined
      });
      await removeUserScopedQueries(queryClient);
      queryClient.setQueryData(currentUserQueryKey, auth?.user ?? null);
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setServerError(getLocalApiErrorMessage(error));
    }
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}

      <label className="grid gap-1 text-sm font-medium text-ink">
        Name
        <input
          className={inputClassName}
          placeholder="Nguyen Van A"
          autoComplete="name"
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={getFieldDescribedBy(errors.name && "register-name-error")}
          {...registerField("name")}
        />
        <FieldError id="register-name-error" message={errors.name?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Email
        <input
          className={inputClassName}
          placeholder="user@example.com"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={getFieldDescribedBy(errors.email && "register-email-error")}
          {...registerField("email")}
        />
        <FieldError id="register-email-error" message={errors.email?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Phone
        <input
          className={inputClassName}
          placeholder="0901234567"
          type="tel"
          autoComplete="tel"
          aria-invalid={errors.phone ? "true" : undefined}
          aria-describedby={getFieldDescribedBy(
            "register-phone-help",
            errors.phone && "register-phone-error"
          )}
          {...registerField("phone")}
        />
        <FieldHelp id="register-phone-help">Optional, but useful for delivery updates.</FieldHelp>
        <FieldError id="register-phone-error" message={errors.phone?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Password
        <input
          className={inputClassName}
          placeholder="Minimum 6 characters"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? "true" : undefined}
          aria-describedby={getFieldDescribedBy(errors.password && "register-password-error")}
          {...registerField("password")}
        />
        <FieldError id="register-password-error" message={errors.password?.message} />
      </label>

      <button type="submit" className={primaryButtonClassName} disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="focus-ring rounded-sm font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
