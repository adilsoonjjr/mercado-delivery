import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMarket } from "@/lib/market";

export async function GET() {
  const market = await getCurrentMarket();
  if (!market) {
    return NextResponse.json({ fee: 5, minOrderValue: 0, estimatedMinutes: 45, isDeliveryActive: true, marketName: "Mercado" });
  }
  const config = await prisma.deliveryConfig.findFirst({ where: { marketId: market.id } });
  return NextResponse.json(config ?? { fee: 5, minOrderValue: 0, estimatedMinutes: 45, isDeliveryActive: true, marketName: "Mercado" });
}
