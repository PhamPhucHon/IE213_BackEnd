"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { z } from "zod";
import { profileSchema } from "@/lib/validators/user";
import {
  getLocalUserErrorMessage,
  LocalUserError,
  updateProfile,
  uploadProfileAvatar
} from "@/lib/api/local-users";
import { currentUserQueryKey, useCurrentUser } from "@/lib/hooks/use-current-user";
import { profileQueryKey, useProfile } from "@/lib/hooks/use-account";
import { cn } from "@/lib/utils";
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
import { useToast } from "@/components/ui/toast-provider";

type ProfileFormValues = z.infer<typeof profileSchema>;

function AvatarPreview({
  src,
  name,
  className
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 bg-cover bg-center text-sm font-semibold text-brand-700",
        className
      )}
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    >
      {src ? (
        <span className="sr-only">{name} avatar</span>
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

function getAvatarUploadMessage(error: unknown) {
  if (error instanceof LocalUserError) {
    if (error.status === 403) {
      return "Image storage is not allowed to upload right now. Please check the Cloudinary upload credentials.";
    }

    if (error.status === 413) {
      return "Choose an image that is 5MB or smaller.";
    }

    if (error.status === 415) {
      return "Choose a JPG, PNG, WEBP, or AVIF image.";
    }

    if (error.status === 502) {
      return "Image storage rejected the upload. Please check the Cloudinary configuration.";
    }

    if (error.status === 504) {
      return "Image storage took too long to respond. Please try again in a moment.";
    }
  }

  return "Could not update your avatar. Please try again.";
}

export function AccountProfileView() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: sessionUser, isLoading: isLoadingSession } = useCurrentUser();
  const { data: profile, isLoading, error } = useProfile(Boolean(sessionUser));
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedAvatar = watch("avatar") ?? "";
  const previewName = profile?.name ?? sessionUser?.name ?? "Account";
  const currentAvatar = selectedAvatar || profile?.avatar || sessionUser?.avatar || "";

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

  async function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) return;

    setMessage(null);
    setServerError(null);
    setIsUploadingAvatar(true);

    try {
      const uploaded = await uploadProfileAvatar(file);
      const avatar = uploaded.imageUrl;
      const nextProfile = await updateProfile({ avatar });
      const nextAvatar = nextProfile.avatar || avatar;

      setValue("avatar", nextAvatar, {
        shouldDirty: false,
        shouldValidate: true
      });
      queryClient.setQueryData(profileQueryKey, nextProfile);
      queryClient.setQueryData(currentUserQueryKey, nextProfile);
      setMessage(null);
      showToast({
        title: "Avatar updated",
        variant: "success"
      });
    } catch (error) {
      if (error instanceof LocalUserError && error.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setServerError(null);
      showToast({
        title: "Avatar upload failed",
        description: getAvatarUploadMessage(error),
        variant: "error"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

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

        <div className="rounded-md border border-line bg-surface p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <AvatarPreview src={currentAvatar} name={previewName} className="h-20 w-20 text-2xl" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Profile avatar</p>
                <p className="mt-1 truncate text-sm text-muted">{profile?.email ?? sessionUser.email}</p>
              </div>
            </div>

            <div className="min-w-0">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={handleAvatarFileChange}
              />
              <button
                type="button"
                className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={isUploadingAvatar || isSubmitting}
                aria-busy={isUploadingAvatar}
                onClick={() => avatarFileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                {isUploadingAvatar ? "Uploading..." : "Change avatar"}
              </button>
            </div>
          </div>

          <input type="hidden" aria-invalid={errors.avatar ? "true" : undefined} {...register("avatar")} />
          <FieldError id="profile-avatar-error" message={errors.avatar?.message} />
        </div>

        <button
          type="submit"
          className={primaryButtonClassName}
          disabled={isSubmitting || isUploadingAvatar}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
