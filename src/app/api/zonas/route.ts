import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMarket } from "@/lib/market";

export async function GET() {
  const market = await getCurrentMarket();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true, marketId: market.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, fee: true, estimatedMinutes: true },
  });
  return NextResponse.json(zones);
}
