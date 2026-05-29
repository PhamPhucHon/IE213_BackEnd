"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@/types/models";
import type { CatalogSearchState } from "@/lib/catalog/query";
import { getActiveCategories } from "@/lib/catalog/product-utils";

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

function FilterFields({ categories, query }: ProductFiltersProps) {
  const activeCategories = getActiveCategories(categories);

  return (
    <div className="grid gap-4">
      {query.keyword ? <input type="hidden" name="keyword" value={query.keyword} /> : null}

      <label className="grid gap-1 text-sm font-medium text-ink">
        Category
        <select
          name="categoryId"
          defaultValue={query.categoryId ?? ""}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {activeCategories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Type
        <select
          name="type"
          defaultValue={query.type ?? ""}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="Sunglasses">Sunglasses</option>
          <option value="Eyeglasses">Eyeglasses</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Brand
        <input
          name="brand"
          defaultValue={query.brand ?? ""}
          className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          placeholder="Brand name"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-medium text-ink">
          Min price
          <input
            name="minPrice"
            defaultValue={query.minPrice ?? ""}
            className="focus-ring min-w-0 rounded-md border border-line px-3 py-2 text-sm"
            min={0}
            step={100000}
            type="number"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-ink">
          Max price
          <input
            name="maxPrice"
            defaultValue={query.maxPrice ?? ""}
            className="focus-ring min-w-0 rounded-md border border-line px-3 py-2 text-sm"
            min={0}
            step={100000}
            type="number"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Sort
        <select
          name="sort"
          defaultValue={query.sort ?? "newest"}
          className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const queryString = buildCleanProductQuery(new FormData(event.currentTarget));
    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <FilterFields categories={categories} query={query} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <button
          type="submit"
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
        >
          Apply filters
        </button>
        <Link
          href="/products"
          className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-center text-sm font-medium text-ink transition hover:bg-surface"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}

export function ProductFiltersPanel({ categories, query }: ProductFiltersProps) {
  return (
    <>
      <aside className="hidden rounded-lg border border-line bg-white p-5 lg:block">
        <h2 className="text-lg font-semibold text-ink">Filters</h2>
        <div className="mt-5">
          <ProductFilters categories={categories} query={query} />
        </div>
      </aside>

      <details className="rounded-lg border border-line bg-white p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Filter and sort</summary>
        <div className="mt-4">
          <ProductFilters categories={categories} query={query} compact />
        </div>
      </details>
    </>
  );
}
