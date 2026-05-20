import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const config = await prisma.deliveryConfig.findFirst();
  return NextResponse.json(config ?? {});
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const data = await req.json();
  const existing = await prisma.deliveryConfig.findFirst();

  const config = existing
    ? await prisma.deliveryConfig.update({
        where: { id: existing.id },
        data: {
          marketName: data.marketName,
          marketPhone: data.marketPhone,
          fee: data.fee,
          minOrderValue: data.minOrderValue,
          estimatedMinutes: data.estimatedMinutes,
          isDeliveryActive: data.isDeliveryActive,
        },
      })
    : await prisma.deliveryConfig.create({ data });

  return NextResponse.json(config);
}
