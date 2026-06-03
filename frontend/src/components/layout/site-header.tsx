"use client";

import Link from "next/link";
import { ChevronDown, Menu, Search, ShieldCheck, ShoppingBag, User as UserIcon, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ButtonLink } from "@/components/ui/button-link";
import { useCart } from "@/lib/hooks/use-cart";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/models";

const navItems = [
  { href: "/products", label: "All products" },
  { href: "/products?type=Sunglasses", label: "Sunglasses" },
  { href: "/products?type=Eyeglasses", label: "Eyeglasses" }
];

function isPathActive(pathname: string, href: string) {
  if (href.includes("?")) return false;
  const [path] = href.split("?");
  if (path === "/products") return pathname === "/products";
  return pathname === path;
}

function isProductNavActive(
  pathname: string,
  searchParams: { get(name: string): string | null },
  href: string
) {
  const [path, queryString] = href.split("?");

  if (pathname !== path) return false;

  if (!queryString) {
    return path === "/products" ? !searchParams.get("type") : true;
  }

  const targetParams = new URLSearchParams(queryString);
  let matches = true;

  targetParams.forEach((value, key) => {
    if (searchParams.get(key) !== value) {
      matches = false;
    }
  });

  return matches;
}

function navLinkClassName(isActive: boolean) {
  return cn(
    "focus-ring inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition duration-200 ease-ui",
    isActive
      ? "bg-brand-50 text-brand-700"
      : "text-muted hover:bg-surface hover:text-ink"
  );
}

function mobileNavLinkClassName(isActive: boolean) {
  return cn(
    "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition",
    isActive ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-surface"
  );
}

function HeaderAvatar({
  avatar,
  name,
  className = "mr-2 h-7 w-7"
}: {
  avatar?: string;
  name?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface bg-cover bg-center text-muted",
        className
      )}
      style={avatar ? { backgroundImage: `url(${avatar})` } : undefined}
    >
      {avatar ? (
        <span className="sr-only">{name ? `${name} avatar` : "Account avatar"}</span>
      ) : (
        <UserIcon className="h-4 w-4" aria-hidden="true" />
      )}
    </span>
  );
}

