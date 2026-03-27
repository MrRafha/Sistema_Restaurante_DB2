import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import { config } from "dotenv";

// Carrega o .env da raiz do projeto
config({ path: path.join(process.cwd(), ".env") });

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
// libsql exige caminho absoluto com barras normais no Windows
function resolveDbUrl(url: string): string {
  if (url.startsWith("file:") && !url.startsWith("file:///") && !url.startsWith("file://")) {
    const relativePart = url.slice(5); // remove o prefixo "file:"
    const absPath = path.resolve(process.cwd(), relativePart).replace(/\\/g, "/");
    return `file:${absPath}`;
  }
  return url;
}
const resolvedUrl = resolveDbUrl(dbUrl);

const adapter = new PrismaLibSql({ url: resolvedUrl });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱 Iniciando seed...");

  // ==========================================================================
  // DELETE — Limpa todas as tabelas antes de popular
  // Equivalente SQL: DELETE FROM OrderItem; DELETE FROM Order; ...
  //
  // deleteMany() sem argumento remove TODOS os registros da tabela.
  // A ordem importa: devemos deletar os filhos antes dos pais para não
  // violar as foreign keys (restrições de integridade referencial).
  //   OrderItem depende de Order e Dish → deleta primeiro
  //   Order depende de Table           → deleta depois
  //   Dish e Table são independentes   → deletamos por último
  // ==========================================================================
  await prisma.orderItem.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.table.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.category.deleteMany();

  // ==========================================================================
  // INSERT — Categorias dos pratos
  // ==========================================================================
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Entrada" } }),
    prisma.category.create({ data: { name: "Prato Principal" } }),
    prisma.category.create({ data: { name: "Sobremesa" } }),
    prisma.category.create({ data: { name: "Bebida" } }),
    prisma.category.create({ data: { name: "Lanche" } }),
    prisma.category.create({ data: { name: "Porção" } }),
  ]);
  console.log(`✅ ${categories.length} categorias criadas`);

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  // ==========================================================================
  // INSERT — Funcionários do restaurante
  // ==========================================================================
  const employees = await Promise.all([
    prisma.employee.create({ data: { name: "Ana Souza", role: "Garçom", salary: 2200 } }),
    prisma.employee.create({ data: { name: "Carlos Lima", role: "Garçom", salary: 2200 } }),
    prisma.employee.create({ data: { name: "Fernanda Costa", role: "Gerente", salary: 4500 } }),
  ]);
  console.log(`✅ ${employees.length} funcionários criados`);

  // ==========================================================================
  // INSERT — Insere os pratos iniciais no banco
  // Equivalente SQL: INSERT INTO Dish (name, description, price, ...) VALUES (...);
  //
  // Promise.all() executa todos os `create` em paralelo, ou seja, envia
  // vários INSERTs ao mesmo tempo em vez de esperar um terminar para começar
  // o próximo — muito mais rápido para seeds grandes.
  // ==========================================================================
  const dishes = await Promise.all([
    prisma.dish.create({
      data: {
        name: "Caldo Verde",
        description: "Sopa cremosa de batata com couve e chouriço",
        price: 18.9,
        qtyAvailable: 20,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Entrada"],
      },
    }),
    prisma.dish.create({
      data: {
        name: "Bruschetta de Tomate",
        description: "Pão italiano tostado com tomate, manjericão e azeite",
        price: 22.5,
        qtyAvailable: 15,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Entrada"],
      },
    }),
    prisma.dish.create({
      data: {
        name: "Frango Grelhado",
        description: "Filé de frango grelhado com legumes salteados e arroz",
        price: 42.9,
        qtyAvailable: 12,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Prato Principal"],
      },
    }),
    prisma.dish.create({
      data: {
        name: "Risoto de Cogumelos",
        description: "Risoto cremoso com mix de cogumelos e parmesão",
        price: 52.0,
        qtyAvailable: 8,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Prato Principal"],
      },
    }),
    prisma.dish.create({
      data: {
        name: "Salmão na Brasa",
        description: "Postas de salmão grelhadas com purê de batata-doce",
        price: 67.9,
        qtyAvailable: 6,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Prato Principal"],
      },
    }),
    prisma.dish.create({
      data: {
        name: "Picanha na Chapa",
        description: "Picanha grelhada com farofa, vinagrete e batata frita",
        price: 79.9,
        qtyAvailable: 5,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Prato Principal"],
      },
    }),
    prisma.dish.create({
      data: {
        name: "Petit Gâteau",
        description: "Bolo de chocolate quente com sorvete de creme",
        price: 28.0,
        qtyAvailable: 18,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Sobremesa"],
      },
    }),
    prisma.dish.create({
      data: {
        name: "Pudim de Leite",
        description: "Pudim de leite condensado com calda de caramelo",
        price: 19.9,
        qtyAvailable: 14,
        isActive: true,
        isAvailable: true,
        categoryId: catMap["Sobremesa"],
      },
    }),
  ]);

  console.log(`✅ ${dishes.length} pratos criados`);

  // ==========================================================================
  // INSERT — Insere as mesas do restaurante
  // Equivalente SQL: INSERT INTO Table (label, capacity) VALUES ('01', 2), ...;
  //
  // tableData é definido como array em memória e então mapeado para INSERTs.
  // Cada elemento vira um prisma.table.create(), todos rodando em paralelo
  // com Promise.all() assim como foi feito nos pratos acima.
  // ==========================================================================
  const tableData = [
    { numero: 1, label: "01", capacity: 2 },
    { numero: 2, label: "02", capacity: 2 },
    { numero: 3, label: "03", capacity: 4 },
    { numero: 4, label: "04", capacity: 4 },
    { numero: 5, label: "05", capacity: 6 },
    { numero: 6, label: "06", capacity: 8 },
  ];

  const tables = await Promise.all(
    tableData.map((t) => prisma.table.create({ data: t }))
  );
  console.log(`✅ ${tables.length} mesas criadas`);

  // ========================================================================
  // INSERT — Clientes para associar aos pedidos
  // ========================================================================
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Joao Pereira",
        phone: "11990001111",
        email: "joao.pereira@email.com",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Marina Alves",
        phone: "11990002222",
        email: "marina.alves@email.com",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Rafael Gomes",
        phone: "11990003333",
        email: "rafael.gomes@email.com",
      },
    }),
  ]);
  console.log(`✅ ${customers.length} clientes criados`);

  // ========================================================================
  // INSERT — Pedidos com itens para validar consultas JOIN
  // ========================================================================
  const order1Total = Number((dishes[0].price * 1 + dishes[2].price * 1).toFixed(2));
  const order2Total = Number((dishes[3].price * 1 + dishes[7].price * 2).toFixed(2));
  const order3Total = Number((dishes[1].price * 1 + dishes[6].price * 1 + dishes[4].price * 1).toFixed(2));

  const orders = await Promise.all([
    prisma.order.create({
      data: {
        status: "ENTREGUE",
        channel: "DINE_IN",
        tableId: tables[0].id,
        customerId: customers[0].id,
        employeeId: employees[0].id,
        totalAmount: order1Total,
        items: {
          create: [
            {
              dishId: dishes[0].id,
              quantity: 1,
              unitPrice: dishes[0].price,
              subtotal: Number((dishes[0].price * 1).toFixed(2)),
            },
            {
              dishId: dishes[2].id,
              quantity: 1,
              unitPrice: dishes[2].price,
              subtotal: Number((dishes[2].price * 1).toFixed(2)),
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        status: "EM_PREPARO",
        channel: "TAKEAWAY",
        customerId: customers[1].id,
        employeeId: employees[1].id,
        totalAmount: order2Total,
        items: {
          create: [
            {
              dishId: dishes[3].id,
              quantity: 1,
              unitPrice: dishes[3].price,
              subtotal: Number((dishes[3].price * 1).toFixed(2)),
            },
            {
              dishId: dishes[7].id,
              quantity: 2,
              unitPrice: dishes[7].price,
              subtotal: Number((dishes[7].price * 2).toFixed(2)),
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        status: "RECEBIDO",
        channel: "ONLINE",
        tableId: tables[2].id,
        customerId: customers[2].id,
        employeeId: employees[0].id,
        totalAmount: order3Total,
        items: {
          create: [
            {
              dishId: dishes[1].id,
              quantity: 1,
              unitPrice: dishes[1].price,
              subtotal: Number((dishes[1].price * 1).toFixed(2)),
            },
            {
              dishId: dishes[6].id,
              quantity: 1,
              unitPrice: dishes[6].price,
              subtotal: Number((dishes[6].price * 1).toFixed(2)),
            },
            {
              dishId: dishes[4].id,
              quantity: 1,
              unitPrice: dishes[4].price,
              subtotal: Number((dishes[4].price * 1).toFixed(2)),
            },
          ],
        },
      },
    }),
  ]);

  await Promise.all([
    prisma.customer.update({
      where: { id: customers[0].id },
      data: { orderCount: 1 },
    }),
    prisma.customer.update({
      where: { id: customers[1].id },
      data: { orderCount: 1 },
    }),
    prisma.customer.update({
      where: { id: customers[2].id },
      data: { orderCount: 1 },
    }),
  ]);

  console.log(`✅ ${orders.length} pedidos criados com itens`);
  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\nPara acessar o admin, use a senha: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
