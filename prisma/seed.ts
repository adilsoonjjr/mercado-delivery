import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@mercado.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@mercado.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const catFrutas = await prisma.category.upsert({
    where: { id: "cat-frutas" },
    update: {},
    create: { id: "cat-frutas", name: "Frutas", emoji: "🍎" },
  });
  const catLaticinios = await prisma.category.upsert({
    where: { id: "cat-laticinios" },
    update: {},
    create: { id: "cat-laticinios", name: "Laticínios", emoji: "🥛" },
  });
  const catPadaria = await prisma.category.upsert({
    where: { id: "cat-padaria" },
    update: {},
    create: { id: "cat-padaria", name: "Padaria", emoji: "🍞" },
  });
  const catBebidas = await prisma.category.upsert({
    where: { id: "cat-bebidas" },
    update: {},
    create: { id: "cat-bebidas", name: "Bebidas", emoji: "🧃" },
  });

  const products = [
    { name: "Banana Prata (kg)", price: 4.99, stock: 50, categoryId: catFrutas.id },
    { name: "Maçã Fuji (kg)", price: 7.99, stock: 30, categoryId: catFrutas.id },
    { name: "Laranja Pera (kg)", price: 3.49, stock: 60, categoryId: catFrutas.id, promotionalPrice: 2.99 },
    { name: "Leite Integral 1L", price: 5.49, stock: 40, categoryId: catLaticinios.id },
    { name: "Queijo Mussarela (kg)", price: 32.9, stock: 15, categoryId: catLaticinios.id },
    { name: "Iogurte Natural 170g", price: 2.99, stock: 25, categoryId: catLaticinios.id },
    { name: "Pão Francês (unid.)", price: 0.75, stock: 100, categoryId: catPadaria.id },
    { name: "Pão de Forma 500g", price: 8.9, stock: 20, categoryId: catPadaria.id, promotionalPrice: 6.99 },
    { name: "Água Mineral 500ml", price: 1.99, stock: 80, categoryId: catBebidas.id },
    { name: "Refrigerante Cola 2L", price: 7.49, stock: 30, categoryId: catBebidas.id },
    { name: "Suco de Uva 1L", price: 9.99, stock: 20, categoryId: catBebidas.id },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  await prisma.announcement.createMany({
    data: [
      {
        title: "🎉 Bem-vindo ao nosso delivery!",
        content: "Pedidos a partir das 8h até as 20h. Entrega em até 45 minutos.",
        type: "info",
      },
      {
        title: "Promoção da Semana",
        content: "Laranja Pera e Pão de Forma com desconto especial!",
        type: "promo",
      },
    ],
    skipDuplicates: true,
  });

  const existing = await prisma.deliveryConfig.findFirst();
  if (!existing) {
    await prisma.deliveryConfig.create({
      data: {
        fee: 5.0,
        minOrderValue: 20.0,
        estimatedMinutes: 45,
        isDeliveryActive: true,
        marketName: "Mercado do Bairro",
        marketPhone: "(11) 99999-9999",
      },
    });
  }

  console.log("✅ Seed concluído!");
  console.log("   Admin: admin@mercado.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
