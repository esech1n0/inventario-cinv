import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InventoryClient } from "@/components/InventoryClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [modules, items] = await Promise.all([
    prisma.module.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.item.findMany({
      orderBy: { name: "asc" },
      include: {
        module: {
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  return (
    <InventoryClient
      initialItems={items}
      modules={modules}
      userRole={session.user.role || "USER"}
    />
  );
}
