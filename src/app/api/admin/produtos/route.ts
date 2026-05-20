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
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  const data = await req.json();
  const product = await prisma.product.create({
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
  return NextResponse.json(product, { status: 201 });
}
