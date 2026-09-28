import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const changeMyPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const adminChangePasswordSchema = z
  .object({
    newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(70, "El nombre no puede exceder 70 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "USER"]),
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1, "El ID de usuario es requerido"),
  role: z.enum(["ADMIN", "USER"]),
});

// ─── Module Schemas ───────────────────────────────────────────
export const createModuleSchema = z.object({
  name: z.string().min(1, "El nombre del módulo es requerido").max(50),
});

// ─── Item Schemas ─────────────────────────────────────────────
export const createItemSchema = z.object({
  moduleId: z.string().min(1, "El ID del módulo es requerido"),
  name: z.string().min(1, "El nombre del artículo es requerido").max(100),
  packagingType: z.enum(["UNITARY", "PACKAGED"]),
  packs: z.number().int().min(0).default(0),
  unitsPerPack: z.number().int().min(1).default(1),
  totalUnits: z.number().int().min(0).default(0),
});

// ─── Transaction Schemas ──────────────────────────────────────
export const WITHDRAW_MOTIVES = [
  "Para mi",
  "Para evento",
  "Para la coordinación",
] as const;

export type WithdrawMotive = (typeof WITHDRAW_MOTIVES)[number];

export const createTransactionSchema = z
  .object({
    itemId: z.string().min(1, "El ID del artículo es requerido"),
    transactionType: z.enum(["IN", "OUT"]),
    quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
    motive: z.string().min(1, "El motivo es requerido"),
    eventName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.transactionType === "OUT") {
        return (WITHDRAW_MOTIVES as readonly string[]).includes(data.motive);
      }
      return true;
    },
    {
      message:
        "El motivo de retiro debe ser: 'Para mi', 'Para evento' o 'Para la coordinación'",
      path: ["motive"],
    }
  )
  .refine(
    (data) => {
      if (data.transactionType === "OUT" && data.motive === "Para evento") {
        return !!data.eventName && data.eventName.trim().length > 0;
      }
      return true;
    },
    {
      message: "El nombre del evento es obligatorio cuando el motivo es 'Para evento'",
      path: ["eventName"],
    }
  );

// ─── Types ────────────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ChangeMyPasswordInput = z.infer<typeof changeMyPasswordSchema>;
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
