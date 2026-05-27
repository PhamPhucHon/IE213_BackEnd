import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { z } from "zod";
import { cn } from "@/lib/utils";

export const inputClassName =
  "focus-ring rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-muted";

export const primaryButtonClassName =
  "focus-ring inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60";

export function applyZodFieldErrors<T extends FieldValues>(
  error: z.ZodError,
  setError: UseFormSetError<T>
) {
  error.issues.forEach((issue) => {
    const field = issue.path.join(".");

    if (field) {
      setError(field as Path<T>, {
        type: "validate",
        message: issue.message
      });
    }
  });
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

export function FormAlert({
  children,
  tone = "error"
}: {
  children: React.ReactNode;
  tone?: "error" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {children}
    </div>
  );
}
