import { NextRequest, NextResponse } from "next/server";
import {
  listDishes,
  createDish,
  CreateDishInput,
} from "@/services/dishService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get("active") === "true";
    const dishes = await listDishes(onlyActive);
    return NextResponse.json(dishes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao listar pratos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateDishInput = await request.json();
    if (!body.name || body.price === undefined) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 }
      );
    }
    const dish = await createDish(body);
    return NextResponse.json(dish, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar prato" }, { status: 500 });
  }
}
