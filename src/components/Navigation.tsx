"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  X,
  Package,
  Layers,
  History,
  Users,
  Settings,
  Bell,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface NavigationProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAdmin = user.role === "ADMIN";

  // Cerrar el drawer al cambiar de ruta
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Manejo de la tecla Escape para cerrar el drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  const drawerLinks = [
    {
      name: "Inventario",
      href: "/dashboard",
      icon: Package,
      active: pathname === "/dashboard",
    },
    {
      name: "Categorias",
      href: "/dashboard/categories",
      icon: Layers,
      active:
        pathname.startsWith("/dashboard/categories") ||
        pathname.startsWith("/dashboard/modules"),
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
    {
      name: "Configuración",
      href: "/dashboard/configuracion",
      icon: Settings,
      active:
        pathname.startsWith("/dashboard/configuracion") ||
        pathname.startsWith("/dashboard/settings"),
    },
  ];

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      {/* Top Header unificado (para Computadora y Móviles) */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Lado Izquierdo: Menú Hamburguesa + Logo + Nombre de la App (uno al lado del otro) */}
          <div className="flex items-center gap-3">
            {/* Botón Menú Hamburguesa */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              title={isDrawerOpen ? "Cerrar menú" : "Abrir menú"}
              aria-label="Abrir menú de navegación"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo y Nombre uno al lado del otro */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 transition-transform active:scale-95"
            >
              <div className="flex items-center justify-center">
                <Image
                  src="/images/cinv.png"
                  alt="Logo CINV"
                  width={120}
                  height={60}
                  priority
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Inventario CINV
              </span>
            </Link>
          </div>

          {/* Lado Derecho: Opción 'Ver notificaciones' con icono de campanita que lleva a Avisos */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/avisos"
              title="Ver notificaciones"
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 ${
                pathname.startsWith("/dashboard/avisos")
                  ? "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/20"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="sr-only">Ver notificaciones</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Menú de navegación lateral izquierdo (Drawer) */}
      {/* Fondo semi-transparente (Backdrop) */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        />
      )}

      {/* Panel lateral desplegable */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 sm:w-80 flex-col justify-between border-r border-border bg-card p-5 shadow-2xl transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabecera del Drawer */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/cinv.png"
                alt="Logo CINV"
                width={100}
                height={50}
                className="h-8 w-auto object-contain"
              />
              <span className="text-sm font-bold tracking-tight text-foreground">
                Inventario CINV
              </span>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              title="Cerrar menú"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Módulos en el Menú Lateral */}
          <nav className="mt-5 space-y-1.5">
            {drawerLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    link.active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Parte inferior del Menú Lateral */}
        <div className="border-t border-border/60 pt-4 space-y-3">
          {/* Selector de Tema: Claro, Oscuro (predeterminado), Sistema */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Tema de la aplicación
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setTheme("light")}
                title="Activar tema claro"
                aria-label="Tema claro"
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  theme === "light"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Sun className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                title="Activar tema oscuro (predeterminado)"
                aria-label="Tema oscuro"
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  theme === "dark"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Moon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span>Oscuro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                title="Sincronizar con el tema del sistema"
                aria-label="Tema del sistema"
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  theme === "system"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Laptop className="h-3.5 w-3.5 shrink-0" />
                <span>Sistema</span>
              </button>
            </div>
          </div>

          {/* Tarjeta con datos de la sesión del usuario */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
              {userInitials || <UserIcon className="h-4 w-4" />}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground truncate">
                {user.name}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {user.email}
              </span>
              <span className="mt-0.5 text-[10px] uppercase font-semibold text-primary">
                {isAdmin ? "Administrador" : "Integrante"}
              </span>
            </div>
          </div>

          {/* Cerrar sesión en texto localizado en la parte inferior */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 active:scale-98 transition-all disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
