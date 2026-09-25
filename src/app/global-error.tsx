"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global root error caught:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6 text-center font-sans">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Error del Sistema</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Ocurrió un error crítico durante la carga de la aplicación.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-500">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Recargar Aplicación
        </button>
      </body>
    </html>
  );
}
