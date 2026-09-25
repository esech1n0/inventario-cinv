import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// ─── Module Schemas ───────────────────────────────────────────
export const createModuleSchema = z.object({
  name: z.string().min(1, "El nombre del módulo es requerido").max(50),
});

// ─── Item Schemas ─────────────────────────────────────────────
export const createItemSchema = z.object({
  moduleId: z.string().cuid(),
  name: z.string().min(1, "El nombre del artículo es requerido").max(100),
  packagingType: z.enum(["UNITARY", "PACKAGED"]),
  packs: z.number().int().min(0).default(0),
  unitsPerPack: z.number().int().min(1).default(1),
  totalUnits: z.number().int().min(0).default(0),
});

// ─── Transaction Schemas ──────────────────────────────────────
export const createTransactionSchema = z.object({
  itemId: z.string().cuid(),
  transactionType: z.enum(["IN", "OUT"]),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
  motive: z.string().min(1, "El motivo es requerido"),
  eventName: z.string().optional(),
});

// ─── Types ────────────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
