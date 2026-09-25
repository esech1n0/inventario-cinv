import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.isApproved = (user as { isApproved: boolean }).isApproved;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        (session.user as { role: string }).role = (token.role as string) || "USER";
        (session.user as { isApproved: boolean }).isApproved =
          token.isApproved !== undefined ? (token.isApproved as boolean) : true;
      }
      return session;
    },
  },
  providers: [],
};
