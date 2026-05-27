import { z } from "zod";

export const productVariantSchema = z.object({
  sku: z.string().min(1),
  color: z.string().optional(),
  price: z.coerce.number().min(0),
  originalPrice: z.coerce.number().min(0).optional(),
  images: z.array(z.string().url()).optional(),
  isDefault: z.boolean().optional()
});

export const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  brand: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["Sunglasses", "Eyeglasses", "All"]).optional(),
  sale: z.boolean().optional(),
  availability: z.enum(["in_stock", "out_of_stock", "pre_order"]).optional(),
  images: z.array(z.string().url()).optional(),
  variants: z.array(productVariantSchema).min(1)
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(1),
  images: z.array(z.string().url()).optional()
});
