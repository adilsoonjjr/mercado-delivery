import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }
  const categories = await prisma.category.findMany({
    where: { marketId: session.user.marketId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }
  const { name, emoji } = await req.json();
  const cat = await prisma.category.create({
    data: { name, emoji: emoji || "🛒", marketId: session.user.marketId },
  });
  return NextResponse.json(cat, { status: 201 });
}
