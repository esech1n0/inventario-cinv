"use client";

import { useState, useOptimistic, useTransition } from "react";
import {
  Package,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Pencil,
  Box,
  Layers,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { WithdrawModal } from "@/components/WithdrawModal";
import { AddStockModal } from "@/components/AddStockModal";
import { CreateItemModal } from "@/components/CreateItemModal";
import { EditItemModal } from "@/components/EditItemModal";
import { RegisteredItemsModal } from "@/components/RegisteredItemsModal";
import { StoredCategoriesModal } from "@/components/StoredCategoriesModal";
import { toast } from "@/components/Toast";
import { deleteItem } from "@/app/actions/items";

export interface Item {
  id: string;
  moduleId: string;
  name: string;
  packagingType: "UNITARY" | "PACKAGED";
  packs: number;
  unitsPerPack: number;
  totalUnits: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  module: {
    id: string;
    name: string;
  };
}

interface Module {
  id: string;
  name: string;
}

interface InventoryClientProps {
  initialItems: Item[];
  modules: Module[];
  userRole: string;
  snackModuleId?: string | null;
  weeklySnackLimit?: number;
}

type OptimisticAction =
  | { type: "OUT"; itemId: string; quantity: number }
  | { type: "IN"; itemId: string; quantity: number }
  | { type: "DELETE"; itemId: string };

export function InventoryClient({
  initialItems,
  modules,
  userRole,
  snackModuleId,
  weeklySnackLimit = 3,
}: InventoryClientProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [prevInitial, setPrevInitial] = useState(initialItems);
  if (initialItems !== prevInitial) {
    setPrevInitial(initialItems);
    setItems(initialItems);
  }

  const [selectedModuleId, setSelectedModuleId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisteredItemsOpen, setIsRegisteredItemsOpen] = useState(false);
  const [isStoredCategoriesOpen, setIsStoredCategoriesOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | undefined>(undefined);
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [, startTransition] = useTransition();

  // Optimistic UI state
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (state: Item[], action: OptimisticAction) => {
      if (action.type === "OUT") {
        return state.map((item) => {
          if (item.id !== action.itemId) return item;
          const newTotal = Math.max(0, item.totalUnits - action.quantity);
          const newPacks =
            item.packagingType === "PACKAGED" && item.unitsPerPack > 0
              ? Math.floor(newTotal / item.unitsPerPack)
              : item.packs;
          return { ...item, totalUnits: newTotal, packs: newPacks };
        });
      }
      if (action.type === "IN") {
        return state.map((item) => {
          if (item.id !== action.itemId) return item;
          const newTotal = item.totalUnits + action.quantity;
          const newPacks =
            item.packagingType === "PACKAGED" && item.unitsPerPack > 0
              ? Math.floor(newTotal / item.unitsPerPack)
              : item.packs;
          return { ...item, totalUnits: newTotal, packs: newPacks };
        });
      }
      if (action.type === "DELETE") {
        return state.filter((item) => item.id !== action.itemId);
      }
      return state;
    }
  );

  const filteredItems = optimisticItems.filter((item) => {
    const matchesModule =
      selectedModuleId === "ALL" || item.moduleId === selectedModuleId;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.module.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const totalArticulos = optimisticItems.length;
  const totalUnidades = optimisticItems.reduce(
    (acc, curr) => acc + curr.totalUnits,
    0
  );

  function handleWithdrawOptimistic(
    itemId: string,
    quantity: number,
    motive: string,
    eventName?: string
  ) {
    startTransition(() => {
      setOptimisticItems({ type: "OUT", itemId, quantity });
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const newTotal = Math.max(0, item.totalUnits - quantity);
          const newPacks =
            item.packagingType === "PACKAGED" && item.unitsPerPack > 0
              ? Math.floor(newTotal / item.unitsPerPack)
              : item.packs;
          return { ...item, totalUnits: newTotal, packs: newPacks };
        })
      );
    });

    setBannerMessage({
      type: "success",
      text: `Salida registrada exitosamente (${quantity} unidades). Motivo: ${motive}${
        eventName ? ` · Evento: ${eventName}` : ""
      }`,
    });
    setTimeout(() => setBannerMessage(null), 5000);
  }

  function handleAddStockOptimistic(
    itemId: string,
    quantity: number,
    motive: string
  ) {
    startTransition(() => {
      setOptimisticItems({ type: "IN", itemId, quantity });
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const newTotal = item.totalUnits + quantity;
          const newPacks =
            item.packagingType === "PACKAGED" && item.unitsPerPack > 0
              ? Math.floor(newTotal / item.unitsPerPack)
              : item.packs;
          return { ...item, totalUnits: newTotal, packs: newPacks };
        })
      );
    });

    setBannerMessage({
      type: "success",
      text: `Entrada registrada exitosamente (+${quantity} unidades). Motivo: ${motive}`,
    });
    setTimeout(() => setBannerMessage(null), 5000);
  }

  function handleErrorRevert(errorMsg: string) {
    console.error("Detalle técnico del error en inventario:", errorMsg);
    setBannerMessage({
      type: "error",
      text: "Ha ocurrido un error",
    });
    toast.error("Ha ocurrido un error");
    setTimeout(() => setBannerMessage(null), 7000);
  }

  async function handleDeleteItem(itemId: string, itemName: string) {
    if (userRole !== "ADMIN") {
      alert("Solo los administradores pueden eliminar artículos.");
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar "${itemName}" del inventario?`)) {
      return;
    }

    const previousItems = items;
    startTransition(() => {
      setOptimisticItems({ type: "DELETE", itemId });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    });

    try {
      const res = await deleteItem(itemId);
      if (!res.success) {
        setItems(previousItems);
        handleErrorRevert(res.error || "Error al eliminar");
      } else {
        toast.success(`Artículo "${itemName}" eliminado.`);
        setBannerMessage({
          type: "success",
          text: `Artículo "${itemName}" eliminado.`,
        });
        setTimeout(() => setBannerMessage(null), 4000);
      }
    } catch (err: unknown) {
      setItems(previousItems);
      console.error("Detalle técnico al eliminar artículo:", err);
      handleErrorRevert("Error de conexión al eliminar el artículo");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {bannerMessage && (
        <div
          className={`animate-fade-in mb-6 flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${
            bannerMessage.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {bannerMessage.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{bannerMessage.text}</span>
        </div>
      )}

      {/* Header y Acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Control de Inventario
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de existencias, consumo y materiales de CINV
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setActiveItemId(undefined);
              setIsWithdrawOpen(true);
            }}
            className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-sm shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <ArrowDownRight className="h-4 w-4" />
            Retirar Material
          </button>

          <button
            onClick={() => {
              setActiveItemId(undefined);
              setIsAddStockOpen(true);
            }}
            className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
            Ingresar Stock
          </button>

          <button
            onClick={() => setIsCreateItemOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* Resumen Métricas */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => setIsRegisteredItemsOpen(true)}
          title="Ver todos los artículos registrados"
          className="group cursor-pointer rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                Artículos Registrados
              </p>
              <p className="text-xl font-bold text-foreground">
                {totalArticulos}
              </p>
            </div>
          </div>
        </button>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total de Unidades
              </p>
              <p className="text-xl font-bold text-foreground">
                {totalUnidades}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsStoredCategoriesOpen(true)}
          title="Ver todas las categorías almacenadas"
          className="col-span-2 sm:col-span-1 group cursor-pointer rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-accent/50 hover:bg-muted/30 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:scale-110">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-accent-foreground">
                Categorías Activas
              </p>
              <p className="text-xl font-bold text-foreground">
                {modules.length}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Barra de Búsqueda y Pestañas */}
      <div className="mt-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de artículo o categoría..."
            className="w-full rounded-2xl border border-input bg-card py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedModuleId("ALL")}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              selectedModuleId === "ALL"
                ? "bg-foreground text-background shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Todos ({optimisticItems.length})
          </button>
          {modules.map((mod) => {
            const count = optimisticItems.filter(
              (i) => i.moduleId === mod.id
            ).length;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  selectedModuleId === mod.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {mod.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Artículos */}
      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              No se encontraron artículos
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              {searchQuery
                ? "No hay artículos que coincidan con la búsqueda actual."
                : "Aún no hay artículos registrados en esta categoría."}
            </p>
            <button
              onClick={() => setIsCreateItemOpen(true)}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Agregar el primer artículo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                      {item.module.name}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {item.packagingType === "PACKAGED"
                        ? "Empaquetado"
                        : "Unitario"}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-foreground">
                    {item.name}
                  </h3>

                  {/* Detalle de Stock en TEXTO PLANO (Regla de negocio estricta: sin colores de alerta por stock) */}
                  <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">
                        Disponible:
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {item.totalUnits} unidades
                      </span>
                    </div>

                    {item.packagingType === "PACKAGED" && (
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-1.5">
                        <span>Paquetes:</span>
                        <span className="font-medium text-foreground">
                          {item.packs} paq ({item.unitsPerPack} unid/paq)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
                  <button
                    onClick={() => {
                      setActiveItemId(item.id);
                      setIsWithdrawOpen(true);
                    }}
                    disabled={item.totalUnits <= 0}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    Retirar
                  </button>

                  <button
                    onClick={() => {
                      setActiveItemId(item.id);
                      setIsAddStockOpen(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Ingresar
                  </button>

                  {userRole === "ADMIN" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditModalOpen(true);
                        }}
                        title="Editar artículo y existencias (Solo Admin)"
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95 transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        title="Eliminar artículo (Solo Admin)"
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        items={items}
        selectedItemId={activeItemId}
        snackModuleId={snackModuleId}
        weeklySnackLimit={weeklySnackLimit}
        onSuccessOptimistic={handleWithdrawOptimistic}
        onErrorRevert={handleErrorRevert}
      />

      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        items={items}
        selectedItemId={activeItemId}
        onSuccessOptimistic={handleAddStockOptimistic}
        onErrorRevert={handleErrorRevert}
      />

      <CreateItemModal
        isOpen={isCreateItemOpen}
        onClose={() => setIsCreateItemOpen(false)}
        modules={modules}
        selectedModuleId={
          selectedModuleId !== "ALL" ? selectedModuleId : undefined
        }
        onSuccess={(newItem) => {
          setItems((prev) => {
            if (prev.some((i) => i.id === newItem.id)) return prev;
            return [...prev, newItem];
          });
          setBannerMessage({
            type: "success",
            text: `Artículo "${newItem.name}" creado con éxito.`,
          });
          setTimeout(() => setBannerMessage(null), 4000);
        }}
      />

      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        modules={modules}
        onSuccess={(updatedItem) => {
          setItems((prev) =>
            prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
          );
          setBannerMessage({
            type: "success",
            text: `Artículo "${updatedItem.name}" actualizado correctamente (sin registro en historial).`,
          });
          setTimeout(() => setBannerMessage(null), 5000);
        }}
      />

      {/* Modal para ver Artículos Registrados */}
      <RegisteredItemsModal
        isOpen={isRegisteredItemsOpen}
        onClose={() => setIsRegisteredItemsOpen(false)}
        items={optimisticItems}
        onWithdraw={(itemId) => {
          setActiveItemId(itemId);
          setIsWithdrawOpen(true);
        }}
        onAddStock={(itemId) => {
          setActiveItemId(itemId);
          setIsAddStockOpen(true);
        }}
      />

      {/* Modal para ver Categorías Almacenadas */}
      <StoredCategoriesModal
        isOpen={isStoredCategoriesOpen}
        onClose={() => setIsStoredCategoriesOpen(false)}
        modules={modules}
        items={optimisticItems}
        onSelectCategory={(modId) => {
          setSelectedModuleId(modId);
        }}
      />
    </div>
  );
}
