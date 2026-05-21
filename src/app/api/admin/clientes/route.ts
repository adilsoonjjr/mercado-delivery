import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  // Return customers who have placed at least one order at this market
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      orders: { some: { marketId: session.user.marketId } },
    },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map(({ passwordHash: _, ...u }) => u)
  );
}
