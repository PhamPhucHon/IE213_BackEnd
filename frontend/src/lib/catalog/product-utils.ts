import type { ApiMeta } from "@/types/api";
import type { Category, Product, ProductVariant } from "@/types/models";
import { toUserErrorMessage } from "@/lib/api/error-message";

export type CatalogPagination = {
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export function getDefaultVariant(product: Product) {
  return product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
}

export function getProductImages(product: Product, variant?: ProductVariant) {
  const selectedVariant = variant ?? getDefaultVariant(product);
  const images = [...(selectedVariant?.images ?? []), ...(product.images ?? [])];
  return Array.from(new Set(images.filter(Boolean)));
}

export function getProductImage(product: Product, variant?: ProductVariant) {
  return getProductImages(product, variant)[0] ?? null;
}

export function getProductPrice(product: Product, variant?: ProductVariant) {
  return variant?.price ?? getDefaultVariant(product)?.price ?? 0;
}

export function getProductOriginalPrice(product: Product, variant?: ProductVariant) {
  return variant?.originalPrice ?? getDefaultVariant(product)?.originalPrice;
}

export function getCategoryName(category: Product["categoryId"]) {
  if (typeof category === "string") return "";
  return category.name;
}

export function getCategoryId(category: Product["categoryId"]) {
  if (typeof category === "string") return category;
  return category._id;
}

export function getCategorySlug(category: Product["categoryId"]) {
  if (typeof category === "string") return "";
  return category.slug;
}

export function getActiveCategories(categories: Category[]) {
  return categories
    .filter((category) => category.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getPagination(meta?: ApiMeta): CatalogPagination {
  return {
    totalProducts: Number(meta?.totalProducts ?? meta?.total ?? 0),
    currentPage: Number(meta?.currentPage ?? meta?.page ?? 1),
    totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
    limit: Number(meta?.limit ?? 12)
  };
}

export function getCatalogErrorMessage(error: unknown) {
  return toUserErrorMessage(error, "Catalog data could not be loaded.");
}
