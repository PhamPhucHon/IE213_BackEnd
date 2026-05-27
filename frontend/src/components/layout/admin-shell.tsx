"use client";

import Link from "next/link";
import { BarChart3, Boxes, FolderTree, Glasses, PackageCheck, Star, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/products", label: "Products", icon: Glasses },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: PackageCheck },
  { href: "/admin/reviews", label: "Reviews", icon: Star }
];

function AdminAccessState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="container-page flex min-h-screen items-center justify-center py-10">
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
        description="Please try again after the backend is reachable."
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
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-line bg-white lg:block">
        <div className="border-b border-line p-5">
          <Link href="/admin" className="text-lg font-bold text-ink">
            IE213 Admin
          </Link>
          <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
        </div>
        <nav className="grid gap-1 p-3">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <LogoutButton className="w-full justify-start" redirectTo="/login" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-white lg:hidden">
          <div className="container-page flex h-14 items-center justify-between">
            <Link href="/admin" className="font-bold text-ink">
              IE213 Admin
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-sm font-medium text-muted">
                Store
              </Link>
              <LogoutButton className="h-9 px-2" redirectTo="/login" showIcon={false} />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
