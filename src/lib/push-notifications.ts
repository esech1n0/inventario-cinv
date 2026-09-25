import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let isVapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (isVapidConfigured) return true;

  const rawPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const rawPriv = process.env.VAPID_PRIVATE_KEY;
  const rawSub = process.env.VAPID_SUBJECT || "mailto:admin@cinv.org";

  if (!rawPub || !rawPriv) {
    return false;
  }

  // Clean keys: strip surrounding quotes, whitespace, and potential padding issues
  const cleanPub = rawPub.replace(/["']/g, "").trim();
  const cleanPriv = rawPriv.replace(/["']/g, "").trim();
  const cleanSub = rawSub.replace(/["']/g, "").trim();

  try {
    webpush.setVapidDetails(cleanSub, cleanPub, cleanPriv);
    isVapidConfigured = true;
    return true;
  } catch (error: any) {
    console.error("Aviso: No se pudo inicializar VAPID para notificaciones push:", error?.message || error);
    return false;
  }
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushNotificationToUser(
  userId: string,
  payload: PushPayload
) {
  try {
    if (!ensureVapidConfigured()) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });

    if (!user?.pushSubscription) return;

    const subscription = JSON.parse(user.pushSubscription);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error("Error al enviar notificación push al usuario:", error);
  }
}

export async function broadcastPushNotification(payload: PushPayload) {
  try {
    if (!ensureVapidConfigured()) return;

    const users = await prisma.user.findMany({
      where: {
        pushSubscription: { not: null },
      },
      select: { pushSubscription: true, id: true },
    });

    const sendPromises = users.map(async (u) => {
      if (!u.pushSubscription) return;
      try {
        const sub = JSON.parse(u.pushSubscription);
        await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await prisma.user.update({
            where: { id: u.id },
            data: { pushSubscription: null },
          });
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error("Error en broadcast push:", error);
  }
}
