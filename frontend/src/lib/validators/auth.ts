import { z } from "zod";

const optionalPhoneSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .regex(/^0\d{9}$/, "Phone must be 10 digits and start with 0")
]).optional();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: optionalPhoneSchema,
  password: z.string().min(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6)
});
