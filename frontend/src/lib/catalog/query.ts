import type { ProductListQuery } from "@/lib/api/products";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export type CatalogSearchState = ProductListQuery & {
  limit: number;
  page: number;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function optionalString(value: string | string[] | undefined) {
  const resolved = firstValue(value)?.trim();
  return resolved || undefined;
}

function optionalNumber(value: string | string[] | undefined) {
  const raw = firstValue(value)?.trim();

  if (!raw) {
    return undefined;
  }

  const resolved = Number(raw);
  return Number.isFinite(resolved) && resolved >= 0 ? resolved : undefined;
}

function optionalPage(value: string | string[] | undefined, fallback: number) {
  const resolved = Number(firstValue(value));
  return Number.isInteger(resolved) && resolved > 0 ? resolved : fallback;
}

function optionalLimit(value: string | string[] | undefined, fallback: number) {
  const resolved = optionalPage(value, fallback);
  return Math.min(resolved, 48);
}

function optionalType(value: string | string[] | undefined) {
  const resolved = firstValue(value);
  return resolved === "Sunglasses" || resolved === "Eyeglasses" ? resolved : undefined;
}

function optionalSort(value: string | string[] | undefined) {
  const resolved = firstValue(value);
  return resolved === "priceAsc" ||
    resolved === "priceDesc" ||
    resolved === "topRated" ||
    resolved === "newest"
    ? resolved
    : "newest";
}

export function parseCatalogSearchParams(
  searchParams: SearchParamsInput,
  defaults: Partial<CatalogSearchState> = {}
): CatalogSearchState {
  return {
    keyword: optionalString(searchParams.keyword) ?? defaults.keyword,
    categoryId: optionalString(searchParams.categoryId) ?? defaults.categoryId,
    brand: optionalString(searchParams.brand) ?? defaults.brand,
    minPrice: optionalNumber(searchParams.minPrice) ?? defaults.minPrice,
    maxPrice: optionalNumber(searchParams.maxPrice) ?? defaults.maxPrice,
    type: optionalType(searchParams.type) ?? defaults.type,
    sort: optionalSort(searchParams.sort) ?? defaults.sort ?? "newest",
    page: optionalPage(searchParams.page, defaults.page ?? 1),
    limit: optionalLimit(searchParams.limit, defaults.limit ?? 12)
  };
}

export function toProductListQuery(state: CatalogSearchState): ProductListQuery {
  return {
    keyword: state.keyword,
    categoryId: state.categoryId,
    brand: state.brand,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    type: state.type,
    sort: state.sort,
    page: state.page,
    limit: state.limit
  };
}

export function buildCatalogHref(
  basePath: string,
  current: CatalogSearchState,
  updates: Partial<CatalogSearchState>
) {
  const next = {
    ...current,
    ...updates
  };
  const params = new URLSearchParams();

  Object.entries(next).forEach(([key, value]) => {
    if (
      key === "limit" ||
      (key === "page" && Number(value) === 1) ||
      (key === "sort" && value === "newest")
    ) {
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  if (next.limit !== 12) {
    params.set("limit", String(next.limit));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
