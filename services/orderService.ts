import { prisma } from "@/lib/prisma";
import { Channel, OrderStatus } from "@/app/generated/prisma";

// =============================================================================
// DML — orderService.ts
// Operações de banco de dados para pedidos (Order), itens de pedido (OrderItem)
// e impactos em mesa (Table) e estoque (Dish).
//
// Ponto chave: pedidos envolvem múltiplas tabelas ao mesmo tempo, por isso as
// funções mais complexas usam TRANSACTION — garantindo que todas as operações
// sejam salvas juntas ou revertidas juntas em caso de erro.
// =============================================================================

export interface OrderItemInput {
  dishId: number;
  quantity: number;
}

export interface CreateOrderInput {
  channel: Channel;
  tableId?: number;
  customerId?: number;
  items: OrderItemInput[];
}

// -----------------------------------------------------------------------------
// TRANSACTION com INSERT + UPDATE em múltiplas tabelas
// Uma transaction agrupa várias operações: se qualquer uma falhar,
// o banco desfaz tudo (ROLLBACK) como se nada tivesse acontecido.
//
// Fluxo desta função:
//  1. Valida se a mesa existe (SELECT em Table)
//  2. Busca todos os pratos do pedido de uma vez (SELECT em Dish — IN)
//  3. Valida disponibilidade e estoque de cada prato (verificação em memória)
//  4. Desconta o estoque de cada prato (UPDATE em Dish)
//  5. Cria o pedido e seus itens em uma única chamada (INSERT em Order + OrderItem)
//  6. Marca a mesa como ocupada (UPDATE em Table)
// -----------------------------------------------------------------------------
export async function createOrder(data: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    // PASSO 0 — Valida cliente se informado
    if (data.customerId !== undefined) {
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) {
        throw new Error(`Cliente ID ${data.customerId} não encontrado.`);
      }
    }

    // PASSO 1 — SELECT em Table para validar que a mesa existe
    if (data.channel === "DINE_IN") {
      if (!data.tableId) {
        throw new Error("Pedido no salão exige uma mesa.");
      }
      const table = await tx.table.findUnique({ where: { id: data.tableId } });
      if (!table) {
        throw new Error(`Mesa ID ${data.tableId} não encontrada.`);
      }
    }

    // PASSO 2 — SELECT em Dish com cláusula IN
    // Equivalente SQL: SELECT * FROM Dish WHERE id IN (1, 2, 3, ...);
    // Busca todos os pratos de uma vez só para evitar N consultas.
    const dishIds = data.items.map((i) => i.dishId);
    const dishes = await tx.dish.findMany({
      where: { id: { in: dishIds } },
    });
    // Organiza em um Map (id → prato) para acesso O(1) nas etapas seguintes
    const dishMap = new Map(dishes.map((d) => [d.id, d]));

    // PASSO 3 — Validações em memória (sem consulta extra ao banco)
    for (const item of data.items) {
      const dish = dishMap.get(item.dishId);
      if (!dish) throw new Error(`Prato ID ${item.dishId} não encontrado.`);
      if (!dish.isActive || !dish.isAvailable)
        throw new Error(`Prato "${dish.name}" não está disponível.`);
      if (dish.qtyAvailable < item.quantity)
        throw new Error(
          `Estoque insuficiente para "${dish.name}". Disponível: ${dish.qtyAvailable}.`
        );
    }

    // PASSO 4 — UPDATE em Dish: desconta o estoque de cada prato pedido
    // Equivalente SQL: UPDATE Dish SET qtyAvailable = ?, isAvailable = ? WHERE id = ?;
    for (const item of data.items) {
      const dish = dishMap.get(item.dishId)!;
      const newQty = dish.qtyAvailable - item.quantity;
      await tx.dish.update({
        where: { id: item.dishId },
        data: {
          qtyAvailable: newQty,
          isAvailable: newQty > 0, // desativa automaticamente se zerar o estoque
        },
      });
    }

    // Cálculo do total em memória (sem ir ao banco)
    const totalAmount = data.items.reduce((sum, item) => {
      const dish = dishMap.get(item.dishId)!;
      return sum + dish.price * item.quantity;
    }, 0);

    // PASSO 5 — INSERT aninhado: cria Order e seus OrderItems em uma só chamada
    // O Prisma traduz isso para:
    //   INSERT INTO Order (...) VALUES (...);
    //   INSERT INTO OrderItem (...) VALUES (...), (...), ...;
    // O `include` no final faz JOINs para retornar o objeto completo.
    const order = await tx.order.create({
      data: {
        channel: data.channel,
        tableId: data.tableId,
        customerId: data.customerId,
        totalAmount,
        items: {
          // `create` dentro de uma relação = INSERT nos registros filhos
          create: data.items.map((item) => {
            const dish = dishMap.get(item.dishId)!;
            return {
              dishId: item.dishId,
              quantity: item.quantity,
              unitPrice: dish.price,          // preço no momento do pedido
              subtotal: dish.price * item.quantity,
            };
          }),
        },
      },
      // include = JOIN: traz junto os itens, os pratos de cada item e a mesa
      include: { items: { include: { dish: true } }, table: true },
    });

    // PASSO 6 — UPDATE em Table: marca a mesa como ocupada
    if (data.channel === "DINE_IN" && data.tableId) {
      await tx.table.update({
        where: { id: data.tableId },
        data: { status: "OCCUPIED" },
      });
    }

    return order;
  });
}

