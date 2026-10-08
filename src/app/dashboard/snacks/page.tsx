import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSnackSettings } from "@/app/actions/snacks";
import { getWeekKey } from "@/lib/week";
import { SnacksClient, type SnackOption, type MySnack } from "@/components/SnacksClient";

export const metadata = {
  title: "Mis snacks | Inventario CINV",
  description: "Escoge y registra los snacks que tomarás esta semana.",
};

export default async function SnacksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const weekKey = getWeekKey();
  let options: SnackOption[] = [];
  let mySnacks: MySnack[] = [];
  let futureSnacks: { id: string; name: string; weekKey: string }[] = [];
  let limit = 3;
  let configured = false;
  let dbError: string | null = null;

  try {
    const settings = await getSnackSettings();
    limit = settings.weeklySnackLimit;
    configured = !!settings.snackModuleId;

    const [selections, futureSelections] = await Promise.all([
      prisma.snackSelection.findMany({
        where: { userId: session.user.id, weekKey },
        orderBy: { createdAt: "asc" },
        include: { item: { select: { name: true } } },
      }),
      prisma.snackSelection.findMany({
        where: {
          userId: session.user.id,
          weekKey: { gt: weekKey },
          takenAt: { not: null },
        },
        orderBy: { weekKey: "asc" },
        include: { item: { select: { name: true } } },
      }),
    ]);

    mySnacks = selections.map((s) => ({
      id: s.id,
      itemId: s.itemId,
      name: s.item.name,
      takenAt: s.takenAt ? s.takenAt.toISOString() : null,
    }));

    futureSnacks = futureSelections.map((s) => ({
      id: s.id,
      name: s.item.name,
      weekKey: s.weekKey,
    }));

    if (settings.snackModuleId) {
      const [items, reserved] = await Promise.all([
        prisma.item.findMany({
          where: { moduleId: settings.snackModuleId },
          orderBy: { name: "asc" },
          select: { id: true, name: true, totalUnits: true },
        }),
        prisma.snackSelection.groupBy({
          by: ["itemId"],
          where: { weekKey, takenAt: null },
          _count: { _all: true },
        }),
      ]);
      const reservedMap = new Map(reserved.map((r) => [r.itemId, r._count._all]));
      options = items.map((i) => ({
        id: i.id,
        name: i.name,
        available: Math.max(i.totalUnits - (reservedMap.get(i.id) ?? 0), 0),
      }));
    }
  } catch (error: unknown) {
    console.error("Error al cargar snacks:", error);
    dbError = error instanceof Error ? error.message : "Error al conectar con la base de datos";
  }

  return (
    <>
      {dbError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <strong>Atención:</strong> No se pudieron cargar los snacks ({dbError}).
          </div>
        </div>
      )}
      <SnacksClient
        weekKey={weekKey}
        limit={limit}
        configured={configured}
        options={options}
        initialSnacks={mySnacks}
        futureSnacks={futureSnacks}
      />
    </>
  );
}
