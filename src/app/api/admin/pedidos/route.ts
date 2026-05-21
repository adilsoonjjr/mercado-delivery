import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: { marketId: session.user.marketId },
    include: {
      user: { select: { name: true, email: true, phone: true, cpf: true, address: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
