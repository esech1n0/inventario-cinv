"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado por Root ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Ocurrió un error inesperado</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        No se pudo completar la solicitud en el servidor. Por favor intenta recargar o verifica la conexión.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">
          Ref ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-95"
        >
          <Home className="h-4 w-4" />
          Ir al Inicio
        </Link>
      </div>
    </div>
  );
}
