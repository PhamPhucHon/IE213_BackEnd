import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  alertToneClassNames,
  getAlertClassName,
  type AlertTone
} from "./style-primitives";

type StatusAlertProps = {
  children: ReactNode;
  tone?: AlertTone;
  title?: string;
  className?: string;
  id?: string;
};

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info
} as const;

export type StatusAlertTone = AlertTone;

export function StatusAlert({
  children,
  tone = "error",
  title,
  className,
  id
}: StatusAlertProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      id={id}
      className={cn(
        getAlertClassName(tone),
        "flex items-start gap-3",
        className
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="break-words font-semibold">{title}</p> : null}
        <div className={cn("min-w-0 break-words", title && "mt-1")}>{children}</div>
      </div>
    </div>
  );
}

export { alertToneClassNames };
