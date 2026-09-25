"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Package } from "lucide-react";
import Link from "next/link";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado por Dashboard ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Error al cargar los datos del panel
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Hubo un problema al consultar la información del inventario en la base de datos.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/70">
            Código de seguimiento: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Reintentar carga
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Package className="h-4 w-4" />
            Inventario Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
