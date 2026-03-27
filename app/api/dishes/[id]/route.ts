import { NextRequest, NextResponse } from "next/server";
import {
  getDish,
  updateDish,
  adjustStock,
  toggleActive,
  deleteDish,
} from "@/services/dishService";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const dish = await getDish(Number(id));
    if (!dish) return NextResponse.json({ error: "Prato não encontrado" }, { status: 404 });
    return NextResponse.json(dish);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar prato" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const dish = await updateDish(Number(id), body);
    return NextResponse.json(dish);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar prato" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();

    if (body.action === "toggle-active") {
      const dish = await toggleActive(Number(id));
      return NextResponse.json(dish);
    }

    if (body.action === "adjust-stock" && typeof body.delta === "number") {
      const dish = await adjustStock(Number(id), body.delta);
      return NextResponse.json(dish);
    }

    const dish = await updateDish(Number(id), body);
    return NextResponse.json(dish);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar prato" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteDish(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir prato" }, { status: 500 });
  }
}
