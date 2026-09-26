"use client";

import { useState } from "react";
import { X, ArrowDownRight, Calendar, AlertCircle, Loader2 } from "lucide-react";
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

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  selectedItemId?: string;
  onSuccessOptimistic: (
    itemId: string,
    quantity: number,
    motive: string,
    eventName?: string
  ) => void;
  onErrorRevert: (errorMsg: string) => void;
}

export function WithdrawModal({
  isOpen,
  onClose,
  items,
  selectedItemId,
  onSuccessOptimistic,
  onErrorRevert,
}: WithdrawModalProps) {
  const [itemId, setItemId] = useState(selectedItemId || (items[0]?.id ?? ""));
  const [quantity, setQuantity] = useState(1);
  const [motive, setMotive] = useState("Para mi");
  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === itemId) || items[0];
  const isEventMotive = motive === "Para evento";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentItem) return;

    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (quantity > currentItem.totalUnits) {
      setError(
        `Stock insuficiente. Solo hay ${currentItem.totalUnits} unidades disponibles.`
      );
      return;
    }

    if (isEventMotive && !eventName.trim()) {
      setError("Por favor especifica el nombre del evento");
      return;
    }

    setError("");
    setLoading(true);

    onSuccessOptimistic(
      currentItem.id,
      quantity,
      motive,
      isEventMotive ? eventName : undefined
    );
    onClose();

    const formData = new FormData();
    formData.append("itemId", currentItem.id);
    formData.append("transactionType", "OUT");
    formData.append("quantity", quantity.toString());
    formData.append("motive", motive);
    if (isEventMotive && eventName) {
      formData.append("eventName", eventName);
    }

    try {
      const res = await createTransaction(formData);
      if (!res.success) {
        onErrorRevert(res.error || "Error al retirar stock");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de comunicación al registrar la salida";
      onErrorRevert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="animate-fade-in w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Retirar Material (Salida)
              </h2>
              <p className="text-xs text-muted-foreground">
                Registra el consumo o préstamo de inventario
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
              Artículo a retirar
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
                  {item.name} ({item.module.name}) — Disp: {item.totalUnits} unid
                </option>
              ))}
            </select>
            {currentItem && (
              <p className="text-xs text-muted-foreground">
                Stock actual:{" "}
                <span className="font-semibold text-foreground">
                  {currentItem.totalUnits} unidades
                </span>
                {currentItem.packagingType === "PACKAGED" &&
                  ` (${currentItem.packs} paquetes)`}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Cantidad de unidades a retirar
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
                max={currentItem?.totalUnits || 1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="flex-1 rounded-xl border border-input bg-background py-2 text-center text-base font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(currentItem?.totalUnits || 1, q + 1)
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted font-bold text-foreground hover:bg-accent"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Motivo del retiro *
            </label>
            <select
              value={motive}
              onChange={(e) => setMotive(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="Para mi">Para mi</option>
              <option value="Para evento">Para evento</option>
              <option value="Para la coordinación">Para la coordinación</option>
            </select>
          </div>

          {isEventMotive && (
            <div className="animate-fade-in space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Calendar className="h-3.5 w-3.5" />
                Nombre del Evento *
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ej. Junta directiva, Presentación de proyectos, Taller administrativo..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[11px] text-muted-foreground">
                Requerido para auditoría y trazabilidad del evento.
              </p>
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
              disabled={loading || !currentItem || currentItem.totalUnits <= 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Retiro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
