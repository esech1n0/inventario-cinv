"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { RefreshCw, Sparkles, X, Loader2 } from "lucide-react";

export function PwaUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const initialVersionRef = useRef<string | null>(null);
  const dismissedThisSessionRef = useRef(false);

  // Consulta el endpoint dinámico /api/version para detectar nuevos despliegues
  const checkForNewVersion = useCallback(async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!data?.version) return;

      if (!initialVersionRef.current) {
        // Primera carga: almacenar versión base
        initialVersionRef.current = data.version;
      } else if (initialVersionRef.current !== data.version) {
        // La versión del servidor cambió (nuevo despliegue)
        dismissedThisSessionRef.current = false;
        setUpdateAvailable(true);
      }
    } catch (e) {
      console.debug("Verificación de versión omitida:", e);
    }
  }, []);

  // Verifica actualizaciones en el Service Worker
  const checkServiceWorkerUpdate = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      // 1. Si ya hay un worker esperando
      if (reg.waiting) {
        waitingWorkerRef.current = reg.waiting;
        dismissedThisSessionRef.current = false;
        setUpdateAvailable(true);
        return;
      }

      // 2. Forzar al navegador a verificar si el archivo sw.js cambió en el servidor
      await reg.update();

      if (reg.waiting) {
        waitingWorkerRef.current = reg.waiting;
        dismissedThisSessionRef.current = false;
        setUpdateAvailable(true);
      }
    } catch (e) {
      console.debug("Verificación de Service Worker omitida:", e);
    }
  }, []);

  // Función principal de verificación cuando el usuario entra o vuelve a la aplicación
  const handleAppResumeOrFocus = useCallback(() => {
    // Al volver a la app, resetear el dismissed para volver a avisar si aún no se actualizó
    dismissedThisSessionRef.current = false;
    checkServiceWorkerUpdate();
    checkForNewVersion();
  }, [checkServiceWorkerUpdate, checkForNewVersion]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Registro del Service Worker y oyentes de ciclo de vida
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Detectar si ya había uno en espera
          if (reg.waiting) {
            waitingWorkerRef.current = reg.waiting;
            setUpdateAvailable(true);
          }

          // Detectar cuando se descarga uno nuevo
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Nuevo contenido disponible
                waitingWorkerRef.current = newWorker;
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => {
          console.debug("No se pudo registrar Service Worker:", err);
        });

      // Recargar automáticamente cuando el nuevo Service Worker toma el control tras SKIP_WAITING
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 2. Consulta inicial de versión
    checkForNewVersion();

    // 3. EVENTO CRÍTICO: Cuando el usuario entra de vuelta a la aplicación móvil
    // (al cambiar de pestaña, desbloquear teléfono o volver desde otra app)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleAppResumeOrFocus();
      }
    };

    const onFocus = () => {
      handleAppResumeOrFocus();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkForNewVersion, handleAppResumeOrFocus]);

  // Acción para aplicar la actualización
  const handleApplyUpdate = async () => {
    setIsUpdating(true);

    try {
      // Si hay un Service Worker esperando, activarlo
      if (waitingWorkerRef.current) {
        waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
      }

      // Limpiar caches antiguos si están disponibles
      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(
            keys.map((k) => (k !== "cinv-inventario-v2" ? caches.delete(k) : null))
          );
        } catch (e) {
          console.debug("Error limpiando caché:", e);
        }
      }

      // Breve espera para que el Service Worker tome el control y recargar
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch (e) {
      console.error("Error al actualizar la app:", e);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    dismissedThisSessionRef.current = true;
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md px-4 sm:bottom-6 animate-slide-up"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-2xl backdrop-blur-md transition-all sm:p-5">
        {/* Glow sutil de acento */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />

        <div className="flex items-start gap-3.5">
          {/* Icono de actualización */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <RefreshCw
              className={`h-5 w-5 ${isUpdating ? "animate-spin" : ""}`}
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
          </div>

          {/* Contenido textual */}
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-foreground">
                Actualización disponible
              </h3>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Hay una actualización en la página y es necesario actualizar para que
              te pongas al día con los cambios implementados.
            </p>

            {/* Acciones */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Actualizar ahora</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                disabled={isUpdating}
                className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Más tarde
              </button>
            </div>
          </div>

          {/* Botón X para cerrar rápido */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isUpdating}
            title="Cerrar aviso"
            aria-label="Cerrar aviso de actualización"
            className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
