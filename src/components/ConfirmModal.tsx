"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  AlertTriangle,
  Trash2,
  AlertCircle,
  Info,
  HelpCircle,
  X,
  Loader2,
} from "lucide-react";

export type DialogVariant = "default" | "destructive" | "warning" | "info";
export type DialogType = "confirm" | "alert" | "prompt";

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  type?: DialogType;
  promptPlaceholder?: string;
  promptDefaultValue?: string;
}

interface ActiveDialogState extends ConfirmDialogOptions {
  id: string;
  resolve: (value: any) => void;
  promptValue: string;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions | string) => Promise<boolean>;
  alert: (options: Omit<ConfirmDialogOptions, "cancelText"> | string) => Promise<void>;
  prompt: (options: ConfirmDialogOptions | string) => Promise<string | null>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

// Standalone global helpers so they can be called inside event handlers anywhere
let globalConfirm: ((options: ConfirmDialogOptions | string) => Promise<boolean>) | null = null;
let globalAlert: ((options: Omit<ConfirmDialogOptions, "cancelText"> | string) => Promise<void>) | null = null;
let globalPrompt: ((options: ConfirmDialogOptions | string) => Promise<string | null>) | null = null;

export const confirmDialog = (options: ConfirmDialogOptions | string): Promise<boolean> => {
  if (globalConfirm) {
    return globalConfirm(options);
  }
  // Fallback if provider not mounted
  if (typeof window !== "undefined") {
    const msg = typeof options === "string" ? options : `${options.title}\n\n${options.description}`;
    return Promise.resolve(window.confirm(msg));
  }
  return Promise.resolve(false);
};

export const alertDialog = (options: Omit<ConfirmDialogOptions, "cancelText"> | string): Promise<void> => {
  if (globalAlert) {
    return globalAlert(options);
  }
  if (typeof window !== "undefined") {
    const msg = typeof options === "string" ? options : `${options.title}\n\n${options.description}`;
    window.alert(msg);
  }
  return Promise.resolve();
};

export const promptDialog = (options: ConfirmDialogOptions | string): Promise<string | null> => {
  if (globalPrompt) {
    return globalPrompt(options);
  }
  if (typeof window !== "undefined") {
    const msg = typeof options === "string" ? options : `${options.title}\n\n${options.description}`;
    const def = typeof options === "object" ? options.promptDefaultValue : "";
    return Promise.resolve(window.prompt(msg, def));
  }
  return Promise.resolve(null);
};

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    return {
      confirm: confirmDialog,
      alert: alertDialog,
      prompt: promptDialog,
    };
  }
  return context;
}

/**
 * Componente visual de Diálogo Modal con Accesibilidad (a11y) y Estilos Modernos
 */
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (promptValue?: string) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  type?: DialogType;
  promptPlaceholder?: string;
  promptDefaultValue?: string;
  loading?: boolean;
}

