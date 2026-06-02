"use client";

import Link from "next/link";
import { BarChart3, Boxes, FolderTree, Glasses, PackageCheck, Star, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/products", label: "Products", icon: Glasses },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: PackageCheck },
  { href: "/admin/reviews", label: "Reviews", icon: Star }
];

function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminAccessState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <main id="main-content" className="container-page flex min-h-[100dvh] items-center justify-center py-10" tabIndex={-1}>
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
    </main>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    data: user,
    isError,
    isLoading
  } = useCurrentUser();

  useEffect(() => {
    if (isLoading || isError) return;

    if (!user) {
      const next = encodeURIComponent(pathname || "/admin");
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!user.isAdmin) {
      router.replace("/");
    }
  }, [isError, isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <AdminAccessState
        title="Checking admin access"
        description="Your session is being verified before the dashboard loads."
      />
    );
  }

  if (isError) {
    return (
      <AdminAccessState
        title="Could not verify session"
        description="Please try again after the service is available."
      />
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <AdminAccessState
        title="Redirecting"
        description="This area is reserved for administrator accounts."
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col">
        <div className="min-w-0 border-b border-line p-5">
          <Link href="/admin" className="focus-ring rounded-md text-lg font-bold text-ink">
            IE213 Admin
          </Link>
          <p className="mt-1 truncate text-sm text-muted" title={user.email}>{user.email}</p>
        </div>
        <nav className="grid gap-1 p-3" aria-label="Admin navigation">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = isAdminNavActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition duration-200 ease-ui",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted hover:bg-surface hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-line p-3">
          <Link
            href="/"
            className="focus-ring mb-2 flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink"
          >
            Storefront
          </Link>
          <LogoutButton className="w-full justify-start" redirectTo="/login" />
        </div>
      </aside>

      <div id="main-content" className="min-w-0" tabIndex={-1}>
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 shadow-subtle backdrop-blur lg:hidden">
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <Link href="/admin" className="focus-ring min-w-0 truncate rounded-md font-bold text-ink">
              IE213 Admin
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/" className="focus-ring inline-flex min-h-10 items-center rounded-md px-2 text-sm font-semibold text-muted hover:bg-surface hover:text-ink">
                Store
              </Link>
              <LogoutButton className="min-h-10 px-2" redirectTo="/login" showIcon={false} />
            </div>
          </div>
          <nav className="container-page flex gap-2 overflow-x-auto pb-3" aria-label="Admin navigation">
            {adminNav.map((item) => {
              const isActive = isAdminNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm font-semibold transition",
                    isActive
                      ? "border-brand-100 bg-brand-50 text-brand-700"
                      : "border-line bg-white text-ink hover:bg-surface"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
