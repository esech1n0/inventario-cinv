"use client";

import { useState } from "react";
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Calendar,
  User,
  Filter,
  FileSpreadsheet,
} from "lucide-react";

interface TransactionItem {
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

interface HistoryClientProps {
  initialTransactions: TransactionItem[];
}

export function HistoryClient({ initialTransactions }: HistoryClientProps) {
  const [filterType, setFilterType] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = initialTransactions.filter((tx) => {
    const matchesType =
      filterType === "ALL" || tx.transactionType === filterType;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      tx.item.name.toLowerCase().includes(query) ||
      tx.item.module.name.toLowerCase().includes(query) ||
      tx.user.name.toLowerCase().includes(query) ||
      tx.motive.toLowerCase().includes(query) ||
      (tx.eventName && tx.eventName.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  // Exportar a CSV para auditoría
  function exportCSV() {
    const headers = [
      "Fecha",
      "Tipo",
      "Articulo",
      "Modulo",
      "Cantidad",
      "Usuario",
      "Email",
      "Motivo",
      "Evento",
    ];

    const rows = filtered.map((tx) => [
      new Date(tx.createdAt).toLocaleString("es-MX"),
      tx.transactionType === "OUT" ? "SALIDA" : "ENTRADA",
      `"${tx.item.name.replace(/"/g, '""')}"`,
      `"${tx.item.module.name.replace(/"/g, '""')}"`,
      tx.quantity,
      `"${tx.user.name.replace(/"/g, '""')}"`,
      tx.user.email,
      `"${tx.motive.replace(/"/g, '""')}"`,
      tx.eventName ? `"${tx.eventName.replace(/"/g, '""')}"` : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `auditoria_inventario_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Historial de Movimientos y Auditoría
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trazabilidad completa de consumo, entradas y salidas de material
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4 text-success" />
          Exportar CSV
        </button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
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
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entradas
          </button>
        </div>
      </div>

      {/* Lista / Tabla de Transacciones */}
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
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Izquierda: Icono + Detalle del Artículo */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isOut
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isOut ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">
                          {tx.item.name}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                          {tx.item.module.name}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {tx.user.name}
                        </span>
                        <span>•</span>
                        <span>Motivo: <strong className="text-foreground">{tx.motive}</strong></span>
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

                  {/* Derecha: Cantidad y Fecha */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-lg font-extrabold ${
                          isOut ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {isOut ? `-${tx.quantity}` : `+${tx.quantity}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        unid.
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {formattedDate} {formattedTime}
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
