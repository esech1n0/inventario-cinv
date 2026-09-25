"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function getUsers() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return [];
  }

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveUser(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Solo administradores" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isApproved: true },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function suspendUser(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Solo administradores" };
  }

  if (userId === session.user.id) {
    return { success: false, error: "No puedes suspenderte a ti mismo" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isApproved: false },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Solo administradores" };
  }

  if (userId === session.user.id) {
    return { success: false, error: "No puedes eliminarte a ti mismo" };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}
