"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function savePushSubscription(subscriptionJson: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushSubscription: subscriptionJson },
  });

  return { success: true };
}

export async function removePushSubscription() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushSubscription: null },
  });

  return { success: true };
}

export async function getPushSubscriptionStatus() {
  const session = await auth();
  if (!session?.user?.id) {
    return { isSubscribed: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pushSubscription: true },
  });

  return { isSubscribed: !!user?.pushSubscription };
}
