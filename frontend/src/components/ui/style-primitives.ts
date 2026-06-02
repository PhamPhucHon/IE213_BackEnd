import { cn } from "@/lib/utils";

export const buttonBaseClassName =
  "focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold leading-none transition duration-200 ease-ui disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px";

export const buttonVariantClassNames = {
  primary: "bg-ink text-white shadow-button hover:bg-slate-950",
  secondary:
    "border border-line bg-white text-ink shadow-subtle hover:border-line-strong hover:bg-surface",
  ghost: "text-ink hover:bg-surface",
  danger:
    "border border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-100",
  success:
    "border border-success-200 bg-success-50 text-success-700 hover:bg-success-100"
} as const;

export type ButtonVariant = keyof typeof buttonVariantClassNames;

export function getButtonClassName(
  variant: ButtonVariant = "primary",
  className?: string
) {
  return cn(buttonBaseClassName, buttonVariantClassNames[variant], className);
}

export const fieldClassName =
  "focus-ring min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink shadow-field transition duration-200 ease-ui placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted aria-[invalid=true]:border-danger-300 aria-[invalid=true]:bg-danger-50";

export function getFieldClassName(hasError?: boolean, className?: string) {
  return cn(fieldClassName, hasError && "border-danger-300 bg-danger-50", className);
}

export const selectClassName = cn(fieldClassName, "appearance-auto pr-8");

export const textareaClassName = cn(
  fieldClassName,
  "h-auto min-h-28 resize-y py-2 leading-6"
);

export function getTextareaClassName(hasError?: boolean, className?: string) {
  return cn(textareaClassName, hasError && "border-danger-300 bg-danger-50", className);
}

export const formLabelClassName = "grid gap-1 text-sm font-medium text-ink";

export const fieldHelpClassName = "text-xs leading-5 text-muted";

export const fieldErrorClassName = "text-xs font-medium leading-5 text-danger-700";

export const checkboxClassName =
  "focus-ring h-4 w-4 rounded border-line text-ink disabled:cursor-not-allowed disabled:opacity-60";

export const radioClassName =
  "focus-ring h-4 w-4 border-line text-ink disabled:cursor-not-allowed disabled:opacity-60";

export const cardClassName =
  "rounded-lg border border-line bg-white shadow-subtle";

export const elevatedCardClassName =
  "rounded-lg border border-line bg-white shadow-soft";

export const emptyStateClassName =
  "rounded-lg border border-dashed border-line bg-white p-8 text-center";

export const skeletonClassName =
  "animate-shimmer rounded-md bg-[length:200%_100%] bg-gradient-to-r from-surface via-line-subtle to-surface motion-reduce:animate-none motion-reduce:bg-surface";

export const alertBaseClassName =
  "rounded-md border px-3 py-2 text-sm leading-6";

export const alertToneClassNames = {
  error: "border-danger-200 bg-danger-50 text-danger-800",
  success: "border-success-200 bg-success-50 text-success-800",
  warning: "border-warning-200 bg-warning-50 text-warning-800",
  info: "border-info-200 bg-info-50 text-info-800"
} as const;

export type AlertTone = keyof typeof alertToneClassNames;

export function getAlertClassName(tone: AlertTone = "error", className?: string) {
  return cn(alertBaseClassName, alertToneClassNames[tone], className);
}

export const modalOverlayClassName =
  "fixed inset-0 z-50 grid items-end justify-items-center overflow-y-auto bg-black/45 p-3 sm:place-items-center sm:p-4";

export const modalPanelClassName =
  "max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto rounded-lg border border-line bg-white shadow-soft sm:max-h-[calc(100dvh-2rem)]";

export const badgeClassName =
  "inline-flex items-center rounded-md border border-line bg-surface px-2 py-0.5 text-xs font-semibold text-muted";

export const badgeToneClassNames = {
  neutral: "border-line bg-surface text-muted",
  success: "border-success-200 bg-success-50 text-success-700",
  warning: "border-warning-200 bg-warning-50 text-warning-700",
  danger: "border-danger-200 bg-danger-50 text-danger-700",
  info: "border-info-200 bg-info-50 text-info-700"
} as const;

export type BadgeTone = keyof typeof badgeToneClassNames;

export function getBadgeClassName(tone: BadgeTone = "neutral", className?: string) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
    badgeToneClassNames[tone],
    className
  );
}
