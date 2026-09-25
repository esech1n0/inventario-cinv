import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HistoryClient } from "@/components/HistoryClient";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        include: {
          module: { select: { name: true } },
        },
      },
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    take: 100,
  });

  return <HistoryClient initialTransactions={transactions} />;
}
