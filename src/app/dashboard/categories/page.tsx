import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModulesClient } from "@/components/ModulesClient";

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let modulesWithUnits: any[] = [];
  let dbError: string | null = null;

  try {
    const rawModules = await prisma.module.findMany({
      orderBy: { name: "asc" },
      include: {
        items: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            packagingType: true,
            packs: true,
            unitsPerPack: true,
            totalUnits: true,
            createdAt: true,
          },
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
      items: mod.items.map((it) => ({
        ...it,
        createdAt: it.createdAt instanceof Date ? it.createdAt.toISOString() : it.createdAt,
      })),
    }));
  } catch (error: any) {
    console.error("Error al cargar categorías en CategoriesPage:", error);
    dbError = error?.message || "Error al conectar con la base de datos";
  }

  return (
    <>
      {dbError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <strong>Atención:</strong> No se pudieron cargar las categorías ({dbError}).
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
