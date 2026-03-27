import { NextRequest, NextResponse } from "next/server";
import { createCustomer, listCustomers } from "@/services/customerService";

export async function GET() {
  try {
    const customers = await listCustomers();
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json({ error: "Erro ao listar clientes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: "Nome e telefone sao obrigatorios" },
        { status: 400 }
      );
    }

    const customer = await createCustomer({
      name: String(body.name),
      phone: String(body.phone),
      cpf: body.cpf ? String(body.cpf) : undefined,
      email: body.email ? String(body.email) : undefined,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao cadastrar cliente";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
