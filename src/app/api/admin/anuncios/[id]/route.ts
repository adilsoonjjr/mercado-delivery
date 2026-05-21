import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN" || !session.user.marketId) return null;
  return session;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const { id } = await params;
  const data = await req.json();
  const existing = await prisma.announcement.findFirst({ where: { id, marketId: session.user.marketId } });
  if (!existing) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  const item = await prisma.announcement.update({
    where: { id },
    data: { title: data.title, content: data.content || null, type: data.type, isActive: data.isActive },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.announcement.findFirst({ where: { id, marketId: session.user.marketId } });
  if (!existing) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
