import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
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
