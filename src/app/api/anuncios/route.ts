import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMarket } from "@/lib/market";

export async function GET() {
  const market = await getCurrentMarket();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const items = await prisma.announcement.findMany({
    where: { isActive: true, marketId: market.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}
