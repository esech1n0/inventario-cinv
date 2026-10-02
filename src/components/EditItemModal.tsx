"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Package,
  Layers,
  X,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import { updateItem } from "@/app/actions/items";
import type { Item } from "@/components/InventoryClient";

interface Module {
  id: string;
  name: string;
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  modules: Module[];
  onSuccess: (updatedItem: Item) => void;
}

export function EditItemModal({
  isOpen,
  onClose,
  item,
  modules,
  onSuccess,
}: EditItemModalProps) {
  const [name, setName] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [packagingType, setPackagingType] = useState<"UNITARY" | "PACKAGED">("UNITARY");
  const [packs, setPacks] = useState<number | "">(0);
  const [unitsPerPack, setUnitsPerPack] = useState<number | "">(1);
  const [totalUnits, setTotalUnits] = useState<number | "">(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setModuleId(item.moduleId);
      setPackagingType(item.packagingType);
      setPacks(item.packs ?? 0);
      setUnitsPerPack(item.unitsPerPack ?? 1);
      setTotalUnits(item.totalUnits ?? 0);
      setError("");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  function handlePacksChange(val: string | number) {
    if (val === "") {
      setPacks("");
      return;
    }
    const num = typeof val === "number" ? val : parseInt(val, 10);
    const p = isNaN(num) ? 0 : Math.max(0, num);
    setPacks(p);
    const upp = typeof unitsPerPack === "number" ? unitsPerPack : 1;
    setTotalUnits(p * upp);
  }

  function handleUnitsPerPackChange(val: string | number) {
    if (val === "") {
      setUnitsPerPack("");
      return;
    }
    const num = typeof val === "number" ? val : parseInt(val, 10);
    const upp = isNaN(num) ? 1 : Math.max(1, num);
    setUnitsPerPack(upp);
    const p = typeof packs === "number" ? packs : 0;
    setTotalUnits(p * upp);
  }

  function handleTotalUnitsChange(val: string | number) {
    if (val === "") {
      setTotalUnits("");
      if (packagingType === "PACKAGED") {
        setPacks(0);
      }
      return;
    }
    const num = typeof val === "number" ? val : parseInt(val, 10);
    const t = isNaN(num) ? 0 : Math.max(0, num);
    setTotalUnits(t);
    const upp = typeof unitsPerPack === "number" && unitsPerPack > 0 ? unitsPerPack : 1;
    if (packagingType === "PACKAGED") {
      setPacks(Math.floor(t / upp));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    if (!name.trim()) {
      setError("El nombre del artículo es obligatorio");
      return;
    }
    if (!moduleId) {
      setError("Debes seleccionar una categoría");
      return;
    }

    setLoading(true);
    setError("");

    const finalPacks = typeof packs === "number" ? packs : 0;
    const finalUnitsPerPack =
      typeof unitsPerPack === "number" && unitsPerPack > 0 ? unitsPerPack : 1;
    const finalTotalUnits =
      typeof totalUnits === "number"
        ? totalUnits
        : packagingType === "PACKAGED"
        ? finalPacks * finalUnitsPerPack
        : 0;

    const formData = new FormData();
    formData.append("itemId", item.id);
    formData.append("name", name.trim());
    formData.append("moduleId", moduleId);
    formData.append("packagingType", packagingType);
    formData.append("packs", finalPacks.toString());
    formData.append("unitsPerPack", finalUnitsPerPack.toString());
    formData.append("totalUnits", finalTotalUnits.toString());

    try {
      const res = await updateItem(formData);
      setLoading(false);

      if (!res.success || !res.data) {
        console.error("Detalle del error al actualizar artículo:", res.error);
        setError("Ha ocurrido un error");
      } else {
        onSuccess(res.data as Item);
        onClose();
      }
    } catch (err: any) {
      setLoading(false);
      console.error("Detalle del error inesperado al actualizar artículo:", err);
      setError("Ha ocurrido un error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Editar Artículo
              </h2>
              <p className="text-xs text-muted-foreground">
                Ajuste directo de catálogo y cantidades (Solo Administrador)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notice badge */}
        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <span>
            Las modificaciones manuales de stock y datos realizadas aquí se aplican
            directamente al artículo y{" "}
            <strong className="text-foreground font-semibold">
              no se registran en el reporte de movimientos
            </strong>.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre del artículo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nombre del artículo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Plumones, Cartulinas, Carpetas..."
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Categoría *
            </label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="" disabled>
                  Seleccionar categoría...
                </option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de Empaque */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tipo de presentación
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPackagingType("UNITARY");
                  setPacks(0);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                  packagingType === "UNITARY"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Package className="h-4 w-4" />
                Unitario (Suelto)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPackagingType("PACKAGED");
                  const p = typeof packs === "number" && packs > 0 ? packs : 1;
                  const upp = typeof unitsPerPack === "number" && unitsPerPack > 0 ? unitsPerPack : 1;
                  setPacks(p);
                  setTotalUnits(p * upp);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                  packagingType === "PACKAGED"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Package className="h-4 w-4" />
                Empaquetado
              </button>
            </div>
          </div>

          {/* Si es empaquetado: controles de paquetes y unidades por paquete */}
          {packagingType === "PACKAGED" ? (
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Cantidad de paquetes
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Poner / Quitar paquetes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = typeof packs === "number" ? packs : 0;
                      handlePacksChange(Math.max(0, current - 1));
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted active:scale-95"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={packs}
                    onChange={(e) => handlePacksChange(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-input bg-background py-1.5 text-center text-sm font-bold text-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = typeof packs === "number" ? packs : 0;
                      handlePacksChange(current + 1);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Unidades por paquete
                </label>
                <input
                  type="number"
                  min="1"
                  value={unitsPerPack}
                  onChange={(e) => handleUnitsPerPackChange(e.target.value)}
                  placeholder="1"
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              {/* Total resultante */}
              <div className="flex items-center justify-between rounded-lg bg-background p-2.5 border border-border/60">
                <span className="text-xs font-medium text-muted-foreground">
                  Total de unidades calculadas:
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {typeof totalUnits === "number" ? totalUnits : 0} unidades
                </span>
              </div>
            </div>
          ) : (
            /* Si es unitario: controles de unidades directas */
            <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Cantidad total de unidades
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Poner / Quitar unidades
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof totalUnits === "number" ? totalUnits : 0;
                    handleTotalUnitsChange(Math.max(0, current - 5));
                  }}
                  title="-5 unidades"
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted active:scale-95"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof totalUnits === "number" ? totalUnits : 0;
                    handleTotalUnitsChange(Math.max(0, current - 1));
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={totalUnits}
                  onChange={(e) => handleTotalUnitsChange(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-input bg-background py-1.5 text-center text-sm font-bold text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof totalUnits === "number" ? totalUnits : 0;
                    handleTotalUnitsChange(current + 1);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof totalUnits === "number" ? totalUnits : 0;
                    handleTotalUnitsChange(current + 5);
                  }}
                  title="+5 unidades"
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted active:scale-95"
                >
                  +5
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
