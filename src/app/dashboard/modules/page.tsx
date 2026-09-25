import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModulesClient } from "@/components/ModulesClient";

export default async function ModulesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const rawModules = await prisma.module.findMany({
    orderBy: { name: "asc" },
    include: {
      items: {
        select: { totalUnits: true },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  const modulesWithUnits = rawModules.map((mod) => ({
    id: mod.id,
    name: mod.name,
    _count: mod._count,
    totalUnits: mod.items.reduce((acc, curr) => acc + curr.totalUnits, 0),
  }));

  return (
    <ModulesClient
      initialModules={modulesWithUnits}
      userRole={session.user.role || "USER"}
    />
  );
}
