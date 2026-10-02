"use client";

import { useState } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { changeMyPassword } from "@/app/actions/auth";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    if (loading) return;
    setError(null);
    setSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las nuevas contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    try {
      const res = await changeMyPassword(formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        console.error("Detalle técnico al cambiar contraseña:", res.error);
        setError("Ha ocurrido un error");
      }
    } catch (err: any) {
      console.error("Detalle técnico al comunicarse con el servidor:", err);
      setError("Ha ocurrido un error");
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

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Cambiar Contraseña
              </h2>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
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
              ¡Contraseña actualizada con éxito!
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tu nueva clave de acceso ya está activa.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Contraseña actual */}
            <div className="space-y-1.5">
              <label
                htmlFor="currentPassword"
                className="text-xs font-semibold text-foreground"
              >
                Contraseña actual
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Tu contraseña actual"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="text-xs font-semibold text-foreground"
              >
                Nueva contraseña
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar nueva contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-semibold text-foreground"
              >
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  placeholder="Repite la nueva contraseña"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Guardar contraseña</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
