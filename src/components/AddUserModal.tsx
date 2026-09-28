"use client";

import { useState } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { createUser, CreatedUserData } from "@/app/actions/users";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: CreatedUserData) => void;
}

export function AddUserModal({ isOpen, onClose, onUserCreated }: AddUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    if (loading) return;
    setError(null);
    setSuccess(false);
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setShowPassword(false);
    onClose();
  }

  function handleGeneratePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setShowPassword(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Ingresa un correo electrónico válido");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("password", password);
    formData.append("role", role);

    try {
      const res = await createUser(formData);
      if (res.success && res.data) {
        setSuccess(true);
        onUserCreated(res.data);
        setTimeout(() => {
          handleClose();
        }, 1600);
      } else {
        setError(res.error || "No se pudo registrar el usuario");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con el servidor";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Card */}
      <div className="relative z-50 w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Registrar Nuevo Usuario
              </h2>
              <p className="text-xs text-muted-foreground">
                Asigna nombre, correo, contraseña de acceso y rol
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              ¡Usuario registrado exitosamente!
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ya puede iniciar sesión de inmediato con las credenciales asignadas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <label
                htmlFor="newUserName"
                className="text-xs font-semibold text-foreground"
              >
                Nombre Completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="newUserName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Ej. Juan Pérez"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <label
                htmlFor="newUserEmail"
                className="text-xs font-semibold text-foreground"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="newUserEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="ejemplo@cinv.org"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Contraseña Inicial */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="newUserPassword"
                  className="text-xs font-semibold text-foreground"
                >
                  Contraseña Inicial
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Sugerir clave</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="newUserPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                El usuario podrá cambiar su contraseña desde su perfil en cualquier momento.
              </p>
            </div>

            {/* Selección de Rol */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-foreground block">
                Rol en el Sistema
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Opción Integrante */}
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all ${
                    role === "USER"
                      ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                        role === "USER"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Integrante
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Acceso al inventario, consumo de insumos y creación de módulos.
                  </span>
                </button>

                {/* Opción Administrador */}
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all ${
                    role === "ADMIN"
                      ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                        role === "ADMIN"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Administrador
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Control total: auditoría, eliminación y gestión de usuarios.
                  </span>
                </button>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={handleClose}
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
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>Registrar Usuario</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
