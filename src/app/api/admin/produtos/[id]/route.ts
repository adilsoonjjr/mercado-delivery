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
  // Verify ownership before update
  const existing = await prisma.product.findFirst({ where: { id, marketId: session.user.marketId } });
  if (!existing) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      promotionalPrice: data.promotionalPrice || null,
      stock: data.stock,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive ?? true,
      categoryId: data.categoryId || null,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.product.findFirst({ where: { id, marketId: session.user.marketId } });
  if (!existing) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
