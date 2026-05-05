import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus, cancelOrder } from "@/services/orderService";
import { OrderStatus } from "@/app/generated/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const order = await getOrder(Number(id));
    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();

    if (body.action === "cancel") {
      const order = await cancelOrder(Number(id));
      return NextResponse.json(order);
    }

    if (body.status) {
      const order = await updateOrderStatus(Number(id), body.status as OrderStatus);
      return NextResponse.json(order);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar pedido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
