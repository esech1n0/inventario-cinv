"use client";

import { useMemo, useRef, useState } from "react";
import {
  Dices,
  Loader2,
  RotateCcw,
  Trophy,
  CheckCircle2,
  Users,
  History as HistoryIcon,
  X,
} from "lucide-react";
import {
  setRouletteParticipation,
  spinRoulette,
  resetRouletteRound,
  type RouletteUser,
  type RouletteDrawEntry,
} from "@/app/actions/roulette";
import { toast } from "@/components/Toast";

interface RouletteClientProps {
  initialUsers: RouletteUser[];
  initialHistory: RouletteDrawEntry[];
}

const SPIN_MS = 5500;
const SIZE = 320;
const R = SIZE / 2;

function segmentColor(i: number, total: number) {
  const hue = Math.round((i * 360) / Math.max(total, 1) + 210) % 360;
  return `hsl(${hue} 75% ${i % 2 === 0 ? 55 : 47}%)`;
}

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: radius * Math.sin(a), y: -radius * Math.cos(a) };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function RouletteClient({ initialUsers, initialHistory }: RouletteClientProps) {
  const [users, setUsers] = useState<RouletteUser[]>(initialUsers);
  const [history, setHistory] = useState<RouletteDrawEntry[]>(initialHistory);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [winner, setWinner] = useState<RouletteUser | null>(null);
  // Orden fijo de segmentos durante un giro (coincide con el servidor)
  const [spinOrder, setSpinOrder] = useState<string[] | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const participants = users.filter((u) => u.rouletteEnabled);
  const pending = participants.filter((u) => !u.rouletteDrawn);
  const roundComplete = participants.length > 0 && pending.length === 0;

  // Segmentos visibles en la ruleta
  const wheelUsers = useMemo(() => {
    if (spinOrder) {
      return spinOrder
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is RouletteUser => !!u);
    }
    return roundComplete ? participants : pending;
  }, [spinOrder, users, roundComplete, participants, pending]);

  async function handleToggle(user: RouletteUser) {
    if (spinning) return;
    const enabled = !user.rouletteEnabled;
    setPendingToggle(user.id);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, rouletteEnabled: enabled } : u)));
    const res = await setRouletteParticipation(user.id, enabled);
    if (!res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, rouletteEnabled: !enabled } : u))
      );
      toast.error(res.error);
    }
    setPendingToggle(null);
  }

  function setAll(enabled: boolean) {
    users.filter((u) => u.rouletteEnabled !== enabled).forEach((u) => handleToggle(u));
  }

  async function handleSpin() {
    if (spinning || participants.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const res = await spinRoulette();
    if (!res.success || !res.data) {
      toast.error(res.error);
      setSpinning(false);
      return;
    }

    const { winnerId, candidateIds, newRound } = res.data;
    if (newRound) {
      setUsers((prev) => prev.map((u) => ({ ...u, rouletteDrawn: false })));
    }
    setSpinOrder(candidateIds);

    const seg = 360 / candidateIds.length;
    const idx = candidateIds.indexOf(winnerId);
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const target = (idx + 0.5) * seg + jitter;
    setRotation((prev) => {
      const current = ((prev % 360) + 360) % 360;
      const delta = (((360 - target - current) % 360) + 360) % 360;
      return prev + 360 * 7 + delta;
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const w = users.find((u) => u.id === winnerId) ?? null;
      setUsers((prev) => prev.map((u) => (u.id === winnerId ? { ...u, rouletteDrawn: true } : u)));
      if (w) {
        setWinner(w);
        setHistory((prev) =>
          [
            {
              id: `local-${Date.now()}`,
              userName: w.name,
              drawnByName: "Tú",
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 10)
        );
      }
      setSpinOrder(null);
      setSpinning(false);
    }, SPIN_MS + 150);
  }

  async function handleReset() {
    if (spinning) return;
    setResetting(true);
    const res = await resetRouletteRound();
    if (res.success) {
      setUsers((prev) => prev.map((u) => ({ ...u, rouletteDrawn: false })));
      toast.success("Se inició una nueva ronda");
    } else {
      toast.error(res.error);
    }
    setResetting(false);
  }

  const seg = wheelUsers.length > 0 ? 360 / wheelUsers.length : 360;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Dices className="h-6 w-6 text-primary" />
          Ruleta de inventario
        </h1>
        <p className="text-sm text-muted-foreground">
          Sortea quién realizará el inventario semanal. A quien le toque no volverá a salir hasta
          que todos hayan tenido su turno.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Ruleta */}
        <section className="flex flex-col items-center rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
              Ronda: {participants.length - pending.length} / {participants.length} completados
            </span>
            {roundComplete && (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-500">
                ¡Ronda completa! El próximo giro inicia una nueva
              </span>
            )}
          </div>

          <div className="relative" style={{ width: SIZE, maxWidth: "100%", aspectRatio: "1" }}>
            {/* Puntero */}
            <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 drop-shadow-lg">
              <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-primary" />
            </div>

            <svg
              viewBox={`${-R - 6} ${-R - 6} ${SIZE + 12} ${SIZE + 12}`}
              className="h-full w-full drop-shadow-xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.12, 1)`
                  : "none",
              }}
            >
              <circle r={R + 4} className="fill-border" />
              {wheelUsers.length === 0 && <circle r={R} className="fill-muted" />}
              {wheelUsers.length === 1 && <circle r={R} fill={segmentColor(0, 1)} />}
              {wheelUsers.length > 1 &&
                wheelUsers.map((u, i) => {
                  const a0 = i * seg;
                  const a1 = (i + 1) * seg;
                  const p0 = polar(a0, R);
                  const p1 = polar(a1, R);
                  const large = seg > 180 ? 1 : 0;
                  return (
                    <path
                      key={u.id}
                      d={`M0 0 L${p0.x} ${p0.y} A${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y} Z`}
                      fill={segmentColor(i, wheelUsers.length)}
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth={1.5}
                    />
                  );
                })}
              {wheelUsers.map((u, i) => {
                const mid = (i + 0.5) * seg;
                const p = polar(mid, R * 0.62);
                const label = wheelUsers.length > 10 ? initials(u.name) : u.name.split(" ")[0];
                return (
                  <text
                    key={`t-${u.id}`}
                    x={p.x}
                    y={p.y}
                    transform={`rotate(${mid - 90} ${p.x} ${p.y})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={wheelUsers.length > 14 ? 10 : 13}
                    fontWeight={700}
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                  >
                    {label.length > 12 ? `${label.slice(0, 11)}…` : label}
                  </text>
                );
              })}
            </svg>

            {/* Botón central */}
            <button
              id="roulette-spin-button"
              onClick={handleSpin}
              disabled={spinning || participants.length === 0}
              className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-card bg-primary text-xs font-extrabold uppercase tracking-wide text-primary-foreground shadow-xl transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {spinning ? <Loader2 className="h-6 w-6 animate-spin" /> : "Girar"}
            </button>
          </div>

          {participants.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Selecciona al menos un usuario en la lista para usar la ruleta.
            </p>
          )}

          {winner && !spinning && (
            <div className="mt-6 flex w-full max-w-md items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 animate-fade-in">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Esta semana le toca a
                </p>
                <p className="truncate text-lg font-bold text-foreground">{winner.name}</p>
              </div>
              <button
                onClick={() => setWinner(null)}
                title="Cerrar"
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        {/* Lista de participantes + historial */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Participantes ({participants.length}/{users.length})
              </h2>
              <div className="flex gap-1 text-[11px] font-semibold">
                <button
                  onClick={() => setAll(true)}
                  disabled={spinning}
                  className="rounded-lg px-2 py-1 text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  Todos
                </button>
                <button
                  onClick={() => setAll(false)}
                  disabled={spinning}
                  className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  Ninguno
                </button>
              </div>
            </div>

            <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
              {users.map((u) => {
                const drawn = u.rouletteDrawn;
                return (
                  <li key={u.id}>
                    <label
                      htmlFor={`roulette-user-${u.id}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                        u.rouletteEnabled
                          ? "border-border bg-background hover:border-primary/40"
                          : "border-transparent bg-muted/40 opacity-60"
                      }`}
                    >
                      <input
                        id={`roulette-user-${u.id}`}
                        type="checkbox"
                        checked={u.rouletteEnabled}
                        disabled={spinning || pendingToggle === u.id}
                        onChange={() => handleToggle(u)}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            drawn && u.rouletteEnabled
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {u.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                      {drawn && u.rouletteEnabled && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Ya le tocó
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={handleReset}
              disabled={spinning || resetting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {resetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Reiniciar ronda manualmente
            </button>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <HistoryIcon className="h-4 w-4 text-primary" />
              Últimos sorteos
            </h2>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aún no hay sorteos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-foreground">{h.userName}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {new Date(h.createdAt).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
