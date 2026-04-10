import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function getPeriodStart(period: string | null): Date | undefined {
  const now = new Date();
  if (period === "15d") {
    return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  }
  if (period === "1m") {
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
  if (period === "3m") {
    return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  }
  return undefined; // "all"
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const customerId = Number(id);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const periodStart = getPeriodStart(period);

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId,
        ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { dish: true } },
        table: true,
      },
    });

    return NextResponse.json({ customer, orders });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar pedidos do cliente." }, { status: 500 });
  }
}
