"use client";

import { useState } from "react";
import { X, Layers, Box, Package, ChevronRight, Search } from "lucide-react";
import type { Item } from "@/components/InventoryClient";

interface Module {
  id: string;
  name: string;
}

interface StoredCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: Module[];
  items: Item[];
  onSelectCategory?: (moduleId: string) => void;
}

export function StoredCategoriesModal({
  isOpen,
  onClose,
  modules,
  items,
  onSelectCategory,
}: StoredCategoriesModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const categoriesWithStats = modules.map((mod) => {
    const categoryItems = items.filter((i) => i.moduleId === mod.id);
    const totalUnits = categoryItems.reduce((acc, curr) => acc + curr.totalUnits, 0);
    return {
      ...mod,
      itemCount: categoryItems.length,
      totalUnits,
    };
  });

  const filtered = categoriesWithStats.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="animate-fade-in flex max-h-[88vh] sm:max-h-[82vh] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  Categorías Almacenadas
                </h2>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-extrabold text-accent-foreground">
                  {modules.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Módulos y categorías activas para la organización de materiales
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
              placeholder="Buscar categoría..."
              className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-4 text-xs sm:text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Lista de categorías */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                No se encontraron categorías
              </p>
            </div>
          ) : (
            filtered.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(cat.id);
                    onClose();
                  }
                }}
                className={`group flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-muted/40 ${
                  onSelectCategory ? "cursor-pointer" : ""
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Box className="h-3 w-3" />
                        {cat.itemCount} artículo{cat.itemCount === 1 ? "" : "s"}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {cat.totalUnits} unidades
                      </span>
                    </div>
                  </div>
                </div>

                {onSelectCategory && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-80 group-hover:opacity-100">
                    <span className="hidden sm:inline">Filtrar inventario</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Presiona cualquier categoría para filtrar la vista
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
