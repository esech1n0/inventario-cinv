import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";
import { verifyAndConsumeOTP } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        otp: { label: "Código de Verificación (OTP)", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const rawOtp = (credentials?.otp as string | undefined)?.trim();
        if (!rawOtp) {
          throw new Error("OTP_REQUIRED");
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase().trim() },
        });

        if (!user) return null;

        const isValid = await bcryptjs.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!isValid) return null;

        if (!user.isApproved) {
          throw new Error("ACCOUNT_NOT_APPROVED");
        }

        // Validación estricta del 2FA (OTP)
        const otpResult = await verifyAndConsumeOTP(user.email, rawOtp);
        if (!otpResult.success) {
          throw new Error(otpResult.error || "OTP_INVALID");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isApproved: user.isApproved,
        };
      },
    }),
  ],
});
