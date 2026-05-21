import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMarket } from "@/lib/market";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const market = await getCurrentMarket();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, marketId: market.id },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json(order);
}
