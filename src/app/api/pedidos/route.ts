import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishNewOrder } from "@/lib/events";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { items, deliveryAddress, paymentMethod, notes, deliveryFee, changeFor, zoneName } = await req.json();

  if (!items?.length || !deliveryAddress || !paymentMethod) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const subtotal = items.reduce(
    (s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity,
    0
  );
  const total = subtotal + (deliveryFee ?? 0);

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      subtotal,
      deliveryFee: deliveryFee ?? 0,
      total,
      paymentMethod,
      changeFor: paymentMethod === "CASH" && changeFor ? parseFloat(changeFor) : null,
      deliveryAddress,
      zoneName: zoneName || null,
      notes: notes || null,
      items: {
        create: items.map((i: { productId: string; name: string; price: number; quantity: number }) => ({
          productId: i.productId,
          productName: i.name,
          productPrice: i.price,
          quantity: i.quantity,
          subtotal: i.price * i.quantity,
        })),
      },
    },
    include: {
      items: true,
      user: { select: { name: true, email: true, phone: true, cpf: true } },
    },
  });

  // Notify connected admin clients in real-time
  publishNewOrder(order as unknown as Record<string, unknown>);

  return NextResponse.json(order, { status: 201 });
}