import { useModalFocusTrap } from "@/components/useModalFocusTrap";

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "default",
  type = "confirm",
  promptPlaceholder,
  promptDefaultValue = "",
  loading = false,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState(promptDefaultValue);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar valor inicial del prompt
  useEffect(() => {
    if (isOpen) {
      setInputValue(promptDefaultValue);
    }
  }, [isOpen, promptDefaultValue]);

  const isDestructive = variant === "destructive";
  const isWarning = variant === "warning";
  const isInfo = variant === "info";
  const isAlert = type === "alert";

  const { modalRef } = useModalFocusTrap({
    isOpen,
    onClose,
    isDestructive,
    initialFocusRef: type === "prompt" ? inputRef : isDestructive ? cancelButtonRef : confirmButtonRef,
    closeOnEscape: !loading,
  });

  if (!isOpen) return null;

  const defaultConfirmText = isAlert
    ? "Entendido"
    : isDestructive
    ? "Eliminar"
    : "Confirmar";
  const defaultCancelText = "Cancelar";

  // Ícono representativo y paleta cromática según variante
  const getIconContainer = () => {
    if (isDestructive) {
      return {
        icon: <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />,
        badgeClass: "bg-destructive/10 border-destructive/20 text-destructive",
      };
    }
    if (isWarning) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />,
        badgeClass: "bg-amber-500/10 border-amber-500/20 text-amber-500",
      };
    }
    if (isInfo) {
      return {
        icon: <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />,
        badgeClass: "bg-blue-500/10 border-blue-500/20 text-blue-500",
      };
    }
    return {
      icon: <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />,
      badgeClass: "bg-primary/10 border-primary/20 text-primary",
    };
  };

  const { icon, badgeClass } = getIconContainer();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    onConfirm(type === "prompt" ? inputValue : undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role={isDestructive ? "alertdialog" : "dialog"}
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      {/* Fondo atenuado con desenfoque (Backdrop) */}
      <div
        onClick={() => !loading && onClose()}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* Contenedor del Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-up focus:outline-none"
      >
        {/* Botón cerrar esquina superior */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Cerrar diálogo"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        <form onSubmit={handleFormSubmit}>
          <div className="flex items-start gap-4">
            {/* Ícono de estado */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${badgeClass}`}
            >
              {icon}
            </div>

            {/* Contenido textual */}
            <div className="flex-1 pr-4">
              <h2
                id="confirm-modal-title"
                className="text-base sm:text-lg font-bold text-foreground"
              >
                {title}
              </h2>
              <p
                id="confirm-modal-description"
                className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
              >
                {description}
              </p>
            </div>
          </div>

          {/* Campo de entrada para tipo Prompt */}
          {type === "prompt" && (
            <div className="mt-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={promptPlaceholder || "Escribe aquí..."}
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          )}

          {/* Acciones / Botones */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {!isAlert && (
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {cancelText || defaultCancelText}
              </button>
            )}

            <button
              ref={confirmButtonRef}
              type="submit"
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
                isDestructive
                  ? "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20 hover:bg-destructive/90 focus-visible:ring-destructive active:scale-95"
                  : isWarning
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20 hover:bg-amber-700 focus-visible:ring-amber-500 active:scale-95"
                  : "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-hover focus-visible:ring-primary active:scale-95"
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText || defaultConfirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Proveedor Global de Diálogos Modales
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialogState | null>(null);

  const confirm = useCallback((options: ConfirmDialogOptions | string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const opts: ConfirmDialogOptions =
        typeof options === "string"
          ? {
              title: "Confirmar acción",
              description: options,
              variant: "default",
              type: "confirm",
            }
          : {
              ...options,
              type: options.type || "confirm",
            };

      setActiveDialog({
        id: `dialog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...opts,
        promptValue: opts.promptDefaultValue || "",
        resolve,
      });
    });
  }, []);

  const alert = useCallback(
    (options: Omit<ConfirmDialogOptions, "cancelText"> | string): Promise<void> => {
      return new Promise<void>((resolve) => {
        const opts: ConfirmDialogOptions =
          typeof options === "string"
            ? {
                title: "Aviso",
                description: options,
                variant: "info",
                type: "alert",
              }
            : {
                ...options,
                type: "alert",
              };

        setActiveDialog({
          id: `dialog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ...opts,
          promptValue: "",
          resolve: () => resolve(),
        });
      });
    },
    []
  );

  const prompt = useCallback((options: ConfirmDialogOptions | string): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      const opts: ConfirmDialogOptions =
        typeof options === "string"
          ? {
              title: "Ingresar información",
              description: options,
              variant: "default",
              type: "prompt",
            }
          : {
              ...options,
              type: "prompt",
            };

      setActiveDialog({
        id: `dialog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...opts,
        promptValue: opts.promptDefaultValue || "",
        resolve,
      });
    });
  }, []);

  // Registrar helpers globales
  useEffect(() => {
    globalConfirm = confirm;
    globalAlert = alert;
    globalPrompt = prompt;

    return () => {
      globalConfirm = null;
      globalAlert = null;
      globalPrompt = null;
    };
  }, [confirm, alert, prompt]);

  const handleClose = () => {
    if (!activeDialog) return;
    if (activeDialog.type === "prompt") {
      activeDialog.resolve(null);
    } else if (activeDialog.type === "alert") {
      activeDialog.resolve(undefined);
    } else {
      activeDialog.resolve(false);
    }
    setActiveDialog(null);
  };

  const handleConfirm = (val?: string) => {
    if (!activeDialog) return;
    if (activeDialog.type === "prompt") {
      activeDialog.resolve(val ?? activeDialog.promptValue);
    } else if (activeDialog.type === "alert") {
      activeDialog.resolve(undefined);
    } else {
      activeDialog.resolve(true);
    }
    setActiveDialog(null);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      {activeDialog && (
        <ConfirmModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={activeDialog.title}
          description={activeDialog.description}
          confirmText={activeDialog.confirmText}
          cancelText={activeDialog.cancelText}
          variant={activeDialog.variant}
          type={activeDialog.type}
          promptPlaceholder={activeDialog.promptPlaceholder}
          promptDefaultValue={activeDialog.promptDefaultValue}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
}
