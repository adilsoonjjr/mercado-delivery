import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishStatusUpdate } from "@/lib/events";
import { sendPushToUser } from "@/lib/push";

const STATUS_MSG: Record<string, { title: string; body: string }> = {
  CONFIRMED: { title: "Pedido confirmado! ✅", body: "Seu pedido foi confirmado e está sendo preparado." },
  PREPARING:  { title: "Preparando seu pedido 👨‍🍳", body: "Estamos preparando seu pedido agora." },
  DELIVERING: { title: "Pedido saiu para entrega 🛵", body: "Seu pedido está a caminho!" },
  DELIVERED:  { title: "Pedido entregue! 🎉", body: "Seu pedido foi entregue. Bom apetite!" },
  CANCELLED:  { title: "Pedido cancelado ❌", body: "Seu pedido foi cancelado. Entre em contato se tiver dúvidas." },
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const existing = await prisma.order.findFirst({
    where: { id, marketId: session.user.marketId },
    select: { id: true, userId: true, marketId: true },
  });
  if (!existing) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const order = await prisma.order.update({ where: { id }, data: { status } });
  publishStatusUpdate(id, status, session.user.marketId);

  // Push notification to the customer
  const msg = STATUS_MSG[status];
  if (msg && existing.userId) {
    sendPushToUser(existing.userId, session.user.marketId, {
      ...msg,
      url: "/meus-pedidos",
      tag: `order-${id}`,
    }).catch(() => {});
  }

  return NextResponse.json(order);
}
