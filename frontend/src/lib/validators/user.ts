import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^(0[1-9][0-9]{8})$/, "Phone must look like 0901234567");

const optionalPhoneSchema = z.union([z.literal(""), phoneSchema]).optional();

export const profileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: optionalPhoneSchema,
  avatar: z.string().url().or(z.literal("")).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

export const addressSchema = z.object({
  label: z.string().optional(),
  address: z.string().min(1),
  isDefault: z.boolean().optional()
});
