"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const accountNav = [
  { href: "/account", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/security", label: "Security" }
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="self-start rounded-lg border border-line bg-white p-2 shadow-subtle lg:sticky lg:top-20">
        <nav className="flex gap-1 overflow-x-auto lg:grid" aria-label="Account navigation">
          {accountNav.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-ring shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition duration-200 ease-ui",
                  "inline-flex min-h-11 items-center",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted hover:bg-surface hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
