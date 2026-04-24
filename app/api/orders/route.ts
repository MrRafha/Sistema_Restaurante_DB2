import { NextRequest, NextResponse } from "next/server";
import { listOrders, createOrder } from "@/services/orderService";
import { findOrCreateCustomer } from "@/services/customerService";
import { OrderStatus } from "@/app/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as OrderStatus | null;
    const orders = await listOrders(status ?? undefined);
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao listar pedidos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.channel || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Canal e itens do pedido são obrigatórios" },
        { status: 400 }
      );
    }

    if (!body.customerPhone || !body.customerName) {
      return NextResponse.json(
        { error: "Telefone e nome do cliente são obrigatórios." },
        { status: 400 }
      );
    }

    if (
      body.channel === "ONLINE" &&
      (!body.deliveryStreet || !body.deliveryNumber || !body.deliveryNeighborhood)
    ) {
      return NextResponse.json(
        { error: "Rua, número e bairro são obrigatórios para pedidos de entrega." },
        { status: 400 }
      );
    }

    const { customer } = await findOrCreateCustomer(
      String(body.customerPhone),
      String(body.customerName)
    );
    const customerId = customer.id;

    const order = await createOrder({
      channel: body.channel,
      tableId: body.tableId,
      customerId,
      items: body.items,
      notes: body.notes,
      deliveryStreet: body.deliveryStreet,
      deliveryNumber: body.deliveryNumber,
      deliveryComplement: body.deliveryComplement,
      deliveryNeighborhood: body.deliveryNeighborhood,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar pedido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
