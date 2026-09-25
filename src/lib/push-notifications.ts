import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@cinv.org";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushNotificationToUser(userId: string, payload: PushPayload) {
  try {
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
        // Si la suscripción expiró o es inválida (410 Gone / 404), removerla
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
