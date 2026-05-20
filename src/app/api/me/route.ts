import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, cpf: true, address: true },
  });

  return NextResponse.json(user ?? {});
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { name, phone, cpf, address, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const updateData: Record<string, unknown> = {};

  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (cpf !== undefined) updateData.cpf = cpf || null;
  if (address !== undefined) updateData.address = address || null;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Informe a senha atual para trocar a senha." }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({ where: { id: session.user.id }, data: updateData });

  return NextResponse.json({ ok: true });
}
