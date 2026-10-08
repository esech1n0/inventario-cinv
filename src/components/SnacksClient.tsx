"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cookie,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  Lock,
  AlertCircle,
  Hand,
  CalendarDays,
} from "lucide-react";
import { saveWeeklySnacks, takeSnack } from "@/app/actions/snacks";
import { formatWeekRange } from "@/lib/week";
import { toast } from "@/components/Toast";

export interface SnackOption {
  id: string;
  name: string;
  available: number;
}

export interface MySnack {
  id: string;
  itemId: string;
  name: string;
  takenAt: string | null;
}

interface SnacksClientProps {
  weekKey: string;
  limit: number;
  configured: boolean;
  options: SnackOption[];
  initialSnacks: MySnack[];
}

export function SnacksClient({
  weekKey,
  limit,
  configured,
  options,
  initialSnacks,
}: SnacksClientProps) {
  const router = useRouter();
  const [snacks, setSnacks] = useState<MySnack[]>(initialSnacks);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [takingId, setTakingId] = useState<string | null>(null);

  const hasSelection = snacks.length > 0;
  const cartTotal = Object.values(cart).reduce((a, b) => a + b, 0);
  const remaining = snacks.filter((s) => !s.takenAt).length;

  function change(id: string, delta: number, max: number) {
    setConfirming(false);
    setCart((prev) => {
      const next = Math.min(Math.max((prev[id] ?? 0) + delta, 0), max);
      if (delta > 0 && cartTotal >= limit) return prev;
      return { ...prev, [id]: next };
    });
  }

  async function handleSave() {
    const itemIds = Object.entries(cart).flatMap(([id, n]) => Array(n).fill(id) as string[]);
    setSaving(true);
    const res = await saveWeeklySnacks(itemIds);
    setSaving(false);
    setConfirming(false);
    if (!res.success) {
      toast.error(res.error);
      router.refresh();
      return;
    }
    toast.success("Tu selecci\u00f3n de la semana qued\u00f3 guardada");
    router.refresh();
    // Vista inmediata mientras llega el refresh
    setSnacks(
      itemIds.map((itemId, i) => ({
        id: `tmp-${i}`,
        itemId,
        name: options.find((o) => o.id === itemId)?.name ?? "Snack",
        takenAt: null,
      }))
    );
  }

  async function handleTake(snack: MySnack) {
    if (snack.id.startsWith("tmp-")) return;
    setTakingId(snack.id);
    const prevSnacks = snacks;
    // UI optimista
    const now = new Date().toISOString();
    setSnacks((p) => p.map((s) => (s.id === snack.id ? { ...s, takenAt: now } : s)));
    const res = await takeSnack(snack.id);
    if (!res.success) {
      setSnacks(prevSnacks);
      toast.error(res.error);
    } else {
      setSnacks((p) =>
        p.map((s) => (s.id === snack.id ? { ...s, takenAt: res.data!.takenAt } : s))
      );
      toast.success(`\u00a1Disfruta tu ${snack.name}!`);
    }
    setTakingId(null);
  }

  // Al refrescar, sincroniza IDs reales
  if (
    initialSnacks.length > 0 &&
    snacks.some((s) => s.id.startsWith("tmp-")) &&
    initialSnacks.length === snacks.length
  ) {
    setSnacks(initialSnacks);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <Cookie className="h-7 w-7 text-amber-500" />
            Mis snacks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escoge hasta <strong className="text-foreground">{limit}</strong> snack(s) para la
            semana y marca cada uno cuando lo tomes.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:self-auto">
          <CalendarDays className="h-3.5 w-3.5" />
          Semana del {formatWeekRange(weekKey)}
        </span>
      </header>

      {!configured && !hasSelection ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Los snacks a\u00fan no est\u00e1n configurados
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Un administrador debe elegir la categor\u00eda de snacks en Configuraci\u00f3n.
          </p>
        </div>
      ) : hasSelection ? (
        /* ---------- Selecci\u00f3n guardada ---------- */
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="text-2xl font-extrabold text-foreground">{remaining}</span>
              <span className="text-xs leading-tight text-muted-foreground">
                disponible(s)
                <br />
                de {snacks.length}
              </span>
            </div>
            <div className="h-2.5 min-w-[160px] flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                style={{ width: `${((snacks.length - remaining) / snacks.length) * 100}%` }}
              />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Lock className="h-3 w-3" /> Selecci\u00f3n cerrada esta semana
            </span>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {snacks.map((s) => {
              const taken = !!s.takenAt;
              const d = s.takenAt ? new Date(s.takenAt) : null;
              return (
                <li
                  key={s.id}
                  className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 transition-all ${
                    taken
                      ? "border-border/60 bg-muted/40"
                      : "border-amber-500/30 bg-card shadow-sm hover:border-amber-500/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        taken ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {taken ? <CheckCircle2 className="h-5 w-5" /> : <Cookie className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-bold ${
                          taken ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {s.name}
                      </p>
                      <p className="text-[11px] capitalize text-muted-foreground">
                        {d
                          ? `Tomado el ${d.toLocaleDateString("es-MX", {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                            })} \u00b7 ${d.toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "Disponible para tomar"}
                      </p>
                    </div>
                  </div>
                  {!taken && (
                    <button
                      id={`take-snack-${s.id}`}
                      onClick={() => handleTake(s)}
                      disabled={takingId !== null || s.id.startsWith("tmp-")}
                      className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/30 transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                    >
                      {takingId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Hand className="h-4 w-4" />
                      )}
                      Ya lo tom\u00e9
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        /* ---------- Escoger snacks ---------- */
        <section className="mt-6">
          {options.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No hay snacks registrados en la categor\u00eda configurada.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {options.map((o) => {
                const qty = cart[o.id] ?? 0;
                const soldOut = o.available === 0;
                return (
                  <li
                    key={o.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                      qty > 0
                        ? "border-amber-500/60 bg-amber-500/5 shadow-sm"
                        : "border-border bg-card"
                    } ${soldOut ? "opacity-50" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{o.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {soldOut ? "Agotado" : `${o.available} disponible(s)`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        aria-label={`Quitar ${o.name}`}
                        onClick={() => change(o.id, -1, o.available)}
                        disabled={qty === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-foreground transition-all hover:bg-muted active:scale-90 disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-foreground">{qty}</span>
                      <button
                        aria-label={`Agregar ${o.name}`}
                        onClick={() => change(o.id, 1, o.available)}
                        disabled={soldOut || qty >= o.available || cartTotal >= limit}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white transition-all hover:bg-amber-600 active:scale-90 disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Barra de resumen */}
          <div className="sticky bottom-4 mt-6 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md">
            {confirming ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  Una vez guardada, no podr\u00e1s cambiar tu selecci\u00f3n hasta la pr\u00f3xima semana.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={saving}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Revisar
                  </button>
                  <button
                    id="confirm-snacks-button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {Array.from({ length: limit }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        i < cartTotal ? "bg-amber-500" : "bg-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-semibold text-muted-foreground">
                    {cartTotal} / {limit}
                  </span>
                </div>
                <button
                  id="save-snacks-button"
                  onClick={() => setConfirming(true)}
                  disabled={cartTotal === 0}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-amber-500/30 transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-40"
                >
                  Guardar selecci\u00f3n
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
