import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Cooldown de 60 segundos entre reenvíos de código
const OTP_COOLDOWN_MS = 60 * 1000;
// Expiración de 10 minutos para el código
const OTP_EXPIRATION_MS = 10 * 60 * 1000;
// Límite máximo de intentos fallidos antes de anular el código
const MAX_FAILED_ATTEMPTS = 5;

// Rastreador en memoria de intentos fallidos por email
const failedAttemptsMap = new Map<string, { count: number; firstAttempt: number }>();
// Rastreador en memoria de última solicitud de OTP (para cooldown)
const lastRequestMap = new Map<string, number>();

function getSecretKey(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "cinv_inventory_secure_2fa_secret_key"
  );
}

/**
 * Genera un código OTP numérico de 6 dígitos con aleatoriedad criptográfica segura.
 */
export function generateNumericOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Genera un hash HMAC/SHA-256 para evitar almacenar el OTP en texto plano en la base de datos.
 */
export function hashOTP(email: string, otp: string): string {
  const secret = getSecretKey();
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase().trim()}:${otp.trim()}:${secret}`)
    .digest("hex");
}

export type GenerateOTPResult =
  | { success: true; otp: string; cooldownRemaining?: number }
  | { success: false; error: string; cooldownRemaining?: number };

/**
 * Crea, almacena y retorna un nuevo código OTP para el correo especificado.
 */
export async function createAndStoreOTP(email: string): Promise<GenerateOTPResult> {
  const cleanEmail = email.toLowerCase().trim();
  const now = Date.now();
  const lastRequest = lastRequestMap.get(cleanEmail);

  // Verificación de cooldown
  if (lastRequest && now - lastRequest < OTP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - lastRequest)) / 1000);
    return {
      success: false,
      error: `Por favor espera ${remainingSeconds} segundos antes de solicitar otro código`,
      cooldownRemaining: remainingSeconds,
    };
  }

  // Generar nuevo código de 6 dígitos
  const otp = generateNumericOTP();
  const hashedToken = hashOTP(cleanEmail, otp);
  const identifier = `2fa:${cleanEmail}`;
  const expires = new Date(now + OTP_EXPIRATION_MS);

  // Limpiar tokens anteriores para este usuario
  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  // Resetear intentos fallidos
  failedAttemptsMap.delete(cleanEmail);

  // Guardar en tabla verification_tokens
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires,
    },
  });

  // Registrar timestamp para el cooldown
  lastRequestMap.set(cleanEmail, now);

  return { success: true, otp };
}

export type VerifyOTPResult =
  | { success: true }
  | { success: false; error: string; code?: "EXPIRED" | "INVALID" | "MAX_ATTEMPTS" };

/**
 * Valida el código OTP provisto por el usuario. Si es correcto, lo elimina (uso único).
 */
export async function verifyAndConsumeOTP(
  email: string,
  inputOtp: string
): Promise<VerifyOTPResult> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = inputOtp.trim();
  const identifier = `2fa:${cleanEmail}`;

  // Verificar intentos fallidos acumulados
  const attempts = failedAttemptsMap.get(cleanEmail);
  if (attempts && attempts.count >= MAX_FAILED_ATTEMPTS) {
    // Si sobrepasó el límite, destruimos el token por seguridad
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });
    return {
      success: false,
      error: "Demasiados intentos fallidos. Por seguridad, solicita un nuevo código.",
      code: "MAX_ATTEMPTS",
    };
  }

  const tokenRecord = await prisma.verificationToken.findFirst({
    where: { identifier },
  });

  if (!tokenRecord) {
    return {
      success: false,
      error: "No hay un código de verificación activo para este correo o ha expirado.",
      code: "EXPIRED",
    };
  }

  if (new Date() > tokenRecord.expires) {
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });
    return {
      success: false,
      error: "El código de verificación ha expirado. Solicita uno nuevo.",
      code: "EXPIRED",
    };
  }

  const expectedHash = hashOTP(cleanEmail, cleanOtp);

  // Comparación segura en tiempo constante
  const isMatch =
    tokenRecord.token.length === expectedHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(tokenRecord.token, "hex"),
      Buffer.from(expectedHash, "hex")
    );

  if (!isMatch) {
    const currentCount = (attempts?.count || 0) + 1;
    failedAttemptsMap.set(cleanEmail, {
      count: currentCount,
      firstAttempt: attempts?.firstAttempt || Date.now(),
    });

    const remaining = MAX_FAILED_ATTEMPTS - currentCount;
    if (remaining <= 0) {
      await prisma.verificationToken.deleteMany({
        where: { identifier },
      });
      return {
        success: false,
        error: "Demasiados intentos incorrectos. El código ha sido invalidado.",
        code: "MAX_ATTEMPTS",
      };
    }

    return {
      success: false,
      error: `Código incorrecto. Te quedan ${remaining} intento(s).`,
      code: "INVALID",
    };
  }

  // Éxito: eliminar el token inmediatamente (garantiza un solo uso)
  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  failedAttemptsMap.delete(cleanEmail);

  return { success: true };
}
