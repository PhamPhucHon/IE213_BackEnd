"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { Category } from "@/types/models";
import type { CatalogSearchState } from "@/lib/catalog/query";
import { getActiveCategories } from "@/lib/catalog/product-utils";
import { cn } from "@/lib/utils";
import {
  fieldHelpClassName,
  fieldClassName,
  formLabelClassName,
  getButtonClassName,
  selectClassName
} from "@/components/ui/style-primitives";

type ProductFiltersProps = {
  categories: Category[];
  query: CatalogSearchState;
  compact?: boolean;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildCleanProductQuery(formData: FormData) {
  const params = new URLSearchParams();

  [
    "keyword",
    "categoryId",
    "type",
    "brand",
    "minPrice",
    "maxPrice"
  ].forEach((key) => {
    const value = formValue(formData, key);

    if (value) {
      params.set(key, value);
    }
  });

  const sort = formValue(formData, "sort");
  if (sort && sort !== "newest") {
    params.set("sort", sort);
  }

  const limit = formValue(formData, "limit");
  if (limit && limit !== "12") {
    params.set("limit", limit);
  }

  return params.toString();
}

const sortLabels = {
  newest: "Newest",
  topRated: "Top rated",
  priceAsc: "Price low to high",
  priceDesc: "Price high to low"
} as const;

function activeFilterLabels(categories: Category[], query: CatalogSearchState) {
  const activeCategories = getActiveCategories(categories);
  const selectedCategory = activeCategories.find((category) => category._id === query.categoryId);

  return [
    query.keyword ? `Search: ${query.keyword}` : null,
    selectedCategory ? `Category: ${selectedCategory.name}` : null,
    query.type ? `Type: ${query.type}` : null,
    query.brand ? `Brand: ${query.brand}` : null,
    query.minPrice !== undefined ? `Min: ${query.minPrice}` : null,
    query.maxPrice !== undefined ? `Max: ${query.maxPrice}` : null,
    query.sort && query.sort !== "newest" ? `Sort: ${sortLabels[query.sort]}` : null
  ].filter((item): item is string => Boolean(item));
}

function FilterFields({ categories, query }: ProductFiltersProps) {
  const activeCategories = getActiveCategories(categories);

  return (
    <div className="grid gap-4">
      {query.keyword ? <input type="hidden" name="keyword" value={query.keyword} /> : null}

      <label className={formLabelClassName}>
        Category
        <select
          name="categoryId"
          defaultValue={query.categoryId ?? ""}
          className={selectClassName}
        >
          <option value="">All categories</option>
          {activeCategories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className={formLabelClassName}>
        Type
        <select
          name="type"
          defaultValue={query.type ?? ""}
          className={selectClassName}
        >
          <option value="">All types</option>
          <option value="Sunglasses">Sunglasses</option>
          <option value="Eyeglasses">Eyeglasses</option>
        </select>
      </label>

      <label className={formLabelClassName}>
        Brand
        <input
          name="brand"
          defaultValue={query.brand ?? ""}
          className={fieldClassName}
          placeholder="Brand name"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
        <label className={formLabelClassName}>
          Min price
            <input
              name="minPrice"
              defaultValue={query.minPrice ?? ""}
              className={cn(fieldClassName, "min-w-0")}
            min={0}
            step={100000}
            type="number"
          />
        </label>
        <label className={formLabelClassName}>
          Max price
            <input
              name="maxPrice"
              defaultValue={query.maxPrice ?? ""}
              className={cn(fieldClassName, "min-w-0")}
            min={0}
            step={100000}
            type="number"
          />
        </label>
      </div>
      <p className={fieldHelpClassName}>Prices are filtered in VND and empty values are ignored.</p>

      <label className={formLabelClassName}>
        Sort
        <select
          name="sort"
          defaultValue={query.sort ?? "newest"}
          className={selectClassName}
        >
          <option value="newest">Newest</option>
          <option value="topRated">Top rated</option>
          <option value="priceAsc">Price low to high</option>
          <option value="priceDesc">Price high to low</option>
        </select>
      </label>

      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="limit" value={query.limit} />
    </div>
  );
}

export function ProductFilters({ categories, query }: ProductFiltersProps) {
  const router = useRouter();
  const activeLabels = activeFilterLabels(categories, query);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const queryString = buildCleanProductQuery(new FormData(event.currentTarget));
    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      {activeLabels.length ? (
        <div className="grid gap-2 overflow-hidden rounded-md border border-line bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Applied</p>
          <div className="flex flex-wrap gap-2">
            {activeLabels.map((label) => (
              <span
                key={label}
                className="max-w-full break-words rounded-md bg-white px-2.5 py-1 text-xs font-medium text-ink shadow-subtle"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <FilterFields categories={categories} query={query} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <button
          type="submit"
          className={getButtonClassName("primary", "w-full")}
        >
          Apply filters
        </button>
        <Link
          href="/products"
          className={getButtonClassName("secondary", "w-full")}
        >
          Clear
        </Link>
      </div>
    </form>
  );
}

export function ProductFiltersPanel({ categories, query }: ProductFiltersProps) {
  const activeLabels = activeFilterLabels(categories, query);

  return (
    <>
      <aside className="hidden self-start rounded-lg border border-line bg-white p-5 shadow-subtle lg:block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Filters</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Narrow the catalog without losing your current search.</p>
          </div>
          {activeLabels.length ? (
            <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
              {activeLabels.length}
            </span>
          ) : null}
        </div>
        <div className="mt-5">
          <ProductFilters categories={categories} query={query} />
        </div>
      </aside>

      <details className="group overflow-hidden rounded-lg border border-line bg-white shadow-subtle lg:hidden">
        <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-surface [&::-webkit-details-marker]:hidden">
          <span className="inline-flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block">Filter and sort</span>
              {activeLabels.length ? (
                <span className="mt-0.5 block text-xs font-medium text-muted">
                  {activeLabels.length} active filter{activeLabels.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-line p-4">
          <ProductFilters categories={categories} query={query} compact />
        </div>
      </details>
    </>
  );
}
