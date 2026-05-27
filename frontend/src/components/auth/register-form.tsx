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
  FormAlert,
  applyZodFieldErrors,
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
          {...registerField("name")}
        />
        <FieldError message={errors.name?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Email
        <input
          className={inputClassName}
          placeholder="user@example.com"
          type="email"
          autoComplete="email"
          {...registerField("email")}
        />
        <FieldError message={errors.email?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Phone
        <input
          className={inputClassName}
          placeholder="0901234567"
          type="tel"
          autoComplete="tel"
          {...registerField("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Password
        <input
          className={inputClassName}
          placeholder="Minimum 6 characters"
          type="password"
          autoComplete="new-password"
          {...registerField("password")}
        />
        <FieldError message={errors.password?.message} />
      </label>

      <button type="submit" className={primaryButtonClassName} disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-brand-600">
          Login
        </Link>
      </p>
    </form>
  );
}
