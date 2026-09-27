"use client";

import { useState } from "react";
import {
  Users,
  Trash2,
  ShieldCheck,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  KeyRound,
  Search,
} from "lucide-react";
import { updateUserRole, deleteUser } from "@/app/actions/users";
import { AdminChangePasswordModal } from "@/components/AdminChangePasswordModal";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isApproved?: boolean;
  createdAt: Date | string;
}

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
}

export function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserItem | null>(null);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const memberCount = users.filter((u) => u.role === "USER").length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      u.email.toLowerCase().includes(search.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (roleFilter === "ADMIN") return u.role === "ADMIN";
    if (roleFilter === "USER") return u.role === "USER";
    return true;
  });

  async function handleRoleChange(userId: string, userName: string, newRole: "ADMIN" | "USER") {
    const roleName = newRole === "ADMIN" ? "Administrador" : "Integrante";
    if (
      !confirm(
        `¿Deseas cambiar el rol de ${userName} a ${roleName}?`
      )
    ) {
      return;
    }

    setActionLoading(userId);
    const res = await updateUserRole(userId, newRole);
    setActionLoading(null);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setBanner({
        type: "success",
        text: `El rol de ${userName} ha sido cambiado a ${roleName}.`,
      });
      setTimeout(() => setBanner(null), 4000);
    } else {
      setBanner({ type: "error", text: res.error || "Error al actualizar el rol" });
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (
      !confirm(
        `¿Eliminar definitivamente a ${userName}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

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
            Administración de cuentas registradas, asignación de roles y contraseñas
          </p>
        </div>

        {/* Filtros de rol */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card p-1">
          <button
            onClick={() => setRoleFilter("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              roleFilter === "ALL"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("ADMIN")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              roleFilter === "ADMIN"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admins ({adminCount})</span>
          </button>
          <button
            onClick={() => setRoleFilter("USER")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              roleFilter === "USER"
                ? "bg-secondary text-secondary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Integrantes ({memberCount})</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mt-6 flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico..."
            className="w-full rounded-2xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="mt-6 space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              No se encontraron usuarios
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search
                ? "Prueba con otro término de búsqueda"
                : "No hay usuarios registrados en esta categoría"}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelf = user.id === currentUserId;
            const isLoading = actionLoading === user.id;

            return (
              <div
                key={user.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Info del usuario */}
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground font-bold text-base shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{user.name}</span>
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          ADMINISTRADOR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <User className="h-3 w-3" />
                          INTEGRANTE
                        </span>
                      )}
                      {isSelf && (
                        <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                          Tú (Sesión actual)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Acciones del administrador */}
                <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3 sm:border-0 sm:pt-0">
                  {/* Selector interactivo de cambio de rol */}
                  <div className="flex items-center gap-1.5">
                    {isSelf ? (
                      <span className="text-[11px] text-muted-foreground italic px-2">
                        Rol fijo en tu sesión
                      </span>
                    ) : (
                      <div className="flex items-center rounded-xl border border-border bg-background p-1 shadow-inner">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => {
                            if (user.role !== "USER") {
                              handleRoleChange(user.id, user.name, "USER");
                            }
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            user.role === "USER"
                              ? "bg-secondary text-secondary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                          } disabled:opacity-50`}
                          title="Asignar rol de Integrante"
                        >
                          <User className="h-3 w-3" />
                          <span>Integrante</span>
                        </button>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => {
                            if (user.role !== "ADMIN") {
                              handleRoleChange(user.id, user.name, "ADMIN");
                            }
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            user.role === "ADMIN"
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                              : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                          } disabled:opacity-50`}
                          title="Asignar rol de Administrador"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <span>Admin</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón cambiar contraseña del usuario */}
                    <button
                      type="button"
                      onClick={() => setPasswordModalUser(user)}
                      disabled={isLoading}
                      title={`Cambiar contraseña de ${user.name}`}
                      className="flex h-8 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all disabled:opacity-50"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-primary" />
                      <span className="hidden sm:inline">Contraseña</span>
                    </button>

                    {/* Botón eliminar usuario */}
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={isLoading}
                        title="Eliminar usuario"
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para que el Admin cambie la contraseña de un usuario */}
      <AdminChangePasswordModal
        isOpen={!!passwordModalUser}
        onClose={() => setPasswordModalUser(null)}
        user={passwordModalUser}
      />
    </div>
  );
}