function ProductNavLinks({
  pathname,
  onNavigate
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();

  return (
    <>
      {navItems.map((item) => {
        const isActive = isProductNavActive(pathname, searchParams, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={navLinkClassName(isActive)}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function ProductNavLinksFallback({
  onNavigate
}: {
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={navLinkClassName(false)}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

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
        className="focus-ring h-full min-w-0 rounded-md border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted"
        placeholder={placeholder}
        aria-label="Search products"
      />
    </form>
  );
}

export function SiteHeader({ categories = [] }: { categories?: Category[] }) {
  const [open, setOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement | null>(null);
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
  const categoryMenuId = "site-category-menu";

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const keyword = String(formData.get("keyword") ?? "").trim();
    const href = keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : "/products";

    setOpen(false);
    router.push(href);
  }

  const closeCategoryMenu = useCallback(() => {
    setCategoryMenuOpen(false);
  }, []);

  function handleCategoryMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;

    event.stopPropagation();
    closeCategoryMenu();
    categoryTriggerRef.current?.focus();
  }

  useEffect(() => {
    if (!categoryMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node) || categoryMenuRef.current?.contains(target)) {
        return;
      }

      closeCategoryMenu();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [categoryMenuOpen, closeCategoryMenu]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-subtle backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="focus-ring shrink-0 rounded-md text-lg font-bold tracking-tight text-ink">
          IE213 <span className="text-brand-700">Eyewear</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Suspense fallback={<ProductNavLinksFallback />}>
            <ProductNavLinks pathname={pathname} />
          </Suspense>
          {categoryNav.length ? (
            <div
              ref={categoryMenuRef}
              className="relative"
              onMouseEnter={() => setCategoryMenuOpen(true)}
              onMouseLeave={closeCategoryMenu}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  closeCategoryMenu();
                }
              }}
              onKeyDown={handleCategoryMenuKeyDown}
            >
              <button
                ref={categoryTriggerRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={categoryMenuOpen}
                aria-controls={categoryMenuId}
                className={`focus-ring inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm font-semibold transition ${
                  selectedCategoryHref
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
                onClick={() => setCategoryMenuOpen((value) => !value)}
              >
                Categories
                <ChevronDown className={`h-4 w-4 transition ${categoryMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`absolute left-0 top-full z-50 w-64 pt-2 transition duration-150 ${
                  categoryMenuOpen ? "visible opacity-100" : "invisible opacity-0"
                }`}
              >
                <nav
                  id={categoryMenuId}
                  aria-label="Product categories"
                  className="max-h-[min(420px,calc(100vh-96px))] overflow-y-auto rounded-lg border border-line bg-white p-2 shadow-soft"
                >
                  {categoryNav.map((category) => {
                    const isActive = selectedCategoryHref === category.href;

                    return (
                      <Link
                        key={category.href}
                        href={category.href}
                        onClick={() => setCategoryMenuOpen(false)}
                        className={`block min-h-11 rounded-md px-3 py-3 text-sm font-medium transition ${
                          isActive
                            ? "bg-brand-50 text-brand-700"
                            : "text-ink hover:bg-surface"
                        }`}
                      >
                        {category.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          ) : null}
        </nav>

        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <Suspense fallback={null}>
            <HeaderSearchForm
              className="relative hidden h-11 w-44 items-center lg:flex xl:w-56"
              inputKeyPrefix="desktop-search"
              placeholder="Search"
              onSubmit={handleSearchSubmit}
            />
          </Suspense>
          {user ? (
            <>
              {user.isAdmin ? (
                <ButtonLink href="/admin" variant="ghost" className="hidden md:inline-flex">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin
                </ButtonLink>
              ) : null}
              <ButtonLink
                href="/account"
                variant="ghost"
                className={cn(pathname.startsWith("/account") && "bg-brand-50 text-brand-700")}
              >
                <HeaderAvatar avatar={user.avatar} name={user.name} />
                <span className="max-w-20 truncate xl:max-w-28">{user.name || "Account"}</span>
              </ButtonLink>
              <LogoutButton className="hidden md:inline-flex" />
            </>
          ) : (
            <ButtonLink
              href="/login"
              variant="ghost"
              className={cn(pathname === "/login" && "bg-brand-50 text-brand-700")}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              {isLoading ? "Checking..." : "Sign in"}
            </ButtonLink>
          )}
          <ButtonLink
            href="/cart"
            className={cn(pathname === "/cart" && "bg-slate-950")}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span className="sr-only xl:not-sr-only">Cart</span>
            {cartCount ? (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink">
                {cartCount}
              </span>
            ) : null}
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="site-navigation-menu"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-surface lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div id="site-navigation-menu" className="border-t border-line bg-white shadow-soft lg:hidden">
          <nav className="container-page grid max-h-[calc(100dvh-4rem)] gap-1 overflow-y-auto py-3">
            <Suspense fallback={null}>
              <HeaderSearchForm
                className="relative mb-2 h-11"
                inputKeyPrefix="mobile-search"
                placeholder="Search products"
                onSubmit={handleSearchSubmit}
              />
            </Suspense>
            <Suspense fallback={<ProductNavLinksFallback onNavigate={() => setOpen(false)} />}>
              <ProductNavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </Suspense>
            {categoryNav.length ? (
              <details className="mt-1 rounded-md border border-line bg-white">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold ${
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
                      className={`min-h-11 rounded-md px-3 py-3 text-sm font-medium ${
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
            {user?.isAdmin ? (
              <Link
                href="/admin"
                className={mobileNavLinkClassName(isPathActive(pathname, "/admin"))}
                onClick={() => setOpen(false)}
              >
                <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                Admin
              </Link>
            ) : null}
            <Link
              href={user ? "/account" : "/login"}
              className={mobileNavLinkClassName(user ? pathname.startsWith("/account") : pathname === "/login")}
              onClick={() => setOpen(false)}
            >
              {user ? (
                <>
                  <HeaderAvatar avatar={user.avatar} name={user.name} />
                  <span className="min-w-0 truncate">{user.name || "Account"}</span>
                </>
              ) : (
                <>
                  <UserIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign in
                </>
              )}
            </Link>
            <Link
              href="/cart"
              className={mobileNavLinkClassName(pathname === "/cart")}
              onClick={() => setOpen(false)}
            >
              <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
              {cartCount ? `Cart (${cartCount})` : "Cart"}
            </Link>
            {user ? (
              <LogoutButton className="justify-start px-3" redirectTo="/login" />
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
