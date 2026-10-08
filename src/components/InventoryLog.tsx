"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Clock, Dices, Search, UserCheck } from "lucide-react";

export interface InventoryLogEntry {
  id: string;
  createdAt: string;
  user: { name: string; email: string };
  drawnBy: { name: string };
}

interface InventoryLogProps {
  entries: InventoryLogEntry[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function InventoryLog({ entries }: InventoryLogProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.user.name.toLowerCase().includes(q) ||
        e.user.email.toLowerCase().includes(q) ||
        e.drawnBy.name.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <div className="mt-6 space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="inventory-log-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuario asignado o quién sorteó..."
          className="w-full rounded-2xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <ClipboardCheck className="h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-semibold text-foreground">Sin registros de inventariado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Aquí aparecerán las asignaciones realizadas con la ruleta.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e, i) => {
            const d = new Date(e.createdAt);
            const day = d.toLocaleDateString("es-MX", { weekday: "long" });
            const date = d.toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
            const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
            const isLatest = i === 0 && !query;
            return (
              <div
                key={e.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 sm:flex-row sm:items-center ${
                  isLatest ? "border-primary/40 shadow-sm shadow-primary/10" : "border-border"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                    {initials(e.user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-bold text-foreground">
                      <UserCheck className="h-4 w-4 shrink-0 text-primary" />
                      {e.user.name}
                      {isLatest && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          Actual
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{e.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:flex sm:items-center sm:gap-5">
                  <span className="flex items-center gap-1.5 capitalize">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {day}, {date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {time}
                  </span>
                  <span className="col-span-2 flex items-center gap-1.5">
                    <Dices className="h-3.5 w-3.5" />
                    Sorteó: <strong className="font-semibold text-foreground">{e.drawnBy.name}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
