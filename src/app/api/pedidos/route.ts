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

  const { items, deliveryAddress, paymentMethod, notes, zoneId, changeFor } = await req.json();

  if (!items?.length || !deliveryAddress || !paymentMethod) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  // Calculate delivery fee server-side — never trust client-provided value
  let deliveryFee = 0;
  let zoneName: string | null = null;

  if (zoneId) {
    const zone = await prisma.deliveryZone.findFirst({ where: { id: zoneId, isActive: true } });
    if (!zone) return NextResponse.json({ error: "Zona de entrega inválida." }, { status: 400 });
    deliveryFee = zone.fee;
    zoneName = zone.name;
  } else {
    const config = await prisma.deliveryConfig.findFirst();
    deliveryFee = config?.fee ?? 0;
  }

  // Fetch real prices from DB — never trust client-provided prices
  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, price: true, promotionalPrice: true, stock: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Um ou mais produtos não estão disponíveis." }, { status: 400 });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems = items.map((i: { productId: string; quantity: number }) => {
    const product = productMap.get(i.productId)!;
    const unitPrice = product.promotionalPrice ?? product.price;
    return {
      productId: product.id,
      productName: product.name,
      productPrice: unitPrice,
      quantity: i.quantity,
      subtotal: unitPrice * i.quantity,
    };
  });

  const subtotal = orderItems.reduce((s: number, i: { subtotal: number }) => s + i.subtotal, 0);
  const total = subtotal + deliveryFee;

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      changeFor: paymentMethod === "CASH" && changeFor ? parseFloat(changeFor) : null,
      deliveryAddress,
      zoneName: zoneName || null,
      notes: notes || null,
      items: {
        create: orderItems,
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
