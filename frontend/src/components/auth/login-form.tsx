"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { loginSchema } from "@/lib/validators/auth";
import { getLocalApiErrorMessage, login } from "@/lib/api/local-auth";
import { currentUserQueryKey } from "@/lib/hooks/use-current-user";
import { removeUserScopedQueries } from "@/lib/query/session-cache";
import {
  FieldError,
  FormAlert,
  applyZodFieldErrors,
  inputClassName,
  primaryButtonClassName
} from "./form-utils";

type LoginFormValues = z.infer<typeof loginSchema>;

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const nextPath = safeNextPath(searchParams.get("next"));
  const registerHref = nextPath === "/" ? "/register" : `/register?next=${encodeURIComponent(nextPath)}`;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    try {
      const auth = await login(parsed.data);
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
        Password
        <input
          className={inputClassName}
          placeholder="******"
          type="password"
          autoComplete="current-password"
          {...registerField("password")}
        />
        <FieldError message={errors.password?.message} />
      </label>

      <button type="submit" className={primaryButtonClassName} disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <div className="flex justify-between text-sm">
        <Link href={registerHref} className="font-medium text-brand-600">
          Create account
        </Link>
        <Link href="/forgot-password" className="font-medium text-brand-600">
          Forgot password
        </Link>
      </div>
    </form>
  );
}
