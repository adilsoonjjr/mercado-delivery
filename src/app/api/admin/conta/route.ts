import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { currentPassword, newEmail, newPassword } = await req.json();

  if (!currentPassword) {
    return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
  }
  if (!newEmail && !newPassword) {
    return NextResponse.json({ error: "Informe o novo e-mail ou nova senha." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (newEmail) {
    const emailLower = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    const existing = await prisma.user.findFirst({
      where: { email: emailLower, NOT: { id: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 400 });
    }
    updateData.email = emailLower;
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({ where: { id: session.user.id }, data: updateData });

  return NextResponse.json({ ok: true });
}
