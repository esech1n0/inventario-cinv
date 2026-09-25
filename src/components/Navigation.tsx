"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Layers,
  History,
  Users,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { LogoutButton } from "@/components/LogoutButton";

interface NavigationProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const navLinks = [
    {
      name: "Inventario",
      href: "/dashboard",
      icon: Package,
      active: pathname === "/dashboard",
    },
    {
      name: "Módulos",
      href: "/dashboard/modules",
      icon: Layers,
      active: pathname.startsWith("/dashboard/modules"),
    },
    {
      name: "Historial",
      href: "/dashboard/history",
      icon: History,
      active: pathname.startsWith("/dashboard/history"),
    },
    ...(isAdmin
      ? [
          {
            name: "Usuarios",
            href: "/dashboard/users",
            icon: Users,
            active: pathname.startsWith("/dashboard/users"),
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 transition-transform active:scale-95"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-foreground">
                  Inventario CINV
                </span>
                <span className="hidden sm:inline-block ml-2 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-secondary-foreground uppercase">
                  PWA
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                      link.active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            <PushNotificationToggle />

            {/* User role pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs">
              {isAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-foreground leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight uppercase font-medium">
                  {isAdmin ? "Administrador" : "Integrante"}
                </span>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur-md md:hidden">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all ${
                link.active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all ${
                  link.active ? "bg-primary/10" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] leading-none">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
