import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMarket } from "@/lib/market";

export async function POST(req: Request) {
  const market = await getCurrentMarket();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const session = await auth();
  const sub = await req.json();

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Dados de subscription inválidos." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userId: session?.user.id ?? null,
      marketId: market.id,
    },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userId: session?.user.id ?? null,
      marketId: market.id,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
