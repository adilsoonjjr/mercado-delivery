import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMarket } from "@/lib/market";

export async function GET() {
  const market = await getCurrentMarket();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const products = await prisma.product.findMany({
    where: { isActive: true, marketId: market.id },
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json(products);
}
