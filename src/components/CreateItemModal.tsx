"use client";

import { useState } from "react";
import { X, Package2, AlertCircle, Loader2 } from "lucide-react";
import { createItem } from "@/app/actions/items";

interface Module {
  id: string;
  name: string;
}

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: Module[];
  selectedModuleId?: string;
  onSuccess?: (newItem: any) => void;
}

export function CreateItemModal({
  isOpen,
  onClose,
  modules,
  selectedModuleId,
  onSuccess,
}: CreateItemModalProps) {
  const [moduleId, setModuleId] = useState(
    selectedModuleId || (modules[0]?.id ?? "")
  );
  const [name, setName] = useState("");
  const [packagingType, setPackagingType] = useState<"UNITARY" | "PACKAGED">(
    "UNITARY"
  );
  const [packs, setPacks] = useState<number | "">(1);
  const [unitsPerPack, setUnitsPerPack] = useState<number | "">(10);
  const [unitaryUnits, setUnitaryUnits] = useState<number | "">(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const numericPacks = typeof packs === "number" ? packs : 0;
  const numericUnitsPerPack = typeof unitsPerPack === "number" ? unitsPerPack : 0;
  const numericUnitary = typeof unitaryUnits === "number" ? unitaryUnits : 0;

  const totalCalculated =
    packagingType === "PACKAGED"
      ? numericPacks * numericUnitsPerPack
      : numericUnitary;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del artículo es requerido");
      return;
    }
    if (!moduleId) {
      setError("Debes seleccionar un módulo");
      return;
    }

    if (packagingType === "PACKAGED") {
      if (unitsPerPack === "" || unitsPerPack < 1) {
        setError("Las unidades por paquete deben ser al menos 1");
        return;
      }
    }

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("moduleId", moduleId);
    formData.append("name", name.trim());
    formData.append("packagingType", packagingType);

    if (packagingType === "PACKAGED") {
      const finalPacks = typeof packs === "number" ? packs : 0;
      const finalUnitsPerPack = typeof unitsPerPack === "number" ? unitsPerPack : 1;
      formData.append("packs", finalPacks.toString());
      formData.append("unitsPerPack", finalUnitsPerPack.toString());
      formData.append("totalUnits", (finalPacks * finalUnitsPerPack).toString());
    } else {
      const finalUnitary = unitaryUnits === "" ? 0 : unitaryUnits;
      formData.append("packs", "0");
      formData.append("unitsPerPack", "1");
      formData.append("totalUnits", finalUnitary.toString());
    }

    try {
      const res = await createItem(formData);
      if (!res.success) {
        setError(res.error || "Error al crear el artículo");
      } else {
        if (res.data && onSuccess) {
          onSuccess(res.data);
        }
        onClose();
        setName("");
        setPackagingType("UNITARY");
        setPacks(1);
        setUnitsPerPack(10);
        setUnitaryUnits(1);
      }
    } catch (err: any) {
      setError(err?.message || "Error inesperado al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="animate-fade-in w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Nuevo Artículo
              </h2>
              <p className="text-xs text-muted-foreground">
                Agrega un producto o material al inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Módulo / Categoría *
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {modules.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nombre del artículo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Plumas azules, Tóner HP LaserJet, Post-its, Laptops, Extensiones..."
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Tipo de Artículo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPackagingType("UNITARY")}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  packagingType === "UNITARY"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-sm font-bold text-foreground">Unitario</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  Piezas sueltas (ej. sellos, grapadoras, tijeras, laptops, extensiones)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPackagingType("PACKAGED")}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  packagingType === "PACKAGED"
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-sm font-bold text-foreground">Empaquetado</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  Por cajas o paquetes (ej. resmas de hojas, cajas de plumas, post-its)
                </span>
              </button>
            </div>
          </div>

          {packagingType === "PACKAGED" ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Paquetes iniciales
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={packs}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setPacks("");
                    } else {
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed)) setPacks(Math.max(0, parsed));
                    }
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Unidades por paquete
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={unitsPerPack}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setUnitsPerPack("");
                    } else {
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed)) setUnitsPerPack(Math.max(0, parsed));
                    }
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="col-span-2 mt-1 rounded-lg bg-background p-2.5 text-center text-xs text-muted-foreground border border-border">
                Total calculado:{" "}
                <span className="font-bold text-foreground">
                  {totalCalculated} unidades
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3.5">
              <label className="text-xs font-semibold text-foreground">
                Cantidad de unidades iniciales
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={unitaryUnits}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setUnitaryUnits("");
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) setUnitaryUnits(Math.max(0, parsed));
                  }
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Artículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
