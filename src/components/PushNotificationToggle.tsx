"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/app/actions/notifications";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Registrar service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          return reg.pushManager.getSubscription();
        })
        .then((sub) => {
          setIsSubscribed(!!sub);
        })
        .catch((err) => {
          console.error("Error registrando SW:", err);
        });
    }
  }, []);

  async function toggleSubscription() {
    if (!isSupported) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Desuscribir
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
        await removePushSubscription();
        setIsSubscribed(false);
      } else {
        // Solicitar permiso
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== "granted") {
          setLoading(false);
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("Falta VAPID Public Key");
          setLoading(false);
          return;
        }

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });

        await savePushSubscription(JSON.stringify(sub));
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Error en toggle push:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) return null;

  return (
    <button
      onClick={toggleSubscription}
      disabled={loading || permission === "denied"}
      title={
        permission === "denied"
          ? "Notificaciones bloqueadas en el navegador"
          : isSubscribed
          ? "Desactivar notificaciones push"
          : "Activar notificaciones push"
      }
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
        isSubscribed
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <>
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </>
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </button>
  );
}
