import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: "default" | "compact" | "admin" | "storefront";
};

const variantClassNames = {
  default: {
    root: "border-b border-line pb-6",
    eyebrow: "text-brand-600",
    title: "text-3xl sm:text-4xl",
    description: "text-base leading-7"
  },
  compact: {
    root: "border-b border-line pb-5",
    eyebrow: "text-brand-600",
    title: "text-2xl sm:text-3xl",
    description: "text-sm leading-6"
  },
  admin: {
    root: "rounded-lg border border-line bg-white p-5 shadow-subtle",
    eyebrow: "text-brand-600",
    title: "text-2xl sm:text-3xl",
    description: "text-sm leading-6"
  },
  storefront: {
    root: "border-b border-line pb-7",
    eyebrow: "text-brand-700",
    title: "text-3xl sm:text-4xl",
    description: "text-base leading-7"
  }
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  variant = "default"
}: PageHeaderProps) {
  const classes = variantClassNames[variant];

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", classes.root)}>
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className={cn("text-sm font-semibold uppercase tracking-wide", classes.eyebrow)}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className={cn("mt-2 font-semibold tracking-tight text-ink", classes.title)}>
          {title}
        </h1>
        {description ? (
          <p className={cn("mt-3 max-w-2xl text-muted", classes.description)}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
