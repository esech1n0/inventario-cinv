"use client";

import { useState } from "react";
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  Search,
  Calendar,
  User,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import {
  TransactionDetailModal,
  TransactionDetail,
} from "@/components/TransactionDetailModal";
import { InventoryLog, type InventoryLogEntry } from "@/components/InventoryLog";

interface HistoryClientProps {
  initialTransactions: TransactionDetail[];
  initialDraws: InventoryLogEntry[];
}

export function HistoryClient({ initialTransactions, initialDraws }: HistoryClientProps) {
  const [tab, setTab] = useState<"movements" | "inventory">("movements");
  const [filterType, setFilterType] = useState<"ALL" | "IN" | "OUT" | "CREATION">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);

  const filtered = initialTransactions.filter((tx) => {
    const isCreation = tx.motive.toLowerCase().includes("creaci");
    
    let matchesType = true;
    if (filterType === "OUT") {
      matchesType = tx.transactionType === "OUT";
    } else if (filterType === "IN") {
      matchesType = tx.transactionType === "IN" && !isCreation;
    } else if (filterType === "CREATION") {
      matchesType = isCreation;
    }

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      tx.item.name.toLowerCase().includes(query) ||
      tx.item.module.name.toLowerCase().includes(query) ||
      tx.user.name.toLowerCase().includes(query) ||
      tx.motive.toLowerCase().includes(query) ||
      (tx.eventName && tx.eventName.toLowerCase().includes(query));

    return matchesType && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bitácora
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "movements"
              ? "Trazabilidad completa de consumo, creaciones, ingresos y salidas de material"
              : "Registro de quién ha sido asignado al inventario semanal mediante la ruleta"}
          </p>
        </div>
      </div>

      {/* Apartados de la bitácora */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1 sm:inline-grid sm:w-auto">
        {([
          { id: "movements", label: "Movimientos", icon: History },
          { id: "inventory", label: "Inventariado", icon: ClipboardCheck },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              id={`bitacora-tab-${t.id}`}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "inventory" ? (
        <InventoryLog entries={initialDraws} />
      ) : (
      <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por artículo, usuario, motivo o evento..."
            className="w-full rounded-2xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-border bg-card p-1">
          <button
            onClick={() => setFilterType("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === "ALL"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({initialTransactions.length})
          </button>
          <button
            onClick={() => setFilterType("OUT")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === "OUT"
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Salidas
          </button>
          <button
            onClick={() => setFilterType("IN")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === "IN"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setFilterType("CREATION")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === "CREATION"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Creaciones
          </button>
        </div>
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <History className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              Sin registros de movimientos
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              No se encontraron transacciones con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => {
              const isCreation = tx.motive.toLowerCase().includes("creaci");
              const isOut = tx.transactionType === "OUT";
              const dateObj = new Date(tx.createdAt);
              const formattedDate = dateObj.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={tx.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTransaction(tx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTransaction(tx);
                    }
                  }}
                  className="group cursor-pointer flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:scale-[1.003] active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3.5">
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
                        <PlusCircle className="h-5 w-5" />
                      ) : isOut ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {tx.item.name}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                          {tx.item.module.name}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isCreation
                              ? "bg-primary/15 text-primary"
                              : isOut
                              ? "bg-destructive/15 text-destructive"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isCreation ? "Creación" : isOut ? "Salida" : "Ingreso"}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {tx.user.name}
                        </span>
                        <span>•</span>
                        <span>
                          Motivo:{" "}
                          <strong className="text-foreground">{tx.motive}</strong>
                        </span>
                        {tx.eventName && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary text-[11px]">
                              <Calendar className="h-3 w-3" />
                              {tx.eventName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-2 sm:flex-row sm:items-center sm:gap-4 sm:border-0 sm:pt-0">
                    <div className="flex flex-col sm:items-end">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-lg font-extrabold ${
                            isCreation
                              ? "text-primary"
                              : isOut
                              ? "text-destructive"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isOut
                            ? `-${tx.quantity}`
                            : tx.quantity > 0
                            ? `+${tx.quantity}`
                            : "Nuevo"}
                        </span>
                        {tx.quantity > 0 && (
                          <span className="text-xs text-muted-foreground">
                            unid.
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-muted-foreground">
                        {formattedDate} {formattedTime}
                      </div>
                    </div>

                    <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* Modal con especificaciones detalladas del movimiento */}
      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
