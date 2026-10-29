import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Public routes
  if (pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const authRoutes = ["/login"];
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const publicRoutes = ["/login", "/403"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // API, static assets, and Server Actions
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|ico|json|webmanifest|js|css|txt|woff2?)$/i.test(pathname);
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    isStaticAsset ||
    req.headers.has("next-action")
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin-only routes
  const adminRoutes = ["/dashboard/users", "/dashboard/ruleta", "/dashboard/history"];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
