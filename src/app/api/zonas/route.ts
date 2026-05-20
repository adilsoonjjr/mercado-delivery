import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, fee: true, estimatedMinutes: true },
  });
  return NextResponse.json(zones);
}
