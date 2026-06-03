import type { Category } from "@/types/models";

export const fallbackHeaderCategories: Category[] = [
  { _id: "new-collection", name: "New collection", slug: "new-collection", order: 1, isActive: true },
  { _id: "best-seller", name: "Best Seller", slug: "best-seller", order: 2, isActive: true },
  { _id: "big-size", name: "Big Size", slug: "big-size", order: 3, isActive: true },
  { _id: "clearance-sale", name: "Clearance Sale", slug: "clearance-sale", order: 4, isActive: true },
  { _id: "medium-size", name: "Medium Size", slug: "medium-size", order: 5, isActive: true },
  { _id: "metal", name: "Metal", slug: "metal", order: 6, isActive: true },
  { _id: "small-size", name: "Small Size", slug: "small-size", order: 7, isActive: true }
];
