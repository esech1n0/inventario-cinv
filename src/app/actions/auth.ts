"use server";

import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validations";
import { createAndStoreOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { AuthError } from "next-auth";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name") as string,
    email: (formData.get("email") as string)?.toLowerCase().trim(),
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos inválidos",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { success: false, error: "Este correo ya está registrado" };
  }

  const passwordHash = await bcryptjs.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email,
      passwordHash,
      role: "USER",
      isApproved: false,
    },
  });

  return { success: true };
}

export type RequestOTPResult = {
  success: boolean;
  error?: string;
  email?: string;
  cooldownRemaining?: number;
  simulated?: boolean;
  devOtp?: string;
};

/**
 * Paso 1 del 2FA: Valida credenciales y envía el código OTP al correo registrado.
 */
export async function requestLoginOTP(formData: FormData): Promise<RequestOTPResult> {
  const raw = {
    email: (formData.get("email") as string)?.toLowerCase().trim(),
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Credenciales inválidas",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return { success: false, error: "Credenciales inválidas" };
  }

  const isValidPassword = await bcryptjs.compare(
    parsed.data.password,
    user.passwordHash
  );

  if (!isValidPassword) {
    return { success: false, error: "Credenciales inválidas" };
  }

  if (!user.isApproved) {
    return {
      success: false,
      error: "Tu cuenta aún no ha sido aprobada por un administrador",
    };
  }

  // Generar y almacenar OTP
  const otpResult = await createAndStoreOTP(user.email);
  if (!otpResult.success) {
    return {
      success: false,
      error: otpResult.error,
      cooldownRemaining: otpResult.cooldownRemaining,
    };
  }

  // Enviar correo transaccional
  const emailResult = await sendOTPEmail(user.email, otpResult.otp);
  if (!emailResult.success && !emailResult.simulated) {
    return {
      success: false,
      error: emailResult.error || "No se pudo enviar el correo de verificación. Inténtalo más tarde.",
    };
  }

  const hasResend = !!process.env.RESEND_API_KEY;

  return {
    success: true,
    email: user.email,
    simulated: emailResult.simulated,
    devOtp: !hasResend ? otpResult.otp : undefined,
  };
}

/**
 * Reenviar código OTP respetando el tiempo de espera.
 */
export async function resendLoginOTP(formData: FormData): Promise<RequestOTPResult> {
  return requestLoginOTP(formData);
}

/**
 * Paso 2 del 2FA: Valida el código OTP y concede la sesión al usuario.
 */
export async function loginWithOTP(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;
  const otp = (formData.get("otp") as string)?.trim();

  if (!email || !password) {
    return { success: false, error: "Credenciales incompletas" };
  }

  if (!otp || otp.length < 6) {
    return { success: false, error: "Introduce el código de verificación de 6 dígitos" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      otp,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      const msg = error.message || "";
      if (msg.includes("ACCOUNT_NOT_APPROVED")) {
        return {
          success: false,
          error: "Tu cuenta aún no ha sido aprobada por un administrador",
        };
      }
      if (msg.includes("Demasiados intentos")) {
        return {
          success: false,
          error: "Demasiados intentos incorrectos. Por seguridad solicita un nuevo código.",
        };
      }
      if (msg.includes("expirado")) {
        return {
          success: false,
          error: "El código ha expirado. Por favor solicita uno nuevo.",
        };
      }
      if (msg.includes("incorrecto") || msg.includes("OTP_INVALID")) {
        return {
          success: false,
          error: "Código de verificación incorrecto. Inténtalo de nuevo.",
        };
      }
      return { success: false, error: "Credenciales o código de verificación inválidos" };
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

    const errMessage = error instanceof Error ? error.message : "Error al validar el acceso";
    return { success: false, error: errMessage };
  }
}
