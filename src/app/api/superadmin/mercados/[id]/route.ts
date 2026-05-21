import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function checkAuth() {
  const jar = await cookies();
  const val = jar.get("sa-auth")?.value;
  return val && val === process.env.SUPERADMIN_SECRET;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const { status, trialDays, subscriptionDays } = await req.json();

  const updateData: Record<string, unknown> = {};

  if (status) updateData.status = status;

  if (trialDays) {
    const d = new Date();
    d.setDate(d.getDate() + Number(trialDays));
    updateData.trialEndsAt = d;
    updateData.status = "TRIAL";
  }

  if (subscriptionDays) {
    const d = new Date();
    d.setDate(d.getDate() + Number(subscriptionDays));
    updateData.subscriptionExpiresAt = d;
    updateData.status = "ACTIVE";
  }

  const market = await prisma.market.update({ where: { id }, data: updateData });
  return NextResponse.json(market);
}
