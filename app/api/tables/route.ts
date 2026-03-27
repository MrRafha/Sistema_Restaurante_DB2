import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({ orderBy: { label: "asc" } });
    return NextResponse.json(tables);
  } catch {
    return NextResponse.json({ error: "Erro ao listar mesas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.label) {
      return NextResponse.json({ error: "Identificação da mesa é obrigatória" }, { status: 400 });
    }
    const table = await prisma.table.create({
      data: {
        label: body.label,
        capacity: body.capacity ? Number(body.capacity) : null,
      },
    });
    return NextResponse.json(table, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar mesa" }, { status: 500 });
  }
}
