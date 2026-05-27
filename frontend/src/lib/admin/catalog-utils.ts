import type { ApiMeta } from "@/types/api";
import type { Inventory, Product } from "@/types/models";

export type InventoryPagination = {
  totalInventories: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export function getInventoryPagination(meta?: ApiMeta): InventoryPagination {
  return {
    totalInventories: Number(meta?.totalInventories ?? meta?.total ?? 0),
    currentPage: Number(meta?.currentPage ?? meta?.page ?? 1),
    totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
    limit: Number(meta?.limit ?? 20)
  };
}

export function getProductCategoryId(categoryId: Product["categoryId"]) {
  return typeof categoryId === "string" ? categoryId : categoryId._id;
}

export function getInventoryProduct(inventory: Inventory) {
  if (typeof inventory.productId === "string") {
    return {
      id: inventory.productId,
      name: "Product",
      slug: ""
    };
  }

  return {
    id: inventory.productId._id,
    name: inventory.productId.name,
    slug: inventory.productId.slug
  };
}

export function isLowStock(inventory: Pick<Inventory, "available">) {
  return inventory.available < 10;
}
