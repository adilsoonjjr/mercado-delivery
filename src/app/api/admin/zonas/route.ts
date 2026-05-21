import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const zones = await prisma.deliveryZone.findMany({
    where: { marketId: session.user.marketId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(zones);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const data = await req.json();
  const zone = await prisma.deliveryZone.create({
    data: {
      name: data.name,
      fee: data.fee,
      estimatedMinutes: data.estimatedMinutes ?? 45,
      isActive: data.isActive ?? true,
      marketId: session.user.marketId,
    },
  });
  return NextResponse.json(zone, { status: 201 });
}
