"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global trigger support
let globalShowToast: ((toast: Omit<ToastMessage, "id">) => void) | null = null;

export const toast = {
  success: (message: string, title?: string) => {
    if (globalShowToast) {
      globalShowToast({ type: "success", message, title });
    }
  },
  error: (customMessage?: string, title?: string) => {
    // Requisito: En la vista el texto de error debe ser "Ha ocurrido un error" en rojo
    const displayMsg = customMessage && customMessage !== "Ha ocurrido un error"
      ? customMessage 
      : "Ha ocurrido un error";
    if (globalShowToast) {
      globalShowToast({ type: "error", message: displayMsg, title });
    }
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalShowToast) {
      globalShowToast({ type: "warning", message, title, duration: duration ?? 8000 });
    }
  },
  info: (message: string, title?: string) => {
    if (globalShowToast) {
      globalShowToast({ type: "info", message, title });
    }
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastMessage, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        {toasts.map((t) => {
          const isError = t.type === "error";
          const isSuccess = t.type === "success";
          const isWarning = t.type === "warning";

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                isError
                  ? "border-destructive/30 bg-destructive/15 text-destructive dark:bg-destructive/20"
                  : isSuccess
                  ? "border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500/30"
                  : isWarning
                  ? "border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/40"
                  : "border-border bg-card/95 text-foreground"
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {isError ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : isSuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : isWarning ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <Info className="h-5 w-5 text-primary" />
                )}
              </div>

              <div className="flex-1 space-y-0.5 text-left">
                {t.title && (
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90">
                    {t.title}
                  </p>
                )}
                <p
                  className={`text-sm font-semibold leading-snug ${
                    isError ? "text-destructive" : ""
                  }`}
                >
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (t: Omit<ToastMessage, "id">) => {
        if (t.type === "error") toast.error(t.message, t.title);
        else if (t.type === "success") toast.success(t.message, t.title);
        else toast.info(t.message, t.title);
      },
      removeToast: () => {},
      toasts: [],
    };
  }
  return context;
}
