import { z } from "zod";
import { phoneSchema } from "./user";

export const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1),
    phone: phoneSchema,
    address: z.string().min(1)
  }),
  paymentMethod: z.enum(["COD", "Momo", "BankTransfer"])
});

export const orderStatusSchema = z.enum([
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled"
]);
