import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { emptyStateClassName } from "./style-primitives";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className
}: EmptyStateProps) {
  return (
    <section className={cn(emptyStateClassName, className)}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-surface text-muted">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h2 className="mt-4 break-words text-lg font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </section>
  );
}
