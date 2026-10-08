"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Bell,
  BellOff,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  savePushSubscription,
  removePushSubscription,
  getVapidPublicKey,
} from "@/app/actions/notifications";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { toast } from "@/components/Toast";
import { updateSnackSettings } from "@/app/actions/snacks";
import { Cookie } from "lucide-react";

export interface CategoryOption {
  id: string;
  name: string;
}

interface ConfiguracionClientProps {
  user: {
    name: string;
    email: string;
    email: string;
    role: string;
  };
  snackSettings: {
    weeklySnackLimit: number;
    snackModuleId: string | null;
  };
  categories: CategoryOption[];
}

function urlBase64ToUint8Array(base64String: string) {
  const cleanKey = (base64String || "").replace(/["']/g, "").trim();
  const padding = "=".repeat((4 - (cleanKey.length % 4)) % 4);
  const base64 = (cleanKey + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function ConfiguracionClient({ user, snackSettings, categories }: ConfiguracionClientProps) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Snack settings state
  const [snackLimit, setSnackLimit] = useState(snackSettings.weeklySnackLimit);
  const [snackCategory, setSnackCategory] = useState(snackSettings.snackModuleId || "");
  const [savingSnacks, setSavingSnacks] = useState(false);

  // Push notifications state
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setIsPushSupported(true);
          setPushPermission(Notification.permission);
          return reg.pushManager.getSubscription();
        })
        .then((sub) => {
          setIsSubscribed(!!sub);
        })
        .catch((err) => {
          console.error("Error registrando SW en configuración:", err);
        });
    }
  }, []);

  async function togglePushSubscription() {
    if (!isPushSupported) return;
    setPushLoading(true);
    setPushFeedback(null);
    setPushError(null);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
        await removePushSubscription();
        setIsSubscribed(false);
        setPushFeedback("Notificaciones desactivadas en este dispositivo.");
        toast.info("Notificaciones desactivadas.");
      } else {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);

        if (perm !== "granted") {
          console.warn("Permiso de notificaciones no concedido:", perm);
          setPushError("Ha ocurrido un error");
          toast.error("Ha ocurrido un error");
          setPushLoading(false);
          return;
        }

        let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          try {
            vapidPublicKey = await getVapidPublicKey();
          } catch (fetchKeyErr) {
            console.warn("Aviso al obtener llave VAPID del servidor:", fetchKeyErr);
          }
        }
        if (!vapidPublicKey) {
          vapidPublicKey = "BLl_h_cqUORAwh12lLIUOn-lIXpLGhUK2XCJX9winI0Mifq5yYuSti99Mb0P75Jh_OyJ_y-9z_ahukDbCRJxGcI";
        }

        // Limpiar suscripciones previas o desfasadas para evitar AbortError / push service error
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          try {
            await existingSub.unsubscribe();
          } catch (unsubErr) {
            console.warn("Aviso al limpiar suscripción push previa:", unsubErr);
          }
        }

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        let sub: PushSubscription;
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });
        } catch (subErr: any) {
          // Intentar con buffer directo en caso de incompatibilidad de ArrayBufferView en Chromium
          if (subErr?.name === "AbortError" && convertedKey.buffer) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey.buffer,
            });
          } else {
            throw subErr;
          }
        }

        await savePushSubscription(JSON.stringify(sub));
        setIsSubscribed(true);
        setPushFeedback("¡Notificaciones activadas con éxito en este dispositivo!");
        toast.success("Notificaciones push activadas correctamente.");
      }
    } catch (error) {
      // Detalle técnico exacto registrado exclusivamente en la consola / logs
      console.error("Error al configurar push:", error);
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(
          "[CINV - Aviso Brave/Chromium]: El error 'Registration failed - push service error' ocurre porque el navegador no puede conectar con los servidores FCM de Google.\n" +
          "Solución en Brave:\n" +
          "1. Es INDISPENSABLE reiniciar Brave completamente (cerrar todas las pestañas/ventanas de Brave y volverlo a abrir) para que el servicio FCM empiece a correr tras activarlo en brave://settings/privacy.\n" +
          "2. En la barra de direcciones de localhost:3000, haz clic en el ícono del león (Escudos de Brave / Shields) y desactívalo para este sitio, ya que por defecto bloquea la conexión push a Google."
        );
      }
      // Mensaje genérico en rojo para la interfaz del usuario
      setPushError("Ha ocurrido un error");
      toast.error("Ha ocurrido un error");
    } finally {
      setPushLoading(false);
      setTimeout(() => {
        setPushFeedback(null);
        setPushError(null);
      }, 5000);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header de Configuración */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Configuración del Sistema
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Cuenta de usuario, preferencias de notificaciones y seguridad de acceso.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Datos del Usuario */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
            <UserIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Datos del Usuario
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nombre del Usuario */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Nombre del Usuario</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-foreground">
                {user.name}
              </p>
            </div>

            {/* Correo del Usuario */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Mail className="h-3.5 w-3.5" />
                <span>Correo Electrónico</span>
              </div>
              <p className="mt-1.5 text-base font-bold text-foreground break-all">
                {user.email}
              </p>
            </div>
          </div>

          {/* Rol / Permisos */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-background p-3.5">
            <div className="flex items-center gap-2.5">
              {isAdmin ? (
                <ShieldCheck className="h-5 w-5 text-primary" />
              ) : (
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Nivel de Acceso y Permisos
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isAdmin
                    ? "Control total: altas, bajas, edición de stock y usuarios."
                    : "Consulta de stock, registro de salidas y entradas de material."}
                </p>
              </div>
            </div>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${
                isAdmin
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isAdmin ? "Administrador" : "Integrante"}
            </span>
          </div>
        </section>

        {/* Sección 3: Notificaciones (Activar/Apagar con texto explicativo) */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Notificaciones del Sistema
              </h2>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${
                isSubscribed
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isSubscribed ? "Activadas" : "Desactivadas"}
            </span>
          </div>

          {/* Texto explicativo sobre la función de las notificaciones */}
          <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Función de las notificaciones en esta aplicación:</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Las notificaciones te mantienen informado al instante sobre cualquier actividad relevante en el inventario:
              <strong className="text-foreground"> movimientos hechos por los usuarios</strong> (quién retiró o ingresó material),
              <strong className="text-foreground"> ingresos y reposición de stock</strong>,
              <strong className="text-foreground"> cambios en el catálogo de productos</strong> y
              <strong className="text-foreground"> alertas de stock bajo</strong> para garantizar que nunca falten insumos clave en los eventos y actividades de la coordinación.
            </p>
          </div>

          {/* Feedback de error en color rojo genérico */}
          {pushError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-semibold text-destructive animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pushError}</span>
            </div>
          )}

          {/* Feedback de éxito */}
          {pushFeedback && !pushError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{pushFeedback}</span>
            </div>
          )}

          {/* Control para Activar / Apagar Notificaciones */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/60 bg-background p-4">
            <div>
              <p className="text-sm font-bold text-foreground">
                {isSubscribed
                  ? "Las notificaciones push están activadas"
                  : "Las notificaciones push están desactivadas"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isSubscribed
                  ? "Este dispositivo recibirá avisos cuando ocurran movimientos en el inventario."
                  : "Actívalas para enterarte en tiempo real cuando se registren salidas o ingresos."}
              </p>
            </div>

            <button
              onClick={togglePushSubscription}
              disabled={pushLoading || pushPermission === "denied"}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                isSubscribed
                  ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-hover"
              }`}
            >
              {pushLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4" />
                  <span>Desactivar Notificaciones</span>
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  <span>Activar Notificaciones</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Sección de Snacks (Solo Administradores) */}
        {isAdmin && (
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
              <Cookie className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-foreground">
                Configuración de Snacks Semanales
              </h2>
            </div>
            
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background p-4">
                 <label className="block text-sm font-bold text-foreground mb-1">
                   Límite Semanal de Snacks
                 </label>
                 <p className="mb-3 text-xs text-muted-foreground">
                   Cantidad máxima de snacks que un usuario puede apartar por semana.
                 </p>
                 <input
                    type="number"
                    min="1"
                    max="50"
                    value={snackLimit}
                    onChange={(e) => setSnackLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  />
              </div>

              <div className="rounded-xl border border-border/60 bg-background p-4">
                 <label className="block text-sm font-bold text-foreground mb-1">
                   Categoría de Inventario
                 </label>
                 <p className="mb-3 text-xs text-muted-foreground">
                   Elige qué categoría (módulo) contiene los snacks para esta función.
                 </p>
                 <select
                    value={snackCategory}
                    onChange={(e) => setSnackCategory(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  >
                    <option value="" disabled>-- Selecciona una categoría --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
              <button
                onClick={handleSaveSnackSettings}
                disabled={savingSnacks}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
              >
                {savingSnacks && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Configuración
              </button>
            </div>
          </section>
        )}

        {/* Sección 4: Opción de Cambiar Contraseña */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Seguridad y Contraseña
            </h2>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/60 bg-background p-4">
            <div>
              <p className="text-sm font-bold text-foreground">
                Contraseña de acceso
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Actualiza tu clave de acceso periódicamente para proteger tu cuenta.
              </p>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-bold hover:opacity-90 active:scale-95 transition-all shrink-0"
            >
              <KeyRound className="h-4 w-4" />
              <span>Cambiar Contraseña</span>
            </button>
          </div>
        </section>
      </div>

      {/* Modal para cambiar contraseña */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={user.email}
      />
    </div>
  );
}
