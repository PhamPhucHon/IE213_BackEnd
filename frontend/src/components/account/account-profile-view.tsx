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
  FieldHelp,
  FormAlert,
  applyZodFieldErrors,
  getFieldDescribedBy,
  inputClassName,
  primaryButtonClassName
} from "@/components/auth/form-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";

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
    return <Skeleton className="h-[420px]" />;
  }

  if (!sessionUser) {
    return null;
  }

  if (error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalUserErrorMessage(error)}
      </StatusAlert>
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
    <form className="rounded-lg border border-line bg-white p-5 shadow-subtle" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-ink">Profile information</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Update your customer profile. Email is used for account access and cannot be edited here.
      </p>

      <div className="mt-5 grid gap-4">
        {message ? <FormAlert tone="success">{message}</FormAlert> : null}
        {serverError ? <FormAlert>{serverError}</FormAlert> : null}

        <label className="grid gap-1 text-sm font-medium text-ink">
          Name
          <input
            className={inputClassName}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={getFieldDescribedBy(errors.name && "profile-name-error")}
            {...register("name")}
          />
          <FieldError id="profile-name-error" message={errors.name?.message} />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Email
          <input
            className={inputClassName}
            value={profile?.email ?? ""}
            disabled
            readOnly
            aria-describedby="profile-email-help"
          />
          <FieldHelp id="profile-email-help">Email is used for sign in and cannot be changed here.</FieldHelp>
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Phone
          <input
            className={inputClassName}
            placeholder="0901234567"
            type="tel"
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={getFieldDescribedBy(errors.phone && "profile-phone-error")}
            {...register("phone")}
          />
          <FieldError id="profile-phone-error" message={errors.phone?.message} />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Avatar URL
          <input
            className={inputClassName}
            placeholder="https://..."
            aria-invalid={errors.avatar ? "true" : undefined}
            aria-describedby={getFieldDescribedBy(errors.avatar && "profile-avatar-error")}
            {...register("avatar")}
          />
          <FieldError id="profile-avatar-error" message={errors.avatar?.message} />
        </label>

        <button type="submit" className={primaryButtonClassName} disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
