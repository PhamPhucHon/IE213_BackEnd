import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { z } from "zod";
import {
  fieldErrorClassName,
  fieldHelpClassName,
  fieldClassName,
  getButtonClassName,
  type AlertTone
} from "@/components/ui/style-primitives";
import { StatusAlert } from "@/components/ui/status-alert";

export const inputClassName = fieldClassName;

export const primaryButtonClassName = getButtonClassName("primary");

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

export function getFieldDescribedBy(...ids: Array<string | false | null | undefined>) {
  const describedBy = ids.filter(Boolean).join(" ");
  return describedBy || undefined;
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={fieldErrorClassName}>
      {message}
    </p>
  );
}

export function FieldHelp({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className={fieldHelpClassName}>
      {children}
    </p>
  );
}

export function FormAlert({
  children,
  tone = "error"
}: {
  children: React.ReactNode;
  tone?: AlertTone;
}) {
  return <StatusAlert tone={tone}>{children}</StatusAlert>;
}
