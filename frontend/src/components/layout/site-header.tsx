"use client";

import Link from "next/link";
import { ChevronDown, Menu, PackageCheck, Search, ShieldCheck, ShoppingBag, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ButtonLink } from "@/components/ui/button-link";
import { useCart } from "@/lib/hooks/use-cart";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import type { Category } from "@/types/models";

const navItems = [
  { href: "/products", label: "All products" },
  { href: "/products?type=Sunglasses", label: "Sunglasses" },
  { href: "/products?type=Eyeglasses", label: "Eyeglasses" }
];

type HeaderSearchFormProps = {
  className: string;
  inputKeyPrefix: string;
  placeholder: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function HeaderSearchForm({
  className,
  inputKeyPrefix,
  placeholder,
  onSubmit
}: HeaderSearchFormProps) {
  const searchParams = useSearchParams();
  const currentKeyword = searchParams.get("keyword") ?? "";

  return (
    <form className={className} role="search" onSubmit={onSubmit}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        key={`${inputKeyPrefix}-${currentKeyword}`}
        name="keyword"
        type="search"
        defaultValue={currentKeyword}
        autoComplete="off"
        className="focus-ring h-full w-full rounded-md border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted"
        placeholder={placeholder}
        aria-label="Search products"
      />
    </form>
  );
}

export function SiteHeader({ categories = [] }: { categories?: Category[] }) {
  const [open, setOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();
  const { data: cart } = useCart(Boolean(user));
  const cartCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const categoryNav = categories.map((category) => ({
    href: `/categories/${category.slug}`,
    label: category.name
  }));
  const selectedCategoryHref =
    categoryNav.find((category) => category.href === pathname)?.href ?? "";

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const keyword = String(formData.get("keyword") ?? "").trim();
    const href = keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : "/products";

    setOpen(false);
    router.push(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          IE213 Eyewear
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink">
              {item.label}
            </Link>
          ))}
          {categoryNav.length ? (
            <div
              className="relative"
              onMouseEnter={() => setCategoryMenuOpen(true)}
              onMouseLeave={() => setCategoryMenuOpen(false)}
              onFocus={() => setCategoryMenuOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setCategoryMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={categoryMenuOpen}
                className={`focus-ring inline-flex h-10 items-center gap-1 rounded-md px-3 text-sm font-medium transition ${
                  selectedCategoryHref
                    ? "bg-surface text-ink"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                Categories
                <ChevronDown className={`h-4 w-4 transition ${categoryMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`absolute left-0 top-full z-50 w-64 pt-2 transition duration-150 ${
                  categoryMenuOpen ? "visible opacity-100" : "invisible opacity-0"
                }`}
              >
                <div className="max-h-[min(420px,calc(100vh-96px))] overflow-y-auto rounded-lg border border-line bg-white p-2 shadow-soft">
                  {categoryNav.map((category) => {
                    const isActive = selectedCategoryHref === category.href;

                    return (
                      <Link
                        key={category.href}
                        href={category.href}
                        onClick={() => setCategoryMenuOpen(false)}
                        className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-brand-50 text-brand-700"
                            : "text-ink hover:bg-surface"
                        }`}
                      >
                        {category.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
          <Link
            href="/orders"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
          >
            <PackageCheck className="h-4 w-4" />
            Orders
          </Link>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Suspense fallback={null}>
            <HeaderSearchForm
              className="relative hidden h-10 w-44 items-center lg:flex xl:w-56"
              inputKeyPrefix="desktop-search"
              placeholder="Search"
              onSubmit={handleSearchSubmit}
            />
          </Suspense>
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
            <Suspense fallback={null}>
              <HeaderSearchForm
                className="relative mb-2 h-10"
                inputKeyPrefix="mobile-search"
                placeholder="Search products"
                onSubmit={handleSearchSubmit}
              />
            </Suspense>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface">
                {item.label}
              </Link>
            ))}
            {categoryNav.length ? (
              <details className="mx-3 mt-1 rounded-md border border-line bg-white">
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-semibold ${
                    selectedCategoryHref ? "text-brand-700" : "text-ink"
                  }`}
                >
                  Categories
                  <ChevronDown className="h-4 w-4" />
                </summary>
                <div className="grid gap-1 border-t border-line p-2">
                  {categoryNav.map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        selectedCategoryHref === category.href
                          ? "bg-brand-50 text-brand-700"
                          : "text-ink hover:bg-surface"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
            <Link href="/orders" className="mt-1 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-surface">
              <PackageCheck className="h-4 w-4" />
              Orders
            </Link>
            {[
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
