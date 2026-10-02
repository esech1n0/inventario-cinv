"use client";

import { useState } from "react";
import { X, Layers, Box, Package, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

export interface CategoryItem {
  id: string;
  name: string;
  packagingType: "UNITARY" | "PACKAGED";
  packs: number;
  unitsPerPack: number;
  totalUnits: number;
  createdAt?: string | Date;
}

interface CategoryItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  items: CategoryItem[];
}

export function CategoryItemsModal({
  isOpen,
  onClose,
  categoryName,
  items,
}: CategoryItemsModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const totalUnits = items.reduce((acc, curr) => acc + curr.totalUnits, 0);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="animate-fade-in flex max-h-[88vh] sm:max-h-[82vh] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  {categoryName}
                </h2>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                  {items.length} {items.length === 1 ? "artículo" : "artículos"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Artículos almacenados en esta categoría ({totalUnits} unidades en total)
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

        {/* Buscador dentro del modal si hay más de 3 artículos */}
        {items.length > 3 && (
          <div className="border-b border-border/70 p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar en ${categoryName}...`}
                className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-4 text-xs sm:text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Lista de artículos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Box className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                {items.length === 0
                  ? "No hay artículos en esta categoría"
                  : "No se encontraron coincidencias"}
              </p>
              <p className="text-xs text-muted-foreground">
                {items.length === 0
                  ? "Los artículos que agregues con esta categoría aparecerán aquí."
                  : "Prueba con otra palabra clave."}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm sm:text-base">
                      {item.name}
                    </h3>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.packagingType === "PACKAGED" ? "Empaquetado" : "Unitario"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>
                      Stock:{" "}
                      <strong className="text-foreground">{item.totalUnits}</strong> unidades
                    </span>
                    {item.packagingType === "PACKAGED" && (
                      <span>
                        ({item.packs} paq. &bull; {item.unitsPerPack} u/p)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center self-end sm:self-auto">
                  <Link
                    href={`/dashboard`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:text-primary transition-all"
                  >
                    <span>Ver en inventario</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Total en {categoryName}: <strong>{totalUnits} unidades</strong>
          </span>
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
