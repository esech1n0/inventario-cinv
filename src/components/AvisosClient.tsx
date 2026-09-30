"use client";

import { useState } from "react";
import {
  Bell,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Calendar,
  Clock,
  User,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";

interface TransactionNotice {
  id: string;
  transactionType: "IN" | "OUT";
  quantity: number;
  motive: string;
  eventName: string | null;
  createdAt: Date | string;
  item: {
    name: string;
    packagingType: "UNITARY" | "PACKAGED";
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

interface AvisosClientProps {
  initialTransactions: TransactionNotice[];
}

export function AvisosClient({ initialTransactions }: AvisosClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "OUT" | "IN">("ALL");

  const filtered = initialTransactions.filter((tx) => {
    const matchesType =
      filterType === "ALL" || tx.transactionType === filterType;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      tx.item.name.toLowerCase().includes(query) ||
      tx.item.module.name.toLowerCase().includes(query) ||
      tx.user.name.toLowerCase().includes(query) ||
      tx.user.email.toLowerCase().includes(query) ||
      tx.motive.toLowerCase().includes(query) ||
      (tx.eventName && tx.eventName.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  const totalRetiros = initialTransactions.filter((t) => t.transactionType === "OUT").length;
  const totalIngresos = initialTransactions.filter((t) => t.transactionType === "IN").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header de Avisos */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Avisos y Notificaciones
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Desglose detallado de movimientos de inventario: quién realizó la acción, qué producto, fecha y hora exacta.
          </p>
        </div>

        {/* Resumen de contadores */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2 shadow-sm text-xs">
            <span className="font-semibold text-foreground">Total:</span>
            <span className="font-bold text-primary">{initialTransactions.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span className="font-semibold">{totalRetiros} retiros</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span className="font-semibold">{totalIngresos} ingresos</span>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por usuario, producto, categoría, motivo o evento..."
            className="w-full rounded-2xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-border bg-card p-1">
          <button
            onClick={() => setFilterType("ALL")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filterType === "ALL"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({initialTransactions.length})
          </button>
          <button
            onClick={() => setFilterType("OUT")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === "OUT"
                ? "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Retiros
          </button>
          <button
            onClick={() => setFilterType("IN")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === "IN"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ingresos
          </button>
        </div>
      </div>

      {/* Listado desglozado de Avisos */}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              No hay avisos registrados
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {searchQuery
                ? "No se encontraron movimientos con los términos de búsqueda ingresados."
                : "Aún no se han registrado movimientos ni transacciones en el inventario."}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((tx) => {
              const isOut = tx.transactionType === "OUT";
              const dateObj = new Date(tx.createdAt);

              // Formato de día y mes en español: e.g. "29 de Septiembre"
              const dayAndMonth = dateObj.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
              });

              // Formato de año
              const year = dateObj.getFullYear();

              // Formato de hora exacta: e.g. "08:15 PM" o "20:15"
              const hourFormatted = dateObj.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              const userInitials = tx.user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={tx.id}
                  className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md md:flex-row md:items-center"
                >
                  <div className="flex items-start gap-4">
                    {/* Icono de tipo de movimiento */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isOut
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isOut ? (
                        <ArrowDownRight className="h-6 w-6" />
                      ) : (
                        <ArrowUpRight className="h-6 w-6" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Cabecera del aviso: Producto y Categoría */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 font-bold text-foreground text-base">
                          <Package className="h-4 w-4 text-primary shrink-0" />
                          {tx.item.name}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                          <Layers className="h-3 w-3" />
                          {tx.item.module.name}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                            isOut
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isOut ? `Retiro: ${tx.quantity} unid.` : `Ingreso: +${tx.quantity} unid.`}
                        </span>
                      </div>

                      {/* Quién realizó el movimiento */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {userInitials || <User className="h-3 w-3" />}
                          </div>
                          <span>Realizado por:</span>
                          <span className="font-semibold text-foreground underline decoration-border underline-offset-2">
                            {tx.user.name}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] uppercase font-medium text-muted-foreground">
                            {tx.user.role === "ADMIN" ? "Admin" : "Integrante"}
                          </span>
                        </div>

                        <span>•</span>

                        <span>
                          Motivo: <strong className="text-foreground">{tx.motive}</strong>
                        </span>

                        {tx.eventName && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                              <Sparkles className="h-3 w-3" />
                              Evento: {tx.eventName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloque explícito de Día, Mes y Hora */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t border-border/40 pt-3 md:border-0 md:pt-0 shrink-0">
                    {/* Día y Mes */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="capitalize">{dayAndMonth}</span>
                      <span className="text-muted-foreground font-normal">de {year}</span>
                    </div>

                    {/* A qué hora */}
                    <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground/70" />
                      <span>{hourFormatted}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
