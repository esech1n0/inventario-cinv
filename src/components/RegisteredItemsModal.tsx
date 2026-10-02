"use client";

import { useState } from "react";
import { X, Box, Search, Package, ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Item } from "@/components/InventoryClient";

interface RegisteredItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  onWithdraw?: (itemId: string) => void;
  onAddStock?: (itemId: string) => void;
}

export function RegisteredItemsModal({
  isOpen,
  onClose,
  items,
  onWithdraw,
  onAddStock,
}: RegisteredItemsModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.module.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="animate-fade-in flex max-h-[88vh] sm:max-h-[82vh] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  Artículos Registrados
                </h2>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                  {items.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Lista de todos los artículos almacenados en el catálogo de inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Buscador dentro del modal */}
        <div className="border-b border-border/70 p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar artículo por nombre o categoría..."
              className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-4 text-xs sm:text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Lista de artículos con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Box className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                No se encontraron artículos
              </p>
              <p className="text-xs text-muted-foreground">
                {search ? "Intenta con otro término de búsqueda" : "No hay artículos registrados aún"}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm sm:text-base">
                      {item.name}
                    </h3>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {item.module.name}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.packagingType === "PACKAGED" ? "Empaquetado" : "Unitario"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>
                      Stock disponible:{" "}
                      <strong className="text-foreground">{item.totalUnits}</strong> unidades
                    </span>
                    {item.packagingType === "PACKAGED" && (
                      <span>
                        ({item.packs} paq. &bull; {item.unitsPerPack} u/p)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {onWithdraw && (
                    <button
                      onClick={() => {
                        onClose();
                        onWithdraw(item.id);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                      title="Retirar material"
                    >
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      <span>Retirar</span>
                    </button>
                  )}
                  {onAddStock && (
                    <button
                      onClick={() => {
                        onClose();
                        onAddStock(item.id);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                      title="Ingresar stock"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Ingresar</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
