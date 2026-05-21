import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMarket } from "@/lib/market";

export async function GET() {
  const market = await getCurrentMarket();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const categories = await prisma.category.findMany({
    where: { marketId: market.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}
