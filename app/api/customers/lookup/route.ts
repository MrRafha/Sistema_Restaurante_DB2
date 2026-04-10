import { NextRequest, NextResponse } from "next/server";
import { findCustomerByPhone } from "@/services/customerService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Telefone é obrigatório." }, { status: 400 });
  }

  try {
    const customer = await findCustomerByPhone(phone);
    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar cliente";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
