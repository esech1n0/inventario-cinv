import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModulesClient } from "@/components/ModulesClient";

export default async function ModulesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let modulesWithUnits: { id: string; name: string; _count: { items: number }; totalUnits: number }[] = [];
  let dbError: string | null = null;

  try {
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

    modulesWithUnits = rawModules.map((mod) => ({
      id: mod.id,
      name: mod.name,
      _count: mod._count,
      totalUnits: mod.items.reduce((acc, curr) => acc + curr.totalUnits, 0),
    }));
  } catch (error: any) {
    console.error("Error al cargar módulos en ModulesPage:", error);
    dbError = error?.message || "Error al conectar con la base de datos";
  }

  return (
    <>
      {dbError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <strong>Atención:</strong> No se pudieron cargar los módulos ({dbError}).
          </div>
        </div>
      )}
      <ModulesClient
        initialModules={modulesWithUnits}
        userRole={session.user.role || "USER"}
      />
    </>
  );
}
