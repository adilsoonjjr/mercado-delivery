import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.deliveryConfig.findFirst();
  return NextResponse.json(config ?? { fee: 5, minOrderValue: 0, estimatedMinutes: 45, isDeliveryActive: true, marketName: "Mercado" });
}