// -----------------------------------------------------------------------------
// SELECT com JOIN (include) e ORDER BY
// Equivalente SQL:
//   SELECT o.*, oi.*, d.*, t.*
//   FROM Order o
//   LEFT JOIN OrderItem oi ON oi.orderId = o.id
//   LEFT JOIN Dish d       ON d.id = oi.dishId
//   LEFT JOIN Table t      ON t.id = o.tableId
//   [WHERE o.status = ?]
//   ORDER BY o.createdAt DESC;
//
// include → instrui o Prisma a fazer o JOIN e retornar os dados relacionados.
// -----------------------------------------------------------------------------
export async function listOrders(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { dish: true } }, // JOIN OrderItem → Dish
      table: true,                          // JOIN Table
    },
  });
}

// -----------------------------------------------------------------------------
// SELECT por chave primária com JOIN
// Equivalente SQL:
//   SELECT o.*, oi.*, d.*, t.* FROM Order o ... WHERE o.id = ?;
// -----------------------------------------------------------------------------
export async function getOrder(id: number) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: { include: { dish: true } }, table: true },
  });
}

// -----------------------------------------------------------------------------
// TRANSACTION com SELECT + UPDATE em múltiplas tabelas
//
// Fluxo desta função:
//  1. Busca o pedido com seus itens (SELECT em Order + OrderItem)
//  2. Se for cancelamento, devolve o estoque de cada prato (UPDATE em Dish)
//  3. Atualiza o status do pedido (UPDATE em Order)
//  4. Se não houver mais pedidos ativos, libera a mesa (SELECT count + UPDATE em Table)
// -----------------------------------------------------------------------------
export async function updateOrderStatus(id: number, status: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    // PASSO 1 — SELECT com include para ter os itens disponíveis em memória
    const order = await tx.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, table: true },
    });

    // Guarda se o pedido já estava em estado final para evitar duplicar devoluções
    const terminalStatuses: OrderStatus[] = ["ENTREGUE", "CANCELADO"];
    const wasTerminal = terminalStatuses.includes(order.status);

    // PASSO 2 — UPDATE em Dish: devolve estoque ao cancelar
    // Equivalente SQL: UPDATE Dish SET qtyAvailable = ?, isAvailable = 1 WHERE id = ?;
    if (status === "CANCELADO" && !wasTerminal) {
      for (const item of order.items) {
        const dish = await tx.dish.findUnique({ where: { id: item.dishId } });
        if (dish) {
          const newQty = dish.qtyAvailable + item.quantity; // devolve a quantidade
          await tx.dish.update({
            where: { id: item.dishId },
            data: { qtyAvailable: newQty, isAvailable: true },
          });
        }
      }
    }

    // PASSO 3 — UPDATE em Order: muda o status do pedido
    const updatedOrder = await tx.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { dish: true } }, table: true },
    });

    // PASSO 4 — Libera a mesa se não houver mais pedidos ativos
    if (
      order.tableId &&
      (status === "ENTREGUE" || status === "CANCELADO")
    ) {
      // SELECT COUNT(*) FROM Order WHERE tableId = ? AND id != ? AND status NOT IN (...)
      // count() retorna o número de registros que batem com o filtro
      const activeOrders = await tx.order.count({
        where: {
          tableId: order.tableId,
          id: { not: id },
          status: { notIn: ["ENTREGUE", "CANCELADO"] },
        },
      });
      if (activeOrders === 0) {
        // Nenhum pedido ativo restante: libera a mesa
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "FREE" },
        });
      }
    }

    return updatedOrder;
  });
}

// Atalho para cancelar — apenas chama updateOrderStatus com status fixo
export async function cancelOrder(id: number) {
  return updateOrderStatus(id, "CANCELADO");
}
