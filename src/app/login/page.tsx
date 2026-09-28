"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/auth";
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI status
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email.trim());
    formData.append("password", password);

    try {
      const result = await loginUser(formData);
      if (!result.success) {
        setError(result.error || "Credenciales inválidas");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      // Si Next.js lanzó una redirección interna, ignorarla
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as Record<string, unknown>).message === "string" &&
        ((err as Record<string, unknown>).message as string).includes("NEXT_REDIRECT")
      ) {
        return;
      }
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Error al conectar con el servidor";
      setError(msg);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-background to-indigo-50 px-4 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20">
      <div className="animate-fade-in w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center p-2">
            <Image
              src="/images/cinv.png"
              alt="Logo CINV"
              width={160}
              height={80}
              priority
              className="h-16 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Inventario CINV</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inicia sesión con las credenciales otorgadas por el administrador
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
          {/* Overlay de Carga */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/90 backdrop-blur-md transition-all animate-fade-in p-6 text-center">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute h-16 w-16 rounded-full bg-primary/20 animate-ping" />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
              </div>
              <h3 className="text-base font-bold text-foreground">
                Iniciando sesión...
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Comprobando credenciales de acceso
              </p>
            </div>
          )}

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-4 animate-fade-in flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario de Login directo */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
            >
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </button>

            <div className="mt-5 rounded-2xl border border-border/60 bg-muted/40 p-3 text-center text-xs text-muted-foreground">
              Las cuentas son registradas directamente por el administrador. Podrás cambiar tu contraseña en cualquier momento una vez dentro del sistema.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
