"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { profileSchema } from "@/lib/validators/user";
import { getLocalUserErrorMessage, LocalUserError, updateProfile } from "@/lib/api/local-users";
import { currentUserQueryKey, useCurrentUser } from "@/lib/hooks/use-current-user";
import { profileQueryKey, useProfile } from "@/lib/hooks/use-account";
import {
  FieldError,
  FormAlert,
  applyZodFieldErrors,
  inputClassName,
  primaryButtonClassName
} from "@/components/auth/form-utils";

type ProfileFormValues = z.infer<typeof profileSchema>;

export function AccountProfileView() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: sessionUser, isLoading: isLoadingSession } = useCurrentUser();
  const { data: profile, isLoading, error } = useProfile(Boolean(sessionUser));
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: "",
      phone: "",
      avatar: ""
    }
  });
  const hydratedProfileId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoadingSession && !sessionUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoadingSession, pathname, router, sessionUser]);

  useEffect(() => {
    if (profile && (hydratedProfileId.current !== profile._id || !isDirty)) {
      reset({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        avatar: profile.avatar ?? ""
      });
      hydratedProfileId.current = profile._id;
    }
  }, [isDirty, profile, reset]);

  useEffect(() => {
    if (error instanceof LocalUserError && error.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [error, pathname, router]);

  if (isLoadingSession || (sessionUser && isLoading)) {
    return <div className="h-[420px] rounded-lg bg-surface" />;
  }

  if (!sessionUser) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalUserErrorMessage(error)}
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    setServerError(null);
    const parsed = profileSchema.safeParse(values);

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    const name = parsed.data.name?.trim();
    if (!name) {
      setError("name", { message: "Name is required." });
      return;
    }

    try {
      const payload = {
        name,
        phone: parsed.data.phone?.trim() ?? "",
        avatar: parsed.data.avatar?.trim() ?? ""
      };
      const nextProfile = await updateProfile(payload);
      queryClient.setQueryData(profileQueryKey, nextProfile);
      queryClient.setQueryData(currentUserQueryKey, nextProfile);
      setMessage("Profile updated.");
    } catch (error) {
      if (error instanceof LocalUserError && error.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setServerError(getLocalUserErrorMessage(error));
    }
  });

  return (
    <form className="rounded-lg border border-line bg-white p-5" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-ink">Profile information</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Update your customer profile. Email is managed by the backend and cannot be edited here.
      </p>

      <div className="mt-5 grid gap-4">
        {message ? <FormAlert tone="success">{message}</FormAlert> : null}
        {serverError ? <FormAlert>{serverError}</FormAlert> : null}

        <label className="grid gap-1 text-sm font-medium text-ink">
          Name
          <input className={inputClassName} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Email
          <input className={inputClassName} value={profile?.email ?? ""} disabled readOnly />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Phone
          <input className={inputClassName} placeholder="0901234567" type="tel" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Avatar URL
          <input className={inputClassName} placeholder="https://..." {...register("avatar")} />
          <FieldError message={errors.avatar?.message} />
        </label>

        <button type="submit" className={primaryButtonClassName} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
