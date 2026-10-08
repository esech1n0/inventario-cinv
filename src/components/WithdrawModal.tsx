"use client";

import { useState } from "react";
import { X, ArrowDownRight, Calendar, AlertCircle, Loader2, Cookie } from "lucide-react";
import { createTransaction } from "@/app/actions/transactions";
import { toast } from "@/components/Toast";

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
  snackModuleId?: string | null;
  weeklySnackLimit?: number;
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
  snackModuleId,
  weeklySnackLimit = 3,
  onSuccessOptimistic,
  onErrorRevert,
}: WithdrawModalProps) {
  const [itemId, setItemId] = useState(selectedItemId || (items[0]?.id ?? ""));
  const [quantity, setQuantity] = useState<number | "">(1);
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

    const numQuantity = typeof quantity === "number" ? quantity : parseInt(String(quantity), 10);

    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (numQuantity > currentItem.totalUnits) {
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

    // Breve carga visual para feedback de usuario al presionar Confirmar
    await new Promise((resolve) => setTimeout(resolve, 350));

    onSuccessOptimistic(
      currentItem.id,
      numQuantity,
      motive,
      isEventMotive ? eventName : undefined
    );
    toast.success(
      `Se retiraron ${numQuantity} unidad(es) de "${currentItem.name}" (${motive}).`,
      "Retiro Confirmado"
    );
    onClose();

    const formData = new FormData();
    formData.append("itemId", currentItem.id);
    formData.append("transactionType", "OUT");
    formData.append("quantity", numQuantity.toString());
    formData.append("motive", motive);
    if (isEventMotive && eventName) {
      formData.append("eventName", eventName);
    }

    try {
      const res = await createTransaction(formData);
      if (!res.success) {
        console.error("Detalle técnico del error al retirar:", res.error);
        toast.error("Ha ocurrido un error");
        onErrorRevert("Ha ocurrido un error");
      } else {
        if (res.snackNotice?.exceeded) {
          toast.warning(
            res.snackNotice.message,
            "Límite Semanal de Snacks Superado",
            10000
          );
        } else if (res.snackNotice) {
          toast.info(
            res.snackNotice.message,
            "Snack Semanal"
          );
        }
      }
    } catch (err: unknown) {
      console.error("Detalle técnico de comunicación al retirar:", err);
      toast.error("Ha ocurrido un error");
      onErrorRevert("Ha ocurrido un error");
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
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
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
                onClick={() =>
                  setQuantity((q) =>
                    Math.max(1, (typeof q === "number" ? q : 1) - 1)
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted font-bold text-foreground hover:bg-accent active:scale-95 transition-all"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={currentItem?.totalUnits || 1}
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setQuantity("");
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) setQuantity(parsed);
                  }
                }}
                onBlur={() => {
                  if (quantity === "" || quantity < 1) {
                    setQuantity(1);
                  }
                }}
                placeholder="1"
                className="flex-1 rounded-xl border border-input bg-background py-2 text-center text-base font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(
                      currentItem?.totalUnits || 1,
                      (typeof q === "number" ? q : 1) + 1
                    )
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted font-bold text-foreground hover:bg-accent active:scale-95 transition-all"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Motivo de retiro *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Para mi", "Para evento", "Para la coordinación"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMotive(m)}
                  className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                    motive === m
                      ? "border-primary bg-primary/10 font-bold text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {motive === "Para mi" && snackModuleId && currentItem?.module.id === snackModuleId && (
            <div className="animate-fade-in rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <Cookie className="h-4 w-4 text-amber-500" />
                <span>Artículo configurado como Snack Semanal</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Este retiro se registrará en tu conteo de snacks (límite de {weeklySnackLimit} por semana). Si retiras más del límite, no podrás tomar más esta semana y el excedente se reflejará en la semana posterior cuando se reinicie el conteo.
              </p>
            </div>
          )}

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
              disabled={loading}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !currentItem || currentItem.totalUnits <= 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirmando...</span>
                </>
              ) : (
                "Confirmar Retiro"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
