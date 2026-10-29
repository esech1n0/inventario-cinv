import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Home, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "403 - No tienes permiso | Inventario CINV",
  description: "No tienes permiso para ingresar aquí.",
};

export default function ForbiddenPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-12">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col-reverse items-center justify-start gap-8 lg:gap-[20px] lg:flex-row lg:items-center">
        {/* Columna Izquierda: Información de Error y Navegación (Posición fija e inalterable) */}
        <div className="z-10 flex flex-col items-center text-center lg:items-start lg:text-left space-y-5 max-w-xl shrink-0">
          {/* Texto ERROR 403 gigante (70px, color #0a1321, sin bordes, texto puro) */}
          <div className="select-none font-black tracking-tighter text-[70px] leading-none text-[#0a1321] dark:text-[#1e293b]">
            ERROR 403
          </div>

          {/* Título de la página */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              No tienes permiso para ingresar aquí
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
              Esta sección es exclusiva para administradores. No cuentas con los privilegios necesarios para acceder a este módulo.
            </p>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover active:scale-95 transition-all"
            >
              <Home className="h-4 w-4" />
              Ir al Inicio
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <Package className="h-4 w-4" />
              Ver Inventario
            </Link>
          </div>

          <div className="pt-2 text-xs text-muted-foreground/80">
            Sistema de Inventario y Control de Suministros &bull; CINV
          </div>
        </div>

        {/* Columna Central Derecha: La imagen 600x600 orientada a la derecha del texto con gap de 20px sin alterar la posición del texto */}
        <div className="flex flex-1 items-center justify-center lg:justify-start w-full pointer-events-none select-none">
          <div className="relative aspect-square w-[320px] sm:w-[420px] md:w-[500px] lg:w-[580px] xl:w-[600px] shrink-0">
            <Image
              src="/images/alto.png"
              alt="Señal de alto - Acceso denegado (Error 403)"
              width={600}
              height={600}
              priority
              className="h-full w-full object-contain drop-shadow-2xl pointer-events-none select-none"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
