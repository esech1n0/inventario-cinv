import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home, Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Ilustración de Error 404 */}
        <div className="relative mx-auto flex h-60 w-60 items-center justify-center sm:h-72 sm:w-72">
          <Image
            src="/images/error.png"
            alt="Página no encontrada - 404"
            width={300}
            height={300}
            priority
            className="h-full w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Textos Informativos */}
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold tracking-wide text-destructive uppercase">
            Error 404
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Página no encontrada
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            El recurso o la página que buscas no existe, ha sido movida o no tienes permisos para acceder a ella.
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover active:scale-95 transition-all"
          >
            <Home className="h-4 w-4" />
            Ir al Inicio
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Package className="h-4 w-4" />
            Ver Inventario
          </Link>
        </div>

        <div className="pt-4 text-xs text-muted-foreground/80">
          Sistema de Inventario y Control de Suministros &bull; CINV
        </div>
      </div>
    </div>
  );
}
