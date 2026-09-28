"use server";

import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, auth } from "@/lib/auth";
import { registerSchema, loginSchema, changeMyPasswordSchema } from "@/lib/validations";
import { AuthError } from "next-auth";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function registerUser(_formData: FormData): Promise<ActionResult> {
  return {
    success: false,
    error: "El registro público está deshabilitado. Las cuentas son ingresadas directamente por el administrador.",
  };
}

/**
 * Inicia sesión directamente con correo y contraseña (sin 2FA).
 */
export async function loginUser(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Credenciales inválidas",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Correo o contraseña incorrectos",
      };
    }

    // Permitir redirecciones de Next.js
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as Record<string, unknown>).digest === "string" &&
      ((error as Record<string, unknown>).digest as string).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    const errMessage = error instanceof Error ? error.message : "Error al iniciar sesión";
    return { success: false, error: errMessage };
  }
}

/**
 * Permite al usuario autenticado cambiar su propia contraseña.
 */
export async function changeMyPassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión para cambiar tu contraseña" };
  }

  const raw = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = changeMyPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos no válidos",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const isMatch = await bcryptjs.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: "La contraseña actual es incorrecta" };
  }

  const passwordHash = await bcryptjs.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true };
}
