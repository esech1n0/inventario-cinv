"use client";

import { useEffect, useState } from "react";
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  Package,
  Layers,
  Calendar,
  User,
  Mail,
  ShieldCheck,
  Clock,
  Hash,
  Copy,
  Check,
} from "lucide-react";

export interface TransactionDetail {
  id: string;
  transactionType: "IN" | "OUT";
  quantity: number;
  motive: string;
  eventName: string | null;
  createdAt: Date | string;
  item: {
    name: string;
    packagingType: "UNITARY" | "PACKAGED";
    packs?: number;
    unitsPerPack?: number;
    totalUnits?: number;
    module: {
      name: string;
    };
  };
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDetail | null;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const isCreation = transaction.motive.toLowerCase().includes("creaci");
  const isOut = transaction.transactionType === "OUT";
  const dateObj = new Date(transaction.createdAt);

  const formattedDate = dateObj.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = dateObj.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const unitsPerPack = transaction.item.unitsPerPack || 1;
  const isPackaged = transaction.item.packagingType === "PACKAGED";
  const packsEquivalent = isPackaged
    ? Math.floor(transaction.quantity / unitsPerPack)
    : null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(transaction.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                isCreation
                  ? "bg-primary/10 text-primary"
                  : isOut
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isCreation ? (
                <PlusCircle className="h-6 w-6" />
              ) : isOut ? (
                <ArrowDownRight className="h-6 w-6" />
              ) : (
                <ArrowUpRight className="h-6 w-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Detalle del Movimiento
                </h2>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    isCreation
                      ? "bg-primary/15 text-primary"
                      : isOut
                      ? "bg-destructive/15 text-destructive"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isCreation
                    ? "Creación"
                    : isOut
                    ? "Salida de Material"
                    : "Ingreso de Stock"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registro inmutable de trazabilidad y auditoría
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Cerrar ventana"
            aria-label="Cerrar modal"
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tarjeta de impacto en cantidad */}
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isCreation
              ? "border-primary/20 bg-primary/5"
              : isOut
              ? "border-destructive/20 bg-destructive/5"
              : "border-emerald-500/20 bg-emerald-500/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Cantidad Registrada en Movimiento:
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black tracking-tight ${
                  isCreation
                    ? "text-primary"
                    : isOut
                    ? "text-destructive"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isOut
                  ? `-${transaction.quantity}`
                  : transaction.quantity > 0
                  ? `+${transaction.quantity}`
                  : "0"}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                unidades
              </span>
            </div>
          </div>

          {isPackaged && packsEquivalent !== null && packsEquivalent > 0 && (
            <p className="mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">
              Equivalente aproximado a{" "}
              <strong className="text-foreground">
                {packsEquivalent} paquete{packsEquivalent > 1 ? "s" : ""}
              </strong>{" "}
              ({unitsPerPack} unidades por paquete).
            </p>
          )}
        </div>

        {/* Bloques de especificaciones */}
        <div className="mt-4 space-y-3.5">
          {/* 1. Datos del Artículo */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Package className="h-4 w-4 text-primary" />
              <span>Artículo Afectado</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Nombre del artículo:
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {transaction.item.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Categoría:
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  {transaction.item.module.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Presentación:
                </span>
                <span className="font-medium text-foreground">
                  {isPackaged ? "Empaquetado (por cajas/bolsas)" : "Unitario (Suelto)"}
                </span>
              </div>
              {transaction.item.totalUnits !== undefined && (
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Stock actual en inventario:
                  </span>
                  <span className="font-bold text-foreground">
                    {transaction.item.totalUnits} unidades
                    {isPackaged && transaction.item.packs !== undefined && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({transaction.item.packs} paq.)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Motivo y Evento */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Motivo y Destino</span>
            </div>
            <div className="pt-1 text-xs space-y-2">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Motivo reportado:
                </span>
                <p className="mt-0.5 rounded-lg border border-border/50 bg-background/80 p-2.5 font-medium text-foreground leading-relaxed">
                  {transaction.motive || "Sin motivo especificado."}
                </p>
              </div>

              {transaction.eventName ? (
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Evento o actividad asignada:
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {transaction.eventName}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  No se asoció a un evento específico.
                </div>
              )}
            </div>
          </div>

          {/* 3. Usuario Responsable */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>Usuario Responsable de la Acción</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Nombre:
                </span>
                <span className="font-semibold text-foreground">
                  {transaction.user.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Correo electrónico:
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
                  <Mail className="h-3 w-3" />
                  {transaction.user.email}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Rol en el sistema:
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-primary text-[11px] uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {transaction.user.role === "ADMIN" ? "Administrador" : "Integrante"}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Timestamp y Hash de Auditoría */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Fecha y Hora de Registro</span>
            </div>
            <div className="pt-1 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="capitalize font-medium text-foreground">
                  {formattedDate}
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  {formattedTime}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-background p-2 border border-border/60 text-[11px]">
                <div className="flex items-center gap-1.5 font-mono text-muted-foreground truncate">
                  <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{transaction.id}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Copiar ID de transacción"
                  className="flex items-center gap-1 shrink-0 rounded px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
