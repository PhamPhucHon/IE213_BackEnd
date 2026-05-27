"use client";

import Link from "next/link";
import { Menu, Search, ShieldCheck, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ButtonLink } from "@/components/ui/button-link";
import { useCart } from "@/lib/hooks/use-cart";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import type { Category } from "@/types/models";

const navItems = [
  { href: "/products", label: "All products" },
  { href: "/products?type=Sunglasses", label: "Sunglasses" },
  { href: "/products?type=Eyeglasses", label: "Eyeglasses" },
  { href: "/orders", label: "Orders" }
];

export function SiteHeader({ categories = [] }: { categories?: Category[] }) {
  const [open, setOpen] = useState(false);
  const { data: user, isLoading } = useCurrentUser();
  const { data: cart } = useCart(Boolean(user));
  const cartCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const categoryNav = categories.map((category) => ({
    href: `/categories/${category.slug}`,
    label: category.name
  }));
  const desktopNav = [...navItems.slice(0, 3), ...categoryNav, navItems[3]];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          IE213 Eyewear
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {desktopNav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <ButtonLink href="/products" variant="secondary">
            <Search className="mr-2 h-4 w-4" />
            Search
          </ButtonLink>
          {user ? (
            <>
              {user.isAdmin ? (
                <ButtonLink href="/admin" variant="ghost">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin
                </ButtonLink>
              ) : null}
              <ButtonLink href="/account" variant="ghost">
                <User className="mr-2 h-4 w-4" />
                {user.name || "Account"}
              </ButtonLink>
              <LogoutButton />
            </>
          ) : (
            <ButtonLink href="/login" variant="ghost">
              <User className="mr-2 h-4 w-4" />
              {isLoading ? "Checking..." : "Login"}
            </ButtonLink>
          )}
          <ButtonLink href="/cart">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Cart
            {cartCount ? (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink">
                {cartCount}
              </span>
            ) : null}
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label="Open navigation"
          className="focus-ring rounded-md p-2 text-ink sm:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-white sm:hidden">
          <nav className="container-page grid gap-1 py-3">
            {[
              ...navItems,
              ...categoryNav,
              ...(user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
              { href: user ? "/account" : "/login", label: user ? "Account" : "Login" },
              { href: "/cart", label: cartCount ? `Cart (${cartCount})` : "Cart" }
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface">
                {item.label}
              </Link>
            ))}
            {user ? (
              <LogoutButton className="justify-start px-3" redirectTo="/login" />
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
