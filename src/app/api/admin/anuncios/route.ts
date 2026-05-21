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
  const items = await prisma.announcement.findMany({
    where: { marketId: session.user.marketId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const data = await req.json();
  const item = await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content || null,
      type: data.type ?? "info",
      isActive: data.isActive ?? true,
      marketId: session.user.marketId,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
