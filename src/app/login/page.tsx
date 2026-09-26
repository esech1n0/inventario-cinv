"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { requestLoginOTP, resendLoginOTP, loginWithOTP } from "@/app/actions/auth";
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otp = otpDigits.join("");

  // UI status
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Referencias a los 6 casilleros de entrada PIN
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Contador de enfriamiento (cooldown)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Enfocar el primer casillero al pasar al paso 2 (OTP)
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Manejador para rellenar múltiples dígitos (pegar texto o autocompletar)
  function handlePastedString(pasted: string) {
    const clean = pasted.replace(/\D/g, "").slice(0, 6);
    if (!clean) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < clean.length; i++) {
      next[i] = clean[i];
    }
    setOtpDigits(next);

    const targetFocus = Math.min(5, clean.length < 6 ? clean.length : 5);
    inputRefs.current[targetFocus]?.focus();
  }

  function handleDigitChange(index: number, val: string) {
    const clean = val.replace(/\D/g, "");

    // Si borró el valor
    if (!clean) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    // Si pegó una cadena larga o autocompletado en este casillero
    if (clean.length > 1) {
      handlePastedString(clean);
      return;
    }

    // Valor de 1 dígito
    const next = [...otpDigits];
    next[index] = clean[0];
    setOtpDigits(next);

    // Auto-avance al siguiente casillero si no es el último
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        // Casillero actual vacío: borrar el anterior y retroceder
        const next = [...otpDigits];
        next[index - 1] = "";
        setOtpDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    handlePastedString(pasted);
  }

  // Manejar paso 1: Solicitar código OTP
  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccessMsg("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const result = await requestLoginOTP(formData);
      setLoading(false);

      if (!result.success) {
        setError(result.error || "Error al verificar credenciales");
        if (result.cooldownRemaining) {
          setCooldown(result.cooldownRemaining);
        }
      } else {
        setStep("otp");
        setCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        if (result.devOtp) {
          setDevCode(result.devOtp);
        }
        setSuccessMsg(`Código de verificación enviado a ${result.email || email}`);
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Error al conectar con el servidor";
      setError(msg);
    }
  }

  // Manejar reenvío de OTP
  async function handleResendOTP() {
    if (cooldown > 0 || resending || loading) return;

    setError("");
    setSuccessMsg("");
    setResending(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const result = await resendLoginOTP(formData);
      setResending(false);

      if (!result.success) {
        setError(result.error || "No se pudo reenviar el código");
        if (result.cooldownRemaining) {
          setCooldown(result.cooldownRemaining);
        }
      } else {
        setCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        if (result.devOtp) {
          setDevCode(result.devOtp);
        }
        setSuccessMsg("¡Se ha enviado un nuevo código a tu correo!");
        setTimeout(() => setSuccessMsg(""), 5000);
        inputRefs.current[0]?.focus();
      }
    } catch (err: unknown) {
      setResending(false);
      const msg = err instanceof Error ? err.message : "Error al reenviar código";
      setError(msg);
    }
  }

  // Manejar paso 2: Validar código OTP y acceder
  async function handleOTPSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (otp.length < 6) {
      setError("Ingresa los 6 dígitos del código de verificación");
      return;
    }

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("otp", otp);

    try {
      const result = await loginWithOTP(formData);
      if (!result.success) {
        setError(result.error || "Error al verificar código");
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
              {step === "credentials"
                ? "Inicia sesión para acceder al sistema"
                : "Verificación en dos pasos (2FA)"}
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
                {step === "credentials" ? "Verificando credenciales..." : "Validando código 2FA..."}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {step === "credentials"
                  ? "Generando código OTP seguro para tu cuenta"
                  : "Accediendo de forma segura al inventario"}
              </p>
            </div>
          )}

          {/* Mensajes de Alerta */}
          {error && (
            <div className="mb-4 animate-fade-in flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !error && (
            <div className="mb-4 animate-fade-in flex items-center gap-2 rounded-xl bg-success/10 p-3 text-xs sm:text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PASO 1: Ingreso de correo y contraseña */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
              >
                <span>Continuar a verificación 2FA</span>
                <KeyRound className="h-4 w-4" />
              </button>

              <div className="mt-5 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:underline"
                >
                  Regístrate aquí
                </Link>
              </div>
            </form>
          )}

          {/* PASO 2: Verificación OTP (2FA con 6 casillas PIN) */}
          {step === "otp" && (
            <div className="animate-fade-in space-y-5">
              <div className="flex items-center gap-3 rounded-2xl bg-primary/10 p-3.5 border border-primary/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    Código de un solo uso enviado
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Revisa tu bandeja de entrada en{" "}
                    <strong className="text-foreground">{email}</strong>
                  </p>
                </div>
              </div>

              {/* Modo Desarrollo / Simulación Local */}
              {devCode && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">💡 Modo Desarrollo (Simulado):</span>
                    <button
                      type="button"
                      onClick={() => handlePastedString(devCode)}
                      className="rounded bg-amber-500/20 px-2 py-0.5 font-bold hover:bg-amber-500/30 transition-colors"
                    >
                      Pegar {devCode}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] opacity-90">
                    Tu código OTP generado es: <strong className="font-mono text-sm tracking-wider">{devCode}</strong>
                  </p>
                </div>
              )}

              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                    Ingresa el código de 6 dígitos
                  </label>

                  {/* 6 Casillas individuales con auto-avance y paste */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-1">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={index === 0 ? 6 : 1}
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        value={digit}
                        disabled={loading}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={`h-12 w-10 sm:h-14 sm:w-12 rounded-xl sm:rounded-2xl border-2 text-center font-mono text-xl sm:text-2xl font-extrabold outline-none transition-all ${
                          digit
                            ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                            : "border-input bg-background text-foreground hover:border-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/20"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-center text-[11px] text-muted-foreground">
                    El código expira en 10 minutos
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Validar Código y Entrar</span>
                </button>
              </form>

              {/* Botón de reenvío con cooldown y botón volver */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={cooldown > 0 || resending || loading}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                  {cooldown > 0
                    ? `Reenviar nuevo código en ${cooldown}s`
                    : "Reenviar código de verificación"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setError("");
                    setSuccessMsg("");
                    setOtpDigits(["", "", "", "", "", ""]);
                  }}
                  className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Cambiar correo o contraseña</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
