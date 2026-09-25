"use client";

import { useState } from "react";
import { X, ArrowUpRight, AlertCircle, Loader2 } from "lucide-react";
import { createTransaction } from "@/app/actions/transactions";

interface Item {
  id: string;
  name: string;
  packagingType: "UNITARY" | "PACKAGED";
  packs: number;
  unitsPerPack: number;
  totalUnits: number;
  module: {
    id: string;
    name: string;
  };
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  selectedItemId?: string;
  onSuccessOptimistic: (itemId: string, quantity: number, motive: string) => void;
  onErrorRevert: (errorMsg: string) => void;
}

export function AddStockModal({
  isOpen,
  onClose,
  items,
  selectedItemId,
  onSuccessOptimistic,
  onErrorRevert,
}: AddStockModalProps) {
  const [itemId, setItemId] = useState(selectedItemId || (items[0]?.id ?? ""));
  const [quantity, setQuantity] = useState(1);
  const [motive, setMotive] = useState("Compra / Reposición");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === itemId) || items[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentItem) return;

    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    setError("");
    setLoading(true);

    onSuccessOptimistic(currentItem.id, quantity, motive);
    onClose();

    const formData = new FormData();
    formData.append("itemId", currentItem.id);
    formData.append("transactionType", "IN");
    formData.append("quantity", quantity.toString());
    formData.append("motive", motive);

    try {
      const res = await createTransaction(formData);
      if (!res.success) {
        onErrorRevert(res.error || "Error al ingresar stock");
      }
    } catch (err: any) {
      onErrorRevert(err?.message || "Error de comunicación al registrar la entrada");
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
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Ingresar Stock (Entrada)
              </h2>
              <p className="text-xs text-muted-foreground">
                Añadir unidades recibidas al inventario
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
              Artículo a reabastecer
            </label>
            <select
              value={itemId}
              onChange={(e) => {
                setItemId(e.target.value);
                setQuantity(1);
              }}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.module.name}) — Actual: {item.totalUnits} unid
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Cantidad de unidades a ingresar
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted font-bold text-foreground hover:bg-accent"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="flex-1 rounded-xl border border-input bg-background py-2 text-center text-base font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted font-bold text-foreground hover:bg-accent"
              >
                +
              </button>
            </div>
            {currentItem?.packagingType === "PACKAGED" && (
              <p className="text-[11px] text-muted-foreground">
                Nota: Para artículos empaquetados ({currentItem.unitsPerPack} unid/paq), se recalculará el conteo de paquetes automáticamente.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Motivo del ingreso *
            </label>
            <input
              type="text"
              required
              value={motive}
              onChange={(e) => setMotive(e.target.value)}
              placeholder="Ej. Compra directa, Donación de patrocinador, Devolución..."
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

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
              disabled={loading || !currentItem}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
