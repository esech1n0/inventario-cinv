"use client";

import { useState } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  ShieldCheck,
  User,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { approveUser, suspendUser, deleteUser } from "@/app/actions/users";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isApproved: boolean;
  createdAt: Date | string;
}

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
}

export function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pendingCount = users.filter((u) => !u.isApproved).length;

  const filteredUsers = users.filter((u) => {
    if (filter === "PENDING") return !u.isApproved;
    if (filter === "APPROVED") return u.isApproved;
    return true;
  });

  async function handleApprove(userId: string, userName: string) {
    setActionLoading(userId);
    const res = await approveUser(userId);
    setActionLoading(null);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isApproved: true } : u))
      );
      setBanner({
        type: "success",
        text: `La cuenta de ${userName} ha sido aprobada. Ahora puede iniciar sesión.`,
      });
      setTimeout(() => setBanner(null), 4000);
    } else {
      setBanner({ type: "error", text: res.error || "Error al aprobar usuario" });
    }
  }

  async function handleSuspend(userId: string, userName: string) {
    if (!confirm(`¿Deseas suspender el acceso de ${userName}?`)) return;

    setActionLoading(userId);
    const res = await suspendUser(userId);
    setActionLoading(null);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isApproved: false } : u))
      );
      setBanner({
        type: "success",
        text: `La cuenta de ${userName} ha sido suspendida.`,
      });
      setTimeout(() => setBanner(null), 4000);
    } else {
      setBanner({ type: "error", text: res.error || "Error al suspender usuario" });
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`¿Eliminar definitivamente a ${userName}? Esta acción no se puede deshacer.`)) return;

    setActionLoading(userId);
    const res = await deleteUser(userId);
    setActionLoading(null);

    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setBanner({
        type: "success",
        text: `Usuario ${userName} eliminado del sistema.`,
      });
      setTimeout(() => setBanner(null), 4000);
    } else {
      setBanner({ type: "error", text: res.error || "Error al eliminar usuario" });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {banner && (
        <div
          className={`animate-fade-in mb-6 flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${
            banner.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {banner.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{banner.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aprobación de cuentas nuevas, control de roles y accesos
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card p-1">
          <button
            onClick={() => setFilter("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === "ALL"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === "PENDING"
                ? "bg-warning text-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Pendientes</span>
            {pendingCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === "APPROVED"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Aprobados
          </button>
        </div>
      </div>

      {/* Tarjeta de alerta si hay usuarios pendientes */}
      {pendingCount > 0 && filter !== "PENDING" && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-bold text-foreground">
                Hay {pendingCount} cuenta(s) pendiente(s) de aprobación
              </p>
              <p className="text-xs text-muted-foreground">
                Los integrantes no podrán acceder hasta que un administrador apruebe su registro.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilter("PENDING")}
            className="rounded-xl bg-warning px-3 py-1.5 text-xs font-bold text-black hover:opacity-90"
          >
            Ver pendientes
          </button>
        </div>
      )}

      {/* Lista de Usuarios */}
      <div className="mt-6 space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              No hay usuarios en esta categoría
            </h3>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelf = user.id === currentUserId;
            const isLoading = actionLoading === user.id;

            return (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Info */}
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{user.name}</span>
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <User className="h-3 w-3" />
                          INTEGRANTE
                        </span>
                      )}
                      {isSelf && (
                        <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Estado y Acciones */}
                <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
                  <div className="flex items-center gap-2">
                    {user.isApproved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Aprobado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
                        <Clock className="h-3.5 w-3.5" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!user.isApproved ? (
                      <button
                        onClick={() => handleApprove(user.id, user.name)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 rounded-xl bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50"
                      >
                        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Aprobar
                      </button>
                    ) : (
                      !isSelf && (
                        <button
                          onClick={() => handleSuspend(user.id, user.name)}
                          disabled={isLoading}
                          className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted active:scale-95 disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )
                    )}

                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={isLoading}
                        title="Eliminar usuario"
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
