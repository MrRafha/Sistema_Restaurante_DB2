import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TableStatus } from "@/app/generated/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const table = await prisma.table.findUnique({ where: { id: Number(id) } });
    if (!table) return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 });
    return NextResponse.json(table);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar mesa" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const table = await prisma.table.update({
      where: { id: Number(id) },
      data: {
        ...(body.status && { status: body.status as TableStatus }),
        ...(body.label && { label: body.label }),
        ...(body.capacity !== undefined && { capacity: body.capacity }),
      },
    });
    return NextResponse.json(table);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar mesa" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const activeOrders = await prisma.order.count({
      where: {
        tableId: Number(id),
        status: { notIn: ["ENTREGUE", "CANCELADO"] },
      },
    });
    if (activeOrders > 0) {
      return NextResponse.json(
        { error: "Mesa possui pedidos ativos. Encerre os pedidos antes de excluir." },
        { status: 409 }
      );
    }
    await prisma.table.delete({ where: { id: Number(id) } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir mesa" }, { status: 500 });
  }
}
